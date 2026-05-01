import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Sliders, Zap, RefreshCw, Shield, Volume2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    eyeDistanceLock, setEyeDistanceLock,
    toleranceThreshold, setToleranceThreshold,
    distractorLevel, setDistractorLevel,
  } = useApp();

  const [calibrating, setCalibrating] = useState(false);
  const [calibDone, setCalibDone] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleCalibrate() {
    setCalibrating(true);
    setCalibDone(false);
    setTimeout(() => {
      setCalibrating(false);
      setCalibDone(true);
      setTimeout(() => setCalibDone(false), 3000);
    }, 2500);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const distractorOptions: { key: 'off' | 'low' | 'medium' | 'high' | 'extreme'; label: string; icon: string; desc: string }[] = [
    { key: 'off', label: '關閉', icon: '⚪', desc: '不出現干擾提示' },
    { key: 'low', label: '低', icon: '🟢', desc: '輕微視覺干擾' },
    { key: 'medium', label: '中', icon: '🟡', desc: '一般干擾' },
    { key: 'high', label: '高', icon: '🟠', desc: '較頻繁干擾' },
    { key: 'extreme', label: '極高', icon: '🔴', desc: '最強干擾強度' },
  ];

  return (
    <div className="max-w-2xl space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div>
        <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1e293b' }}>訓練設定與難度調整</h2>
        <p style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>個人化設定每位孩童的訓練參數</p>
      </div>

      {/* Eye distance lock */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Eye size={20} className="text-blue-500" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>視距安全鎖</div>
              <div style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                離螢幕過近時觸發全螢幕警示，引導孩子坐好
              </div>
              <div className="mt-2 inline-block px-2 py-1 rounded-lg" style={{
                background: eyeDistanceLock ? '#dcfce7' : '#f1f5f9',
                color: eyeDistanceLock ? '#15803d' : '#94a3b8',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                {eyeDistanceLock ? '🛡️ 保護中' : '⭕ 已關閉'}
              </div>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => setEyeDistanceLock(v => !v)}
            className="relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 mt-1"
            style={{ background: eyeDistanceLock ? 'linear-gradient(135deg, #20c997, #4dabf7)' : '#e2e8f0' }}
          >
            <motion.div
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              animate={{ x: eyeDistanceLock ? 30 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Tolerance slider */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Sliders size={20} className="text-orange-500" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>分心判定容忍度</div>
            <div style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              視線離開目標區域多少秒後判定為分心
            </div>
          </div>
        </div>

        <div className="px-2">
          <div className="flex justify-between mb-3">
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>嚴格 0.5s</span>
            <div className="px-4 py-1 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, #ff922b, #ffd43b)', fontWeight: 800, fontSize: '16px' }}>
              {toleranceThreshold.toFixed(1)}s
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>寬鬆 3.0s</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={toleranceThreshold}
            onChange={e => setToleranceThreshold(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ff922b ${((toleranceThreshold - 0.5) / 2.5) * 100}%, #e2e8f0 0%)`,
              accentColor: '#ff922b',
            }}
          />
          <div className="flex justify-between mt-2">
            {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map(v => (
              <div key={v} className="flex flex-col items-center gap-1">
                <div className="w-0.5 h-2 bg-slate-200" />
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#cbd5e1' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Distractor intensity */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex gap-4 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center">
            <Zap size={20} className="text-red-500" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>干擾物強度</div>
            <div style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              設定環境干擾物的類型與強度
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {distractorOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setDistractorLevel(opt.key)}
              className="p-4 rounded-2xl border-2 transition-all text-center"
              style={{
                borderColor: distractorLevel === opt.key ? '#20c997' : '#e2e8f0',
                background: distractorLevel === opt.key ? 'linear-gradient(135deg, #f0fdf9, #eff6ff)' : 'white',
              }}
            >
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: distractorLevel === opt.key ? '#0f766e' : '#334155' }}>{opt.label}</div>
              <div style={{ fontWeight: 500, fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{opt.desc}</div>
              {distractorLevel === opt.key && (
                <div className="mt-2 text-teal-500">
                  <CheckCircle size={16} className="mx-auto" />
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Calibration */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
              <RefreshCw size={20} className="text-violet-500" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>眼動重新校正</div>
              <div style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                確保視線追蹤準確度，建議每次開始前校正
              </div>
              {calibDone && (
                <div className="mt-2 flex items-center gap-1 text-green-600" style={{ fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle size={14} /> 校正完成！
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            className="px-5 py-2.5 rounded-2xl text-white transition-all flex items-center gap-2"
            style={{
              background: calibrating ? '#94a3b8' : 'linear-gradient(135deg, #a855f7, #6366f1)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: calibrating ? 'not-allowed' : 'pointer',
            }}
          >
            {calibrating ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={15} />
                </motion.div>
                校正中...
              </>
            ) : '開始校正'}
          </button>
        </div>
      </motion.div>

      {/* Notification settings */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '16px' }}>其他設定</div>
        {[
          { icon: Volume2, label: '音效提示', desc: '分心時發出提示音效', enabled: true },
          { icon: Shield, label: '隱私保護模式', desc: '自動模糊螢幕截圖', enabled: false },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-none">
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-slate-400" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>{item.label}</div>
                <div style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8' }}>{item.desc}</div>
              </div>
            </div>
            <div className="w-10 h-6 rounded-full relative" style={{ background: item.enabled ? '#20c997' : '#e2e8f0' }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                style={{ left: item.enabled ? '18px' : '2px', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-2xl text-white transition-all"
        style={{
          background: saved ? 'linear-gradient(135deg, #20c997, #38bdf8)' : 'linear-gradient(135deg, #0f766e, #1d4ed8)',
          fontWeight: 800,
          fontSize: '15px',
        }}
      >
        {saved ? '✓ 已儲存設定！' : '儲存設定'}
      </button>
    </div>
  );
}
