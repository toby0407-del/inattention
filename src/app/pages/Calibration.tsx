import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import {
  GazeTracking,
  isNativeIOS,
  type GazeUpdate,
  type GazeError,
} from '../native/gazeTracking';
import {
  intersectGazeWithScreenPlane,
  fitCalibration,
  saveCalibration,
  type CalibrationSample,
  type PlanePoint,
  type CalibrationMatrix,
} from '../native/gazeProjection';
import type { PluginListenerHandle } from '@capacitor/core';

interface CalibPoint {
  id: number;
  /** 0..1 螢幕座標比例 */
  fx: number;
  fy: number;
  label: string;
}

const POINTS: CalibPoint[] = [
  { id: 0, fx: 0.10, fy: 0.15, label: '左上角' },
  { id: 1, fx: 0.90, fy: 0.15, label: '右上角' },
  { id: 2, fx: 0.50, fy: 0.50, label: '正中央' },
  { id: 3, fx: 0.10, fy: 0.85, label: '左下角' },
  { id: 4, fx: 0.90, fy: 0.85, label: '右下角' },
];

/** 蒐集一個校準點需要的時間（毫秒） */
const HOLD_DURATION_MS = 2000;

export default function Calibration() {
  const navigate = useNavigate();
  const [currentPoint, setCurrentPoint] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [allDone, setAllDone] = useState<number[]>([]);

  // ARKit 狀態
  const [nativeReady, setNativeReady] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [hasFace, setHasFace] = useState(false);
  const [savedCalib, setSavedCalib] = useState<CalibrationMatrix | null>(null);

  /** 每點蒐集中的所有 plane 樣本（hold 期間累積） */
  const collectingRef = useRef<PlanePoint[]>([]);
  /** 完成的所有點樣本（給 fitCalibration） */
  const samplesRef = useRef<CalibrationSample[]>([]);
  /** plugin listener handles */
  const handlesRef = useRef<PluginListenerHandle[]>([]);
  /** 啟動鎖（避免 strict mode 雙重啟動） */
  const startedRef = useRef(false);

  // ---- 初始化 ARKit session ----
  useEffect(() => {
    let mounted = true;
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      if (!isNativeIOS()) {
        if (!mounted) return;
        setNativeError('校準需要 iOS native 環境（ARKit）。請在 iPad 上開啟 App。');
        return;
      }
      try {
        const sup = await GazeTracking.isSupported();
        if (!sup.supported) {
          if (!mounted) return;
          setNativeError('此裝置不支援 ARFaceTrackingConfiguration。');
          return;
        }
        const onUpdate = await GazeTracking.addListener('gazeUpdate', (data: GazeUpdate) => {
          setHasFace(data.isTracked);
          if (!data.isTracked) return;
          // hold 期間蒐集 plane points
          if (collectingRef.current === null) return;
          const plane = intersectGazeWithScreenPlane(data.lookAtWorld, data.leftEyeWorld, data.rightEyeWorld);
          if (plane) {
            collectingRef.current.push(plane);
          }
        });
        const onError = await GazeTracking.addListener('gazeError', (data: GazeError) => {
          setNativeError(data.message);
        });
        handlesRef.current = [onUpdate, onError];
        await GazeTracking.start();
        if (!mounted) return;
        setNativeReady(true);
      } catch (e) {
        if (!mounted) return;
        setNativeError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      mounted = false;
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 進度動畫（hold 期間） ----
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isHolding && !done) {
      // 開始蒐集
      collectingRef.current = [];
      const tickMs = 60;
      const step = (tickMs / HOLD_DURATION_MS) * 100;
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval!);
            handlePointDone();
            return 100;
          }
          return p + step;
        });
      }, tickMs);
    } else if (!isHolding) {
      if (progress < 100) setProgress(0);
      collectingRef.current = [];
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHolding]);

  function handlePointDone() {
    setIsHolding(false);

    // 把蒐集到的 plane 樣本平均成一筆，配對到當前螢幕目標
    const collected = collectingRef.current ?? [];
    collectingRef.current = [];
    if (collected.length >= 5 && nativeReady) {
      const avg: PlanePoint = collected.reduce(
        (acc, p) => ({ mx: acc.mx + p.mx, my: acc.my + p.my }),
        { mx: 0, my: 0 },
      );
      avg.mx /= collected.length;
      avg.my /= collected.length;

      const target = POINTS[currentPoint];
      samplesRef.current.push({
        plane: avg,
        target: {
          px: target.fx * window.innerWidth,
          py: target.fy * window.innerHeight,
        },
      });
    }

    setAllDone(prev => [...prev, currentPoint]);
    setProgress(0);

    if (currentPoint < POINTS.length - 1) {
      setTimeout(() => setCurrentPoint(p => p + 1), 600);
    } else {
      // 全部完成 → 擬合
      const calib = fitCalibration(samplesRef.current, window.innerWidth, window.innerHeight);
      if (calib) {
        saveCalibration(calib);
        setSavedCalib(calib);
      }
      setTimeout(() => setDone(true), 800);
    }
  }

  const point = POINTS[currentPoint];
  const cantCalibrate = !!nativeError && !nativeReady;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #1e1060 0%, #0a0520 100%)', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Stars bg */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* ARKit 狀態提示 */}
      <div className="absolute top-3 right-1/2 translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-black/40 border border-white/15 text-[12px] font-bold flex items-center gap-2">
        <span className={
          nativeReady && hasFace ? 'text-emerald-300' :
          nativeReady ? 'text-amber-300' :
          'text-rose-300'
        }>
          {nativeReady ? (hasFace ? '● ARKit 追蹤中' : '○ 等待偵測到臉') : '✕ ARKit 未啟動'}
        </span>
        {nativeError && <span className="text-rose-300">· {nativeError}</span>}
      </div>

      {!done ? (
        <>
          {/* Progress bar */}
          <div className="absolute top-14 left-0 right-0 flex flex-col items-center gap-2 z-10">
            <div className="text-white/60" style={{ fontWeight: 700, fontSize: '14px' }}>
              眼動校正進行中 {currentPoint + 1} / {POINTS.length}
            </div>
            <div className="flex gap-2">
              {POINTS.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: allDone.includes(i)
                      ? '#20c997'
                      : i === currentPoint
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Instruction */}
          <div className="absolute bottom-10 left-0 right-0 text-center z-10">
            <div className="text-white/80" style={{ fontWeight: 700, fontSize: '16px' }}>
              👀 看著發光的目標，長按住它！
            </div>
            <div className="text-white/50 mt-1" style={{ fontWeight: 600, fontSize: '13px' }}>
              盯著目標 {Math.round(HOLD_DURATION_MS / 1000)} 秒，過程中盡量不要轉頭
            </div>
            {cantCalibrate && (
              <div className="text-rose-300 mt-2" style={{ fontWeight: 700, fontSize: '12px' }}>
                ARKit 無法啟動，仍可走完流程但不會儲存校準矩陣
              </div>
            )}
          </div>

          {/* Completed points */}
          {allDone.map(id => (
            <div
              key={id}
              className="absolute"
              style={{
                left: `${POINTS[id].fx * 100}%`,
                top: `${POINTS[id].fy * 100}%`,
                transform: 'translate(-50%,-50%)',
              }}
            >
              <div className="w-8 h-8 rounded-full bg-teal-400/80 flex items-center justify-center text-white text-lg">
                ✓
              </div>
            </div>
          ))}

          {/* Current calibration point */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPoint}
              className="absolute z-20"
              style={{
                left: `${point.fx * 100}%`,
                top: `${point.fy * 100}%`,
                transform: 'translate(-50%,-50%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                className="absolute rounded-full"
                style={{ width: 80, height: 80, top: -24, left: -24, border: '2px solid rgba(255,212,59,0.4)' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              <svg width="60" height="60" className="-rotate-90" style={{ position: 'absolute', top: -14, left: -14 }}>
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                <motion.circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke="#ffd43b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>

              <motion.button
                className="w-8 h-8 rounded-full flex items-center justify-center text-xl shadow-2xl"
                style={{
                  background: progress > 0 ? `rgba(255,212,59,${0.5 + progress / 200})` : 'rgba(255,212,59,0.7)',
                  boxShadow: `0 0 ${20 + progress / 2}px rgba(255,212,59,0.8)`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
              >
                🔍
              </motion.button>

              <div
                className="absolute text-white/80 whitespace-nowrap"
                style={{ fontWeight: 700, fontSize: '11px', top: 40, left: '50%', transform: 'translateX(-50%)' }}
              >
                {point.label}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        /* Done screen */
        <motion.div
          className="text-center px-6"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: 2 }}
          >
            🎯
          </motion.div>
          <div className="text-white" style={{ fontWeight: 900, fontSize: '30px' }}>校正完成！</div>

          {savedCalib ? (
            <div className="text-white/80 mt-3 mb-6 inline-block px-4 py-2 rounded-2xl bg-white/10 border border-white/15">
              <div style={{ fontWeight: 700, fontSize: '13px' }}>
                樣本 {savedCalib.sampleCount} · RMSE {savedCalib.rmsePx.toFixed(0)} px
              </div>
              <div style={{ fontWeight: 600, fontSize: '11px', opacity: 0.7 }}>
                校準矩陣已儲存到本機
              </div>
            </div>
          ) : (
            <div className="text-rose-200 mt-3 mb-6 inline-block px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-300/30">
              <div style={{ fontWeight: 700, fontSize: '13px' }}>
                ⚠️ 校準矩陣未儲存（樣本不足或 ARKit 未啟動）
              </div>
            </div>
          )}

          <div className="text-white/70 mt-2 mb-8" style={{ fontWeight: 600, fontSize: '15px' }}>
            視線追蹤已準備好，開始冒險吧！
          </div>
          <div className="flex gap-3 justify-center">
            <motion.button
              className="px-10 py-4 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg, #ffd43b, #ff922b)', fontWeight: 900, fontSize: '20px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/child/lobby')}
            >
              ▶ 進入冒險！
            </motion.button>
            <motion.button
              className="px-6 py-4 rounded-full text-white/85"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 800, fontSize: '15px' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/parent/gaze-test')}
            >
              👁 看校準效果
            </motion.button>
          </div>
        </motion.div>
      )}

      <button
        type="button"
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-white/85 hover:text-white transition-all bg-white/10 border border-white/20 backdrop-blur-sm"
        style={{ fontWeight: 800, fontSize: '13px' }}
        title="校正途中也可調整音量與環境音"
        onClick={() => navigate('/child/settings')}
      >
        <Settings className="w-[18px] h-[18px] shrink-0 text-cyan-200" strokeWidth={2.4} aria-hidden />
        設定
      </button>

      <button
        className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-all z-30"
        style={{ fontWeight: 500, fontSize: '12px' }}
        onClick={() => navigate('/child/lobby')}
      >
        略過
      </button>
    </div>
  );
}
