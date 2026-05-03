import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, Sliders, Zap, RefreshCw, Shield, Volume2, CheckCircle, BarChart2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PatientAmbientSettingsPanel from '../components/PatientAmbientSettingsPanel';
import { loadPatientAmbient, type PatientAmbientConfig } from '../utils/blueBgm';

export default function Settings() {
  const navigate = useNavigate();
  const {
    eyeDistanceLock, setEyeDistanceLock,
    toleranceThreshold, setToleranceThreshold,
    distractorLevel, setDistractorLevel,
    lastGameScore,
    totalStars,
    selectedChild,
    soundHintEnabled,
    setSoundHintEnabled,
    privacyBlurEnabled,
    setPrivacyBlurEnabled,
  } = useApp();

  const [calibrating, setCalibrating] = useState(false);
  const [calibDone, setCalibDone] = useState(false);
  const [saved, setSaved] = useState(false);

  /** 僅摘要用：與兒童端背景聲區塊透過面板回呼維持同步 */
  const [ambientPreview, setAmbientPreview] = useState<PatientAmbientConfig>(() => loadPatientAmbient());

  useEffect(() => {
    setAmbientPreview(loadPatientAmbient());
  }, []);

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

  const scoreSnap =
    typeof lastGameScore === 'number' && lastGameScore > 0
      ? Math.min(100, Math.round(lastGameScore))
      : null;
  const remainderSnap = scoreSnap != null ? Math.max(0, 100 - scoreSnap) : 0;
  const scorePieRows = useMemo(
    () =>
      scoreSnap == null
        ? []
        : [
            { name: '得分', value: scoreSnap, fill: '#0d9488' },
            { name: '尚可進步', value: remainderSnap, fill: '#cbd5e1' },
          ],
    [scoreSnap, remainderSnap],
  );

  const distractorOptions: { key: 'off' | 'low' | 'medium' | 'high' | 'extreme'; label: string; icon: string; desc: string }[] = [
    { key: 'off', label: '關閉', icon: '⚪', desc: '不出現干擾提示' },
    { key: 'low', label: '低', icon: '🟢', desc: '輕微視覺干擾' },
    { key: 'medium', label: '中', icon: '🟡', desc: '一般干擾' },
    { key: 'high', label: '高', icon: '🟠', desc: '較頻繁干擾' },
    { key: 'extreme', label: '極高', icon: '🔴', desc: '最強干擾強度' },
  ];

  const currentDistractor = distractorOptions.find(o => o.key === distractorLevel);

  return (
    <div
      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="lg:col-span-7 space-y-6 min-w-0">
      <div>
        <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1e293b' }}>親子設定</h2>
        <p style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>
          請在家長／治療師通道內完成設定；兒童端星圖不再提供獨立設定入口。
        </p>
      </div>

      <motion.div
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-6 border-b border-slate-100 flex gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Volume2 size={20} className="text-slate-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#1e293b' }}>兒童訓練端｜背景聲與白噪音</div>
            <p style={{ fontWeight: 500, fontSize: '13px', color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
              適用星圖與遊玩時的環境低音。請在實際給孩子使用的裝置上登入本通道後調整並試聽。
            </p>
          </div>
        </div>
        <div className="p-6 bg-slate-100/80">
          <PatientAmbientSettingsPanel onConfigChange={setAmbientPreview} />
        </div>
      </motion.div>

      <div>
        <h3 style={{ fontWeight: 800, fontSize: '17px', color: '#1e293b' }}>訓練與安全</h3>
        <p style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>個人化每位孩童的訓練參數</p>
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
        {(
          [
            {
              key: 'sound',
              icon: Volume2,
              label: '音效提示',
              desc: '分心時發出提示音效',
              value: soundHintEnabled,
              set: setSoundHintEnabled,
            },
            {
              key: 'privacy',
              icon: Shield,
              label: '隱私保護模式',
              desc: '自動模糊螢幕截圖（示意選項）',
              value: privacyBlurEnabled,
              set: setPrivacyBlurEnabled,
            },
          ] as const
        ).map(item => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 last:border-none">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <item.icon size={18} className="text-slate-400 shrink-0" aria-hidden />
              <div className="min-w-0">
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>{item.label}</div>
                <div style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8' }}>{item.desc}</div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={item.value}
              aria-label={`${item.label}：${item.value ? '開啟' : '關閉'}`}
              onClick={() => item.set(v => !v)}
              className="relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 touch-manipulation"
              style={{ background: item.value ? 'linear-gradient(135deg, #20c997, #4dabf7)' : '#e2e8f0' }}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                animate={{ x: item.value ? 30 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
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

      {/* 右欄：補視覺留白、對照目前設定 */}
      <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-6">
        <motion.div
          className="rounded-3xl p-6 border shadow-sm overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #f8fafc 0%, #e0f2fe 42%, #f0fdf4 100%)',
            borderColor: '#e2e8f0',
          }}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-teal-600 shrink-0" />
            <div style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>目前套用（{selectedChild.name}）</div>
          </div>
          <ul className="space-y-3" style={{ fontWeight: 600, fontSize: '13px', color: '#334155' }}>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: eyeDistanceLock ? '#059669' : '#94a3b8' }} />
              <span><span className="text-slate-500 font-semibold">視距鎖：</span>{eyeDistanceLock ? '開啟保護中' : '未開啟'}</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5 bg-orange-400" />
              <span><span className="text-slate-500 font-semibold">分心容忍：</span>{toleranceThreshold.toFixed(1)} 秒後判定分心</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5 bg-amber-500" />
              <span><span className="text-slate-500 font-semibold">干擾強度：</span>{currentDistractor?.icon} {currentDistractor?.label}（{currentDistractor?.desc}）</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: soundHintEnabled ? '#059669' : '#94a3b8' }} />
              <span><span className="text-slate-500 font-semibold">音效提示：</span>{soundHintEnabled ? '開啟' : '關閉'}</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: privacyBlurEnabled ? '#059669' : '#94a3b8' }} />
              <span><span className="text-slate-500 font-semibold">隱私模糊：</span>{privacyBlurEnabled ? '開啟' : '關閉'}</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: ambientPreview.enabled ? '#0f172a' : '#94a3b8' }} />
              <span>
                <span className="text-slate-500 font-semibold">兒童端背景聲：</span>
                {ambientPreview.enabled ? `開啟（音量約 ${Math.round(ambientPreview.volume)}%）` : '關閉'}
              </span>
            </li>
          </ul>
          <button
            type="button"
            onClick={() => navigate('/parent/analytics')}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
            style={{
              borderColor: '#bae6fd',
              color: '#0369a1',
              fontWeight: 800,
              fontSize: '13px',
            }}
          >
            <BarChart2 size={16} aria-hidden /> 開啟專注力完整報告
          </button>
        </motion.div>

        <motion.div
          className="rounded-3xl p-6 bg-white shadow-sm border border-slate-100"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>最近一次 · 得分占比</div>
          <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.45 }}>
            以滿分 100 概覽；玩完一局後會自動帶入。目前累積<strong className="text-slate-600"> {totalStars} </strong>⭐。
          </p>
          {scoreSnap != null && scorePieRows.length > 0 ? (
            <div className="relative w-full min-h-[200px]" style={{ maxHeight: 220 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={scorePieRows}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={74}
                    paddingAngle={2}
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {scorePieRows.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} 分`, '']} contentStyle={{ borderRadius: 12, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-4px]">
                <span style={{ fontWeight: 900, fontSize: '28px', color: '#0f172a' }}>{scoreSnap}</span>
                <span style={{ fontWeight: 700, fontSize: '10px', color: '#64748b' }}>最近一次</span>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed px-5 py-10 text-center"
              style={{ borderColor: '#cbd5e1', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: '13px', lineHeight: 1.55 }}
            >
              尚未有最近一次得分資料。
              <br />
              請陪孩子完成一局遊玩後再回到此頁。
            </div>
          )}
        </motion.div>
      </aside>
    </div>
  );
}
