import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertCircle, Clock, Target, Volume2 } from 'lucide-react';
import { LEVELS_META } from '../data/levels';

const distractorData = [
  { name: '突發音效', seconds: 8.2 },
  { name: '移動色塊', seconds: 5.7 },
  { name: '邊角閃爍', seconds: 4.1 },
  { name: '背景變化', seconds: 3.3 },
];

const COLORS = ['#ff6b6b', '#ff922b', '#ffd43b', '#74c0fc'];

function HeatmapCanvas({
  target = { x: 0.5, y: 0.38 },
  focusGap = 12,
}: {
  target?: { x: number; y: number };
  // Gap to 100 focus goal (0 = perfect, 100 = worst)
  focusGap?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      const W = Math.round(cssW * dpr);
      const H = Math.round(cssH * dpr);

      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      // Reset transform and draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 簡化背景（不置景太陽／雲／樹），視覺聚焦在「單一專注目標圓」
      const bgGrad = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.65);
      bgGrad.addColorStop(0, '#172554');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      const tx = cssW * target.x;
      const ty = cssH * target.y;

      const gap = Math.max(0, Math.min(100, focusGap));
      const severity = gap / 100; // 0 = 離 100 很近，1 = 差很多

      /** 光圈半徑：在以較小畫布呈現時，仍盡量佔滿可視區，減少周圍深藍「空地」 */
      const shortest = Math.min(cssW, cssH);
      const reach = shortest * (0.52 + severity * 0.14);
      const cap = Math.hypot(cssW, cssH) * 0.58;
      const R = Math.min(reach, cap);

      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, R);

      /** 與圖例對齊：綠／琥珀／紅分段內插，飽和度拉高，避免「糊成一片」 */
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const lerpRgb = (a: readonly [number, number, number], b: readonly [number, number, number], t: number) =>
        [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))] as const;
      const green = [16, 220, 130] as const; // 偏亮綠
      const amber = [250, 190, 30] as const; // 明黃琥珀
      const red = [250, 55, 75] as const; // 亮紅
      const [cr, cg, cb] =
        severity <= 0.5 ? lerpRgb(green, amber, severity / 0.5) : lerpRgb(amber, red, (severity - 0.5) / 0.5);

      const centerA = 0.78 - severity * 0.12;
      const midA = 0.42 - severity * 0.08;
      const edgeA = 0.18 - severity * 0.06;
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${Math.max(0.55, centerA)})`);
      g.addColorStop(0.32, `rgba(${cr},${cg},${cb},${Math.max(0.28, midA)})`);
      g.addColorStop(0.62, `rgba(${cr},${cg},${cb},${Math.max(0.1, edgeA)})`);
      g.addColorStop(0.88, `rgba(${cr},${cg},${cb},${Math.max(0.04, edgeA * 0.45)})`);
      g.addColorStop(1, 'rgba(15,23,42,0)');

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, R, 0, Math.PI * 2);
      ctx.fill();

      // Target marker
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 16, ty);
      ctx.lineTo(tx - 6, ty);
      ctx.moveTo(tx + 6, ty);
      ctx.lineTo(tx + 16, ty);
      ctx.moveTo(tx, ty - 16);
      ctx.lineTo(tx, ty - 6);
      ctx.moveTo(tx, ty + 6);
      ctx.lineTo(tx, ty + 16);
      ctx.stroke();
      ctx.restore();

      // Legend
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath();
      ctx.rect(8, 8, 118, 72);
      ctx.fill();
      const legendItems = [
        { color: '#10dc82', label: '接近 100' },
        { color: '#f5be1e', label: '中等差距' },
        { color: '#fa374b', label: '差距較大' },
      ];
      legendItems.forEach((item, i) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(20, 22 + i * 22, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(item.label, 30, 26 + i * 22);
      });
    }

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    window.addEventListener('resize', draw);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', draw);
    };
  }, [target.x, target.y, focusGap]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-2xl"
      style={{ display: 'block', height: 260 }}
    />
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [levelId, setLevelId] = useState<number>(1);
  const level = LEVELS_META.find(l => l.id === levelId) ?? LEVELS_META[0];
  const focusGoal = 100;
  /** 示範用估算分數：隨區間／關卡略有變化 */
  const mockFocusScore = Math.max(55, Math.min(98, 92 - levelId * 4 + (dateRange === 'today' ? 2 : dateRange === 'month' ? -3 : 0)));
  /** 平均分數占比圖沿用同一數值，視覺上即「離滿分差多少」*/
  const mockAverageScore = mockFocusScore;
  const remainderToFull = Math.max(0, focusGoal - mockAverageScore);
  const focusGap = Math.max(0, focusGoal - mockFocusScore);

  const scorePieData = [
    { name: '平均得分', value: mockAverageScore, fill: '#0d9488' },
    { name: '距滿分', value: remainderToFull, fill: '#e2e8f0' },
  ];

  const metrics = [
    { icon: Clock, label: '基準線對比', value: '+15%', desc: '相較上週同期', positive: true },
    { icon: Target, label: '干擾停留時間', value: '18.3秒', desc: '本週各干擾物合計', positive: false },
    { icon: AlertCircle, label: '強制暫停次數', value: '7次', desc: '視距/分心鎖定', positive: null },
    { icon: Volume2, label: '音效干擾', value: '8.2秒', desc: '突發音效吸引時間', positive: false },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header + Date Picker */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1e293b' }}>專注力分析報告</h2>
          <p style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>視線追蹤 · 熱點分析 · AI 建議</p>
        </div>
        <div className="flex bg-white border border-slate-100 rounded-2xl p-1 shadow-sm">
          {(['today', 'week', 'month'] as const).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className="px-4 py-2 rounded-xl transition-all"
              style={{
                background: dateRange === r ? 'linear-gradient(135deg, #20c997, #4dabf7)' : 'transparent',
                color: dateRange === r ? 'white' : '#64748b',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {r === 'today' ? '今日' : r === 'week' ? '本週' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>
              訓練成效：熱力圖＋平均分數占比
            </div>
            <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
              左側準星對應關卡專注目標（離滿分差多少）；右側為以 100 分計的<strong className="text-slate-600">平均分數比例</strong>（示範數據）。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: '12px', color: '#64748b' }}>關卡</span>
            <select
              value={levelId}
              onChange={e => setLevelId(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
              style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}
              aria-label="選擇關卡"
            >
              {LEVELS_META.map(l => (
                <option key={l.id} value={l.id}>
                  第{l.id}關
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>
            目前估算專注分數：{mockFocusScore} / 100
          </div>
          <div style={{ fontWeight: 900, fontSize: '13px', color: focusGap <= 10 ? '#059669' : focusGap <= 25 ? '#b45309' : '#dc2626' }}>
            差距：{focusGap}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#475569', marginBottom: '10px' }}>
              專注目標熱力（距離 100）
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-[380px] sm:max-w-[420px]">
                <HeatmapCanvas target={level.target} focusGap={focusGap} />
              </div>
            </div>
          </div>

          <div className="flex flex-col min-h-[260px]">
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
              平均分數占比
            </div>
            <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '8px', lineHeight: 1.45 }}>
              以 100 分為滿分，示範顯示目前估算<strong className="text-slate-600">平均得分</strong>佔比（綠＝已得、灰＝尚未滿分）。
            </p>
            <div className="relative flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={scorePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={2}
                    cornerRadius={6}
                    strokeWidth={2}
                    stroke="#ffffff"
                  >
                    {scorePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} 分`, '']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ paddingBottom: '4%' }}
              >
                <span style={{ fontWeight: 900, fontSize: '34px', color: '#0f172a', lineHeight: 1 }}>{mockAverageScore}</span>
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#64748b', letterSpacing: '0.08em', marginTop: 4 }}>
                  平均得分 · /100
                </span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-1 flex-wrap" style={{ fontWeight: 700, fontSize: '12px' }}>
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ background: '#0d9488' }} />
                已得 {mockAverageScore} 分（{mockAverageScore}%）
              </span>
              <span className="inline-flex items-center gap-2 text-slate-500">
                <span className="inline-block w-3 h-3 rounded-full shrink-0 bg-slate-200 border border-slate-300" />
                尚差 {remainderToFull} 分
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Metric cards */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '16px' }}>詳細數據</div>
          <div className="space-y-4">
            {metrics.map(m => (
              <div key={m.label} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <m.icon size={18} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{m.label}</div>
                  <div style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8' }}>{m.desc}</div>
                </div>
                <div style={{
                  fontWeight: 800,
                  fontSize: '15px',
                  color: m.positive === true ? '#059669' : m.positive === false ? '#dc2626' : '#64748b',
                }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Distractor chart */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>干擾物停留時間</div>
          <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>各類干擾物吸引視線的秒數</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={distractorData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="s" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip formatter={(v: any) => [`${v}s`, '停留時間']} />
              <Bar dataKey="seconds" radius={[0, 8, 8, 0]}>
                {distractorData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* AI Feedback */}
      <motion.div
        className="rounded-3xl p-6 border-2 border-dashed border-violet-200"
        style={{ background: 'linear-gradient(135deg, #faf5ff, #f0f9ff)' }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#4c1d95' }}>✨ AI 復健導師回饋</div>
            <div style={{ fontWeight: 500, fontSize: '12px', color: '#7c3aed' }}>基於本週數據自動分析</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/80 rounded-2xl p-4">
            <div className="flex gap-2 mb-2">
              <span className="text-lg">📊</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>表現分析</div>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#475569', lineHeight: 1.6 }}>
              個案在<strong>動態追蹤表現優異</strong>（得分提升 15%），但對於畫面<strong>右下方的干擾抵抗力較弱</strong>，該區域停留時間達 5.2 秒，建議在後續訓練中適度強化該象限的注意力回歸練習。
            </p>
          </div>

          <div className="bg-white/80 rounded-2xl p-4">
            <div className="flex gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>居家練習建議</div>
            </div>
            <ul className="space-y-2">
              {[
                '建議在居家練習時，將環境光線調暗以增加畫面反差，減少環境分心。',
                '每次訓練前進行 2 分鐘的「眼球伸展運動」，有助於提升追蹤靈活性。',
                '本週音效干擾敏感度偏高，可嘗試在有輕柔背景音樂的環境中進行訓練。',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2" style={{ fontSize: '13px', fontWeight: 500, color: '#475569', lineHeight: 1.6 }}>
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}