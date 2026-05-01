import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

      // Background game scene
      ctx.fillStyle = '#1a2744';
      ctx.fillRect(0, 0, cssW, cssH);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, cssH * 0.6);
      skyGrad.addColorStop(0, '#0d2137');
      skyGrad.addColorStop(1, '#1a3d5c');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cssW, cssH * 0.65);

      // Ground
      ctx.fillStyle = '#1e4d1a';
      ctx.beginPath();
      ctx.ellipse(cssW / 2, cssH * 0.75, cssW * 0.6, cssH * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sun
      ctx.fillStyle = '#ffd43b';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(cssW * 0.5, cssH * 0.38, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cssW * 0.2, cssH * 0.22, 18, 0, Math.PI * 2);
      ctx.arc(cssW * 0.25, cssH * 0.2, 22, 0, Math.PI * 2);
      ctx.arc(cssW * 0.3, cssH * 0.22, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cssW * 0.72, cssH * 0.15, 14, 0, Math.PI * 2);
      ctx.arc(cssW * 0.76, cssH * 0.13, 18, 0, Math.PI * 2);
      ctx.arc(cssW * 0.8, cssH * 0.15, 12, 0, Math.PI * 2);
      ctx.fill();

      // Trees
      const drawTree = (x: number, y: number, s: number) => {
        ctx.fillStyle = '#2d5c28';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.8);
        ctx.lineTo(x - s * 0.5, y);
        ctx.lineTo(x + s * 0.5, y);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(x - s * 0.08, y, s * 0.16, s * 0.3);
      };
      drawTree(cssW * 0.15, cssH * 0.6, 45);
      drawTree(cssW * 0.82, cssH * 0.62, 38);
      drawTree(cssW * 0.88, cssH * 0.58, 52);

      // ==== TRAINING EFFECTIVENESS HEATMAP (mock) ====
      // Visualizes "distance to 100 focus goal".
      const drawHeat = (x: number, y: number, r: number, color: string, alpha: number) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };

      const tx = cssW * target.x;
      const ty = cssH * target.y;

      const gap = Math.max(0, Math.min(100, focusGap));
      const severity = gap / 100; // 0..1

      // Near-goal = stronger green, weaker red; Far from goal = opposite.
      const greenA = 0.5 * (1 - severity) + 0.12;
      const yellowA = 0.22 + 0.25 * severity;
      const redA = 0.12 + 0.55 * severity;

      // Core (goal area)
      drawHeat(tx, ty, 90, 'rgb(0,255,100)', greenA);
      // Mild gap
      drawHeat(tx - cssW * 0.16, ty - cssH * 0.10, 60, 'rgb(255,220,0)', yellowA);
      drawHeat(tx + cssW * 0.15, ty - cssH * 0.12, 50, 'rgb(255,200,0)', yellowA * 0.9);

      // Larger gap spreads red "drift" areas
      const spread = 0.18 + 0.25 * severity;
      drawHeat(cssW * (0.08 + spread * 0.35), cssH * (0.86 - spread * 0.08), 46 + 30 * severity, 'rgb(255,30,0)', redA);
      drawHeat(cssW * (0.90 - spread * 0.22), cssH * (0.86 - spread * 0.05), 42 + 26 * severity, 'rgb(255,50,0)', redA * 0.9);
      drawHeat(tx + cssW * (0.18 + spread), ty + cssH * (0.12 + spread * 0.6), 34 + 28 * severity, 'rgb(255,80,0)', redA * 0.85);

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
        { color: '#00ff64', label: '接近 100' },
        { color: '#ffd700', label: '中等差距' },
        { color: '#ff1e00', label: '差距較大' },
      ];
      legendItems.forEach((item, i) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(20, 22 + i * 22, 5, 0, Math.PI * 2);
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
      style={{ display: 'block', height: 360 }}
    />
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [levelId, setLevelId] = useState<number>(1);
  const level = LEVELS_META.find(l => l.id === levelId) ?? LEVELS_META[0];
  const focusGoal = 100;
  const mockFocusScore = Math.max(55, Math.min(98, 92 - levelId * 4 + (dateRange === 'today' ? 2 : dateRange === 'month' ? -3 : 0)));
  const focusGap = Math.max(0, focusGoal - mockFocusScore);

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
              訓練成效熱力圖（距離 100）
            </div>
            <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              顯示距離「100 專注目標」還差多少（越綠越接近，越紅差距越大）
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
        <div className="flex items-center justify-between mb-3">
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#334155' }}>
            目前估算專注分數：{mockFocusScore} / 100
          </div>
          <div style={{ fontWeight: 900, fontSize: '13px', color: focusGap <= 10 ? '#059669' : focusGap <= 25 ? '#b45309' : '#dc2626' }}>
            差距：{focusGap}
          </div>
        </div>
        <HeatmapCanvas target={level.target} focusGap={focusGap} />
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