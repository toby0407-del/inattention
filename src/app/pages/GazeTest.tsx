import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
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
  loadCalibration,
  clearCalibration,
  type CalibrationMatrix,
  type ScreenPoint,
} from '../native/gazeProjection';
import type { PluginListenerHandle } from '@capacitor/core';

type Status = 'idle' | 'checking' | 'unsupported' | 'starting' | 'running' | 'stopped' | 'error';
type ViewMode = 'data' | 'overlay';

/**
 * 開發者測試頁：顯示 ARKit 原生 plugin 回傳的視線資料，
 * 可切換「數據面板」與「全螢幕覆蓋層」（綠點跟著注視）。
 *
 * 路徑：/parent/gaze-test
 */
export default function GazeTest() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [interrupted, setInterrupted] = useState(false);
  const [latest, setLatest] = useState<GazeUpdate | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('data');
  const [calib, setCalib] = useState<CalibrationMatrix | null>(() => loadCalibration());
  const [screenPoint, setScreenPoint] = useState<ScreenPoint | null>(null);
  const handlesRef = useRef<PluginListenerHandle[]>([]);

  // 啟動時檢查支援度
  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatus('checking');
      if (!isNativeIOS()) {
        if (!mounted) return;
        setSupported(false);
        setStatus('unsupported');
        setErrorMsg('此測試頁只能在 iOS native（Capacitor）環境執行。請用 iPad 透過 Xcode 安裝後再開。');
        return;
      }
      try {
        const res = await GazeTracking.isSupported();
        if (!mounted) return;
        setSupported(res.supported);
        if (!res.supported) {
          setStatus('unsupported');
          setErrorMsg('此裝置不支援 ARFaceTrackingConfiguration（需要 A12 Bionic 以上）');
        } else {
          setStatus('idle');
        }
      } catch (e) {
        if (!mounted) return;
        setSupported(false);
        setStatus('error');
        setErrorMsg(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 把每幀 ARKit 資料投影成 screenPoint
  useEffect(() => {
    if (!latest || !latest.isTracked) {
      setScreenPoint(null);
      return;
    }
    const plane = intersectGazeWithScreenPlane(latest.lookAtWorld, latest.leftEyeWorld, latest.rightEyeWorld);
    if (!plane) {
      setScreenPoint(null);
      return;
    }
    const sp = planePointToScreen(plane, window.innerWidth, window.innerHeight, calib);
    setScreenPoint(sp);
  }, [latest, calib]);

  async function handleStart() {
    if (status === 'running' || status === 'starting') return;
    setErrorMsg(null);
    setFrameCount(0);
    setStatus('starting');

    try {
      const onUpdate = await GazeTracking.addListener('gazeUpdate', (data: GazeUpdate) => {
        setLatest(data);
        setFrameCount(c => c + 1);
      });
      const onError = await GazeTracking.addListener('gazeError', (data: GazeError) => {
        setErrorMsg(data.message);
        setStatus('error');
      });
      const onInterrupt = await GazeTracking.addListener('gazeInterruption', (data: GazeInterruption) => {
        setInterrupted(data.interrupted);
      });
      handlesRef.current = [onUpdate, onError, onInterrupt];

      await GazeTracking.start();
      setStatus('running');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setStatus('error');
      for (const h of handlesRef.current) {
        try {
          await h.remove();
        } catch {
          /* swallow */
        }
      }
      handlesRef.current = [];
    }
  }

  async function handleStop() {
    try {
      await GazeTracking.stop();
    } catch {
      /* swallow */
    }
    for (const h of handlesRef.current) {
      try {
        await h.remove();
      } catch {
        /* swallow */
      }
    }
    handlesRef.current = [];
    setStatus('stopped');
  }

  // 卸載時清理
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await GazeTracking.stop();
        } catch {
          /* swallow */
        }
        for (const h of handlesRef.current) {
          try {
            await h.remove();
          } catch {
            /* swallow */
          }
        }
        handlesRef.current = [];
      })();
    };
  }, []);

  function handleReloadCalib() {
    setCalib(loadCalibration());
  }

  function handleClearCalib() {
    clearCalibration();
    setCalib(null);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold"
        >
          ← 返回
        </button>
        <div className="text-base font-black">ARKit Gaze Test</div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'data' ? 'overlay' : 'data')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            {viewMode === 'data' ? '🎯 全螢幕覆蓋' : '📊 數據面板'}
          </button>
          <button
            onClick={() => navigate('/child/calibration')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-xs font-bold"
          >
            🎯 校準
          </button>
        </div>
      </div>

      {/* Main */}
      {viewMode === 'data' ? (
        <DataView
          status={status}
          supported={supported}
          frameCount={frameCount}
          interrupted={interrupted}
          errorMsg={errorMsg}
          latest={latest}
          screenPoint={screenPoint}
          calib={calib}
          onReloadCalib={handleReloadCalib}
          onClearCalib={handleClearCalib}
        />
      ) : (
        <OverlayView screenPoint={screenPoint} status={status} calib={calib} />
      )}

      {/* 控制列 */}
      <div className="border-t border-white/10 px-4 py-3 flex gap-3 justify-center bg-black/40">
        <button
          onClick={handleStart}
          disabled={status === 'running' || status === 'starting' || status === 'unsupported' || supported === false}
          className="px-6 py-3 rounded-xl text-white font-black disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #20c997, #4dabf7)' }}
        >
          {status === 'starting' ? '啟動中…' : '▶ 開始'}
        </button>
        <button
          onClick={handleStop}
          disabled={status !== 'running'}
          className="px-6 py-3 rounded-xl text-white font-black disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff922b)' }}
        >
          ■ 停止
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// 數據面板模式
// ===========================================================================

function DataView({
  status, supported, frameCount, interrupted, errorMsg, latest, screenPoint, calib, onReloadCalib, onClearCalib,
}: {
  status: Status;
  supported: boolean | null;
  frameCount: number;
  interrupted: boolean;
  errorMsg: string | null;
  latest: GazeUpdate | null;
  screenPoint: ScreenPoint | null;
  calib: CalibrationMatrix | null;
  onReloadCalib: () => void;
  onClearCalib: () => void;
}) {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 min-h-0">
      {/* 左：粗略視覺化 + 螢幕投影點 */}
      <div className="relative rounded-2xl border border-white/10 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 grid place-items-center text-white/30 text-sm pointer-events-none">
          {calib ? '已套用校準矩陣' : '未校準（粗略線性映射）'}
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
        </div>
        {screenPoint && (
          <div
            className="absolute w-8 h-8 rounded-full"
            style={{
              left: `calc(${(screenPoint.px / window.innerWidth) * 100}% - 16px)`,
              top: `calc(${(screenPoint.py / window.innerHeight) * 100}% - 16px)`,
              background: 'radial-gradient(circle, #4ade80 0%, rgba(74,222,128,0.2) 70%, transparent 100%)',
              boxShadow: '0 0 32px rgba(74,222,128,0.7)',
              transition: 'left 60ms linear, top 60ms linear',
            }}
          />
        )}
        {!screenPoint && status === 'running' && (
          <div className="absolute bottom-3 left-3 text-xs font-bold text-amber-300">等待偵測到臉…</div>
        )}
      </div>

      {/* 右：數據 */}
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 overflow-y-auto text-sm">
        <Section title="狀態">
          <Row label="平台" value={isNativeIOS() ? 'iOS native' : capPlatform()} />
          <Row label="支援" value={supported === null ? '檢查中…' : supported ? '✅ 支援' : '❌ 不支援'} />
          <Row label="Plugin 狀態" value={status} />
          <Row label="累計幀數" value={String(frameCount)} />
          <Row label="ARKit 中斷" value={interrupted ? '⚠️ 是' : '否'} />
          {errorMsg && <Row label="錯誤" value={errorMsg} valueClass="text-red-300" />}
        </Section>

        <Section
          title="校準狀態"
          actions={
            <div className="flex gap-2">
              <button onClick={onReloadCalib} className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-white/10 hover:bg-white/20">
                重讀
              </button>
              {calib && (
                <button onClick={onClearCalib} className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-red-500/30 hover:bg-red-500/50">
                  清除
                </button>
              )}
            </div>
          }
        >
          {calib ? (
            <>
              <Row label="樣本數" value={String(calib.sampleCount)} />
              <Row label="RMSE" value={`${calib.rmsePx.toFixed(1)} px`} />
              <Row label="校準時螢幕" value={`${calib.screenWidth}×${calib.screenHeight}`} />
              <Row label="目前螢幕" value={`${window.innerWidth}×${window.innerHeight}`} />
              <Row
                label="矩陣 (a,b,tx)"
                value={`${calib.a.toFixed(0)}, ${calib.b.toFixed(0)}, ${calib.tx.toFixed(0)}`}
              />
              <Row
                label="矩陣 (c,d,ty)"
                value={`${calib.c.toFixed(0)}, ${calib.d.toFixed(0)}, ${calib.ty.toFixed(0)}`}
              />
            </>
          ) : (
            <div className="text-white/50 text-xs">
              尚未校準。按右上「🎯 校準」進入校準流程後，數值會精準很多。
            </div>
          )}
        </Section>

        {latest && (
          <>
            <Section title="lookAtFace（臉部座標系，公尺）">
              <Row label="x" value={fmt(latest.lookAtFace.x)} />
              <Row label="y" value={fmt(latest.lookAtFace.y)} />
              <Row label="z" value={fmt(latest.lookAtFace.z)} />
            </Section>
            <Section title="lookAtWorld（世界座標系，公尺）">
              <Row label="x" value={fmt(latest.lookAtWorld.x)} />
              <Row label="y" value={fmt(latest.lookAtWorld.y)} />
              <Row label="z" value={fmt(latest.lookAtWorld.z)} />
            </Section>
            {screenPoint && (
              <Section title="投影到螢幕">
                <Row label="px" value={`${screenPoint.px.toFixed(0)} / ${window.innerWidth}`} />
                <Row label="py" value={`${screenPoint.py.toFixed(0)} / ${window.innerHeight}`} />
              </Section>
            )}
            <Section title="isTracked">
              <Row label="狀態" value={latest.isTracked ? '✅ 追蹤中' : '⚠️ 偵測中斷'} />
              <Row label="ts" value={String(Math.round(latest.timestamp))} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// 全螢幕覆蓋模式
// ===========================================================================

function OverlayView({ screenPoint, status, calib }: { screenPoint: ScreenPoint | null; status: Status; calib: CalibrationMatrix | null }) {
  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      {/* 網格輔助線 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 中央 + 四角 anchor 點，用來目視校準準度 */}
      {[
        [0.5, 0.5],
        [0.1, 0.1],
        [0.9, 0.1],
        [0.1, 0.9],
        [0.9, 0.9],
      ].map(([fx, fy], i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-white/30 border border-white/40"
          style={{ left: `${fx * 100}%`, top: `${fy * 100}%`, transform: 'translate(-50%,-50%)' }}
        />
      ))}

      {/* 視線注視點 */}
      {screenPoint && (
        <div
          className="absolute w-12 h-12 rounded-full pointer-events-none"
          style={{
            left: screenPoint.px - 24,
            top: screenPoint.py - 24,
            background: 'radial-gradient(circle, rgba(74,222,128,0.95) 0%, rgba(74,222,128,0.4) 50%, transparent 100%)',
            boxShadow: '0 0 48px rgba(74,222,128,0.8)',
            transition: 'left 60ms linear, top 60ms linear',
          }}
        />
      )}

      {/* HUD */}
      <div className="absolute top-3 left-3 text-xs font-bold text-white/80">
        {calib ? `已校準（RMSE ${calib.rmsePx.toFixed(0)}px）` : '未校準'} · {status}
      </div>
      {!screenPoint && status === 'running' && (
        <div className="absolute inset-0 grid place-items-center text-white/40 text-sm font-bold pointer-events-none">
          等待偵測到臉…
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// 共用元件
// ===========================================================================

function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-black uppercase tracking-wider text-white/50">{title}</div>
        {actions}
      </div>
      <div className="rounded-xl bg-black/30 border border-white/5 px-3 py-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[12px]">
      <span className="text-white/55">{label}</span>
      <span className={valueClass ?? 'text-white'}>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(4);
}

function capPlatform(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (globalThis as any).Capacitor;
  return cap?.getPlatform?.() ?? 'web';
}
