import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Waves } from 'lucide-react';
import {
  applyPatientAmbientLive,
  defaultPatientAmbient,
  ensureBlueBgm,
  loadPatientAmbient,
  patientAmbientPresets,
  type PatientAmbientConfig,
} from '../utils/blueBgm';

/** 整頁單色底，避免多段漸層與其他色相混色（嵌入區塊用） */
export const PATIENT_AMBIENT_PAGE_BG = '#0f172a';
const GLASS = 'rgba(255,255,255,0.06)';
const GLASS_BORDER = 'rgba(148,163,184,0.22)';
const SLIDER_TRACK = 'rgba(148,163,184,0.22)';
const SLIDER_FILL = '#cbd5e1';

type Props = {
  /** 供外層側欄／摘要同步顯示（含初次載入） */
  onConfigChange?: (c: PatientAmbientConfig) => void;
};

export default function PatientAmbientSettingsPanel({ onConfigChange }: Props) {
  const [cfg, setCfg] = useState<PatientAmbientConfig>(() => loadPatientAmbient());
  const [waken, setWaken] = useState(false);

  const push = useCallback(
    (next: PatientAmbientConfig) => {
      setCfg(next);
      applyPatientAmbientLive(next);
      onConfigChange?.(next);
    },
    [onConfigChange],
  );

  const handleWake = useCallback(async () => {
    await ensureBlueBgm();
    applyPatientAmbientLive(cfg);
    setWaken(true);
  }, [cfg]);

  const applyPreset = useCallback(
    (p: (typeof patientAmbientPresets)[number]) => {
      const next: PatientAmbientConfig = { ...cfg, ...p.config, enabled: cfg.enabled };
      push(next);
    },
    [cfg, push],
  );

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{
        borderColor: GLASS_BORDER,
        backgroundColor: PATIENT_AMBIENT_PAGE_BG,
        fontFamily: 'Nunito, Inter, sans-serif',
      }}
    >
      <div className="p-5 sm:p-6 space-y-5">
        {!waken ? (
          <motion.button
            type="button"
            className="w-full rounded-2xl px-4 py-4 text-white text-left flex items-center gap-4 border"
            style={{
              fontWeight: 900,
              background: GLASS,
              borderColor: GLASS_BORDER,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            whileTap={{ scale: 0.99 }}
            onClick={handleWake}
          >
            <span className="text-3xl shrink-0" aria-hidden>
              🔊
            </span>
            <span className="min-w-0">
              <span className="block" style={{ fontSize: '16px', lineHeight: 1.35 }}>
                點這裡喚醒試聽
              </span>
              <span className="block mt-1 text-white/85" style={{ fontWeight: 700, fontSize: '12px', lineHeight: 1.45 }}>
                瀏覽器需有一次按鈕動作才可播音；喚醒後調滑桿會即時變更並存檔。
              </span>
            </span>
          </motion.button>
        ) : (
          <div
            className="rounded-xl px-3 py-3 flex items-center gap-3 border"
            style={{ background: GLASS, borderColor: GLASS_BORDER }}
          >
            <Volume2 className="w-5 h-5 text-slate-300 shrink-0" aria-hidden />
            <p className="text-slate-200/95" style={{ fontWeight: 700, fontSize: '12px', lineHeight: 1.5 }}>
              試聽中。離開後孩子開星圖仍套用此設定。
            </p>
          </div>
        )}

        <div className="rounded-2xl border p-5" style={{ background: GLASS, borderColor: GLASS_BORDER }}>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/15 shrink-0">
                <Waves className="w-5 h-5 text-slate-300" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="text-white" style={{ fontWeight: 900, fontSize: '15px', lineHeight: 1.3 }}>
                  星圖與訓練端背景聲
                </div>
                <div className="text-slate-300/95 mt-1" style={{ fontWeight: 600, fontSize: '12px', lineHeight: 1.45 }}>
                  關閉後不播放底噪（滑桿數值會保留）。
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cfg.enabled}
              aria-label={`背景聲：${cfg.enabled ? '開啟' : '關閉'}`}
              className="relative w-14 h-8 rounded-full transition-colors shrink-0 mt-0.5"
              style={{
                background: cfg.enabled ? 'rgba(203,213,225,0.42)' : 'rgba(51,65,85,0.65)',
              }}
              onClick={() => {
                const next = { ...cfg, enabled: !cfg.enabled };
                if (next.enabled) {
                  void ensureBlueBgm().then(() => {
                    applyPatientAmbientLive(next);
                    setCfg(next);
                    onConfigChange?.(next);
                    setWaken(true);
                  });
                } else {
                  push(next);
                }
              }}
            >
              <motion.span
                className="absolute top-1 left-1 w-6 h-6 rounded-full shadow-md bg-white"
                animate={{ x: cfg.enabled ? 28 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {patientAmbientPresets.map(p => (
              <button
                key={p.id}
                type="button"
                className="px-3 py-2 rounded-xl border text-white/95 transition-colors"
                style={{
                  fontWeight: 800,
                  fontSize: '12px',
                  borderColor: GLASS_BORDER,
                  background: GLASS,
                }}
                onClick={() => applyPreset(p)}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className="px-3 py-2 rounded-xl border text-white/80"
              style={{ fontWeight: 800, fontSize: '12px', borderColor: GLASS_BORDER, background: 'transparent' }}
              onClick={() => push({ ...defaultPatientAmbient(), enabled: cfg.enabled })}
            >
              重設預設
            </button>
          </div>

          {ambientSliderRow({
            label: '音量',
            hint: '整體多大聲',
            min: 5,
            max: 98,
            step: 1,
            suffix: `${Math.round(cfg.volume)}%`,
            value: cfg.volume,
            onChange: v => push({ ...cfg, volume: v }),
          })}
          {ambientSliderRow({
            label: '沙沙聲「亮／暗」（低通頻率）',
            hint: '往右偏高音',
            min: 500,
            max: 9000,
            step: 50,
            suffix: `${Math.round(cfg.lowpassHz)} Hz`,
            value: cfg.lowpassHz,
            onChange: v => push({ ...cfg, lowpassHz: v }),
          })}
          {ambientSliderRow({
            label: '低沉感（高通頻率）',
            hint: '往右越低頻越少',
            min: 40,
            max: 720,
            step: 5,
            suffix: `${Math.round(cfg.highpassHz)} Hz`,
            value: cfg.highpassHz,
            onChange: v => push({ ...cfg, highpassHz: v }),
          })}
          {ambientSliderRow({
            label: '和聲底',
            hint: '哼鳴底色；可關到 0',
            min: 0,
            max: 100,
            step: 1,
            suffix: `${Math.round(cfg.padBlend)}%`,
            value: cfg.padBlend,
            onChange: v => push({ ...cfg, padBlend: v }),
          })}
        </div>

        <p className="text-center text-slate-500 px-1" style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.55 }}>
          變更即寫入本裝置瀏覽器；請在準備給孩子的裝置上登入管道後調整。
        </p>
      </div>
    </div>
  );
}

function ambientSliderRow(opts: {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { label, hint, min, max, step, suffix, value, onChange } = opts;
  const pct = ((value - min) / (max - min)) * 100;
  const trackBg = `linear-gradient(to right, ${SLIDER_FILL} ${pct}%, ${SLIDER_TRACK} ${pct}%)`;

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex justify-between items-baseline gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-white" style={{ fontWeight: 800, fontSize: '14px' }}>
            {label}
          </div>
          <div className="text-slate-400 mt-0.5" style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.45 }}>
            {hint}
          </div>
        </div>
        <div
          className="shrink-0 tabular-nums px-2.5 py-1 rounded-lg text-slate-200"
          style={{ fontWeight: 900, fontSize: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {suffix}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          accentColor: SLIDER_FILL,
          background: trackBg,
        }}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
