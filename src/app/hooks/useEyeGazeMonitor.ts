import { useEffect, useRef, useState, type RefObject } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type GazeState = {
  isCameraReady: boolean;
  hasFace: boolean;
  isLookingAtScreen: boolean;
  error: string | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task';

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

export function useEyeGazeMonitor(enabled: boolean): GazeState {
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
          baseOptions: {
            modelAssetPath: FACE_MODEL_URL,
          },
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

  return {
    isCameraReady,
    hasFace,
    isLookingAtScreen,
    error,
    videoRef,
  };
}
