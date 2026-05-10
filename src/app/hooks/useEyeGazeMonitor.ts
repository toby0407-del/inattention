import { useEffect, useRef, useState, type RefObject } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  GazeTracking,
  isNativeIOS,
  type GazeUpdate,
  type GazeError,
  type GazeInterruption,
} from '../native/gazeTracking';
import {
  intersectGazeWithScreenPlane,
  planePointToScreen,
  isPointOnScreen,
  loadCalibration,
  type CalibrationMatrix,
  type ScreenPoint,
} from '../native/gazeProjection';
import type { PluginListenerHandle } from '@capacitor/core';

export type GazeSource = 'native' | 'web' | 'none';

export type GazeState = {
  /** 鏡頭是否就緒（native 模式下代表 ARKit session 跑起來；web 模式下代表 getUserMedia OK） */
  isCameraReady: boolean;
  /** 是否偵測到使用者 */
  hasFace: boolean;
  /** 是否在看螢幕。判斷規則：
   *  - native: 投影到螢幕的注視點落在 [0, w] × [0, h] 範圍內
   *  - web: 虹膜在眼眶中央區間（粗略） */
  isLookingAtScreen: boolean;
  error: string | null;
  /** Web 模式下會掛上 video 元素；native 模式下永遠是 ref.current = null */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 訊號來源 */
  source: GazeSource;
  /** Native 模式下：當前螢幕注視點（px）；其他模式下為 null */
  screenPoint: ScreenPoint | null;
  /** Native 模式下：使用的校準矩陣，null 表示沒校準（仍會用粗略線性映射） */
  calibration: CalibrationMatrix | null;
};

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

// ===========================================================================
// Web 路徑（原本的 MediaPipe 實作）
// ===========================================================================

function avgPoint(points: Array<{ x: number; y: number }>) {
  if (!points.length) return { x: 0, y: 0 };
  const s = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / points.length, y: s.y / points.length };
}

function inRange(v: number, min: number, max: number) {
  return v >= min && v <= max;
}

function estimateLooking(landmarks: Array<{ x: number; y: number }>) {
  const leftOuter = landmarks[33];
  const leftInner = landmarks[133];
  const rightInner = landmarks[362];
  const rightOuter = landmarks[263];

  if (!leftOuter || !leftInner || !rightInner || !rightOuter) return false;

  const leftIris = avgPoint(
    [landmarks[468], landmarks[469], landmarks[470], landmarks[471], landmarks[472]].filter(Boolean),
  );
  const rightIris = avgPoint(
    [landmarks[473], landmarks[474], landmarks[475], landmarks[476], landmarks[477]].filter(Boolean),
  );

  const leftWidth = Math.abs(leftInner.x - leftOuter.x);
  const rightWidth = Math.abs(rightOuter.x - rightInner.x);
  if (leftWidth < 0.0001 || rightWidth < 0.0001) return false;

  const leftMin = Math.min(leftOuter.x, leftInner.x);
  const rightMin = Math.min(rightInner.x, rightOuter.x);

  const leftRatio = (leftIris.x - leftMin) / leftWidth;
  const rightRatio = (rightIris.x - rightMin) / rightWidth;

  const leftTop = landmarks[159];
  const leftBottom = landmarks[145];
  const rightTop = landmarks[386];
  const rightBottom = landmarks[374];
  const leftHeight = leftTop && leftBottom ? Math.abs(leftBottom.y - leftTop.y) : 0;
  const rightHeight = rightTop && rightBottom ? Math.abs(rightBottom.y - rightTop.y) : 0;

  const leftVRatio =
    leftTop && leftBottom && leftHeight > 0.0001 ? (leftIris.y - Math.min(leftTop.y, leftBottom.y)) / leftHeight : 0.5;
  const rightVRatio =
    rightTop && rightBottom && rightHeight > 0.0001
      ? (rightIris.y - Math.min(rightTop.y, rightBottom.y)) / rightHeight
      : 0.5;

  return (
    inRange(leftRatio, 0.22, 0.78) &&
    inRange(rightRatio, 0.22, 0.78) &&
    inRange(leftVRatio, 0.2, 0.85) &&
    inRange(rightVRatio, 0.2, 0.85)
  );
}

function useWebGazeMonitor(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isLookingAtScreen, setIsLookingAtScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      if (!enabled) return;
      try {
        setError(null);
        const video = videoRef.current;
        if (!video) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();
        if (!mounted) return;
        setIsCameraReady(true);

        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        landmarkerRef.current = faceLandmarker;

        const loop = () => {
          if (!mounted || !landmarkerRef.current || !videoRef.current) return;
          const v = videoRef.current;
          const ts = performance.now();
          const result = landmarkerRef.current.detectForVideo(v, ts);
          const face = result.faceLandmarks?.[0];
          if (!face) {
            setHasFace(false);
            setIsLookingAtScreen(false);
          } else {
            setHasFace(true);
            setIsLookingAtScreen(estimateLooking(face));
          }
          rafRef.current = window.requestAnimationFrame(loop);
        };
        rafRef.current = window.requestAnimationFrame(loop);
      } catch (e) {
        const message = e instanceof Error ? e.message : '無法啟用前鏡頭';
        setError(message);
        setIsCameraReady(false);
      }
    }

    setup();

    return () => {
      mounted = false;
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsCameraReady(false);
      setHasFace(false);
      setIsLookingAtScreen(false);
    };
  }, [enabled]);

  return { isCameraReady, hasFace, isLookingAtScreen, error, videoRef };
}

// ===========================================================================
// Native 路徑（ARKit）
// ===========================================================================

function useNativeGazeMonitor(enabled: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null); // 永遠 null（ARKit 接管鏡頭）
  const handlesRef = useRef<PluginListenerHandle[]>([]);
  const startedRef = useRef(false);

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [isLookingAtScreen, setIsLookingAtScreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenPoint, setScreenPoint] = useState<ScreenPoint | null>(null);
  const [calibration, setCalibration] = useState<CalibrationMatrix | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (startedRef.current) return;
    startedRef.current = true;
    let mounted = true;

    // 載入 calibration（每次啟用時讀一次最新值）
    setCalibration(loadCalibration());

    (async () => {
      try {
        setError(null);
        const sup = await GazeTracking.isSupported();
        if (!sup.supported) {
          if (!mounted) return;
          setError('裝置不支援 ARFaceTrackingConfiguration');
          return;
        }

        const onUpdate = await GazeTracking.addListener('gazeUpdate', (data: GazeUpdate) => {
          if (!data.isTracked) {
            setHasFace(false);
            setIsLookingAtScreen(false);
            setScreenPoint(null);
            return;
          }
          setHasFace(true);
          const plane = intersectGazeWithScreenPlane(data.lookAtWorld, data.leftEyeWorld, data.rightEyeWorld);
          if (!plane) {
            setIsLookingAtScreen(false);
            setScreenPoint(null);
            return;
          }
          const pt = planePointToScreen(plane, window.innerWidth, window.innerHeight, calibration);
          setScreenPoint(pt);
          setIsLookingAtScreen(isPointOnScreen(pt, window.innerWidth, window.innerHeight, 80));
        });
        const onError = await GazeTracking.addListener('gazeError', (data: GazeError) => {
          setError(data.message);
        });
        const onInterrupt = await GazeTracking.addListener('gazeInterruption', (_data: GazeInterruption) => {
          // 中斷時把臉部狀態暫時清掉，避免殘留誤判
          setHasFace(false);
          setIsLookingAtScreen(false);
          setScreenPoint(null);
        });
        handlesRef.current = [onUpdate, onError, onInterrupt];

        await GazeTracking.start();
        if (!mounted) return;
        setIsCameraReady(true);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setIsCameraReady(false);
      }
    })();

    return () => {
      mounted = false;
      startedRef.current = false;
      (async () => {
        try {
          await GazeTracking.stop();
        } catch { /* swallow */ }
        for (const h of handlesRef.current) {
          try {
            await h.remove();
          } catch { /* swallow */ }
        }
        handlesRef.current = [];
      })();
      setIsCameraReady(false);
      setHasFace(false);
      setIsLookingAtScreen(false);
      setScreenPoint(null);
    };
    // 故意不把 calibration 放進 deps：calibration 在啟用時抓一次即可，
    // 中途換 calibration 會引起 listener 重綁，反而更亂；要刷新請重進頁面。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    isCameraReady,
    hasFace,
    isLookingAtScreen,
    error,
    videoRef,
    screenPoint,
    calibration,
  };
}

// ===========================================================================
// 統一入口
// ===========================================================================

/**
 * 視線監控 Hook，自動依平台選 native（ARKit）或 web（MediaPipe）。
 *
 * - iOS native（Capacitor）→ native 路徑：videoRef 不會被填，需另外 UI 處理。
 * - 其他環境 → web 路徑：videoRef 必須掛到 `<video>` 上。
 *
 * source 欄位告訴呼叫端目前走哪條路徑，UI 可依此決定是否顯示鏡頭預覽。
 */
export function useEyeGazeMonitor(enabled: boolean): GazeState {
  const useNative = enabled && isNativeIOS();
  const native = useNativeGazeMonitor(useNative);
  const web = useWebGazeMonitor(enabled && !useNative);

  if (useNative) {
    return {
      isCameraReady: native.isCameraReady,
      hasFace: native.hasFace,
      isLookingAtScreen: native.isLookingAtScreen,
      error: native.error,
      videoRef: native.videoRef,
      source: 'native',
      screenPoint: native.screenPoint,
      calibration: native.calibration,
    };
  }
  return {
    isCameraReady: web.isCameraReady,
    hasFace: web.hasFace,
    isLookingAtScreen: web.isLookingAtScreen,
    error: web.error,
    videoRef: web.videoRef,
    source: enabled ? 'web' : 'none',
    screenPoint: null,
    calibration: null,
  };
}
