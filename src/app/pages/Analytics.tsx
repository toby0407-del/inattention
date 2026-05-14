import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
  LineChart, Line, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ReferenceLine,
} from 'recharts';
import { AlertCircle, Clock, Target, TrendingUp, TrendingDown, Award, Brain, Activity } from 'lucide-react';
import { LEVELS_META, CHAPTERS } from '../data/levels';
import { useApp } from '../context/AppContext';

// ── Simulated data ──────────────────────────────────────────────────────────

const DISTRACTOR_DATA = [
  { name: '突發音效', seconds: 8.2, color: '#ff6b6b' },
  { name: '移動色塊', seconds: 5.7, color: '#ff922b' },
  { name: '邊角閃爍', seconds: 4.1, color: '#ffd43b' },
  { name: '背景變化', seconds: 3.3, color: '#74c0fc' },
];

const DAILY_TREND = [
  { day: '週一', score: 68, sessions: 2 },
  { day: '週二', score: 72, sessions: 1 },
  { day: '週三', score: 75, sessions: 3 },
  { day: '週四', score: 71, sessions: 2 },
  { day: '週五', score: 80, sessions: 2 },
  { day: '週六', score: 84, sessions: 4 },
  { day: '週日', score: 87, sessions: 3 },
];

const MODE_PERFORMANCE = [
  { mode: '找不同', score: 84, color: '#6366f1' },
  { mode: '拼圖', score: 76, color: '#f59e0b' },
  { mode: '順序排列', score: 71, color: '#10b981' },
  { mode: '記憶配對', score: 68, color: '#ef4444' },
];

const RADAR_DATA = [
  { skill: '持續專注', value: 82 },
  { skill: '抗干擾力', value: 67 },
  { skill: '視覺追蹤', value: 88 },
  { skill: '工作記憶', value: 73 },
  { skill: '反應速度', value: 79 },
  { skill: '衝動控制', value: 71 },
];


// ── HeatmapCanvas (unchanged) ────────────────────────────────────────────────

function HeatmapCanvas({
  target = { x: 0.5, y: 0.38 },
  focusGap = 12,
}: {
  target?: { x: number; y: number };
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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const bgGrad = ctx.createRadialGradient(cssW / 2, cssH / 2, 0, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
      bgGrad.addColorStop(0, '#132042');
      bgGrad.addColorStop(1, '#0b1223');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      const tx = cssW * target.x;
      const ty = cssH * target.y;
      const gap = Math.max(0, Math.min(100, focusGap));
      const severity = gap / 100;
      const shortest = Math.min(cssW, cssH);
      const R = Math.min(shortest * (0.38 + severity * 0.16), Math.hypot(cssW, cssH) * 0.45);

      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const lerpRgb = (a: readonly [number, number, number], b: readonly [number, number, number], t: number) =>
        [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))] as const;
      const green = [16, 220, 130] as const;
      const amber = [250, 190, 30] as const;
      const red = [250, 55, 75] as const;
      const [cr, cg, cb] = severity <= 0.5 ? lerpRgb(green, amber, severity / 0.5) : lerpRgb(amber, red, (severity - 0.5) / 0.5);

      const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, R);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${Math.max(0.55, 0.74 - severity * 0.1)})`);
      g.addColorStop(0.32, `rgba(${cr},${cg},${cb},${Math.max(0.28, 0.38 - severity * 0.08)})`);
      g.addColorStop(0.62, `rgba(${cr},${cg},${cb},${Math.max(0.1, 0.18 - severity * 0.06)})`);
      g.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tx, ty, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cssW / 2, 0); ctx.lineTo(cssW / 2, cssH);
      ctx.moveTo(0, cssH / 2); ctx.lineTo(cssW, cssH / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const spread = shortest * (0.08 + severity * 0.22);
      for (let i = 0; i < 46; i++) {
        const ang = (i * 37 * Math.PI) / 180;
        const radius = ((i % 7) / 6) * spread + (i / 46) * spread * 0.5;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${(0.2 + (i / 46) * 0.55).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(tx + Math.cos(ang) * radius, ty + Math.sin(ang) * radius, 2 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx - 16, ty); ctx.lineTo(tx - 6, ty);
      ctx.moveTo(tx + 6, ty); ctx.lineTo(tx + 16, ty);
      ctx.moveTo(tx, ty - 16); ctx.lineTo(tx, ty - 6);
      ctx.moveTo(tx, ty + 6); ctx.lineTo(tx, ty + 16);
      ctx.stroke();
      ctx.restore();

      // Legend
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.rect(8, 8, 170, 92); ctx.fill();
      [{ color: '#10dc82', label: '高專注' }, { color: '#f5be1e', label: '中等偏移' }, { color: '#fa374b', label: '偏移較大' }]
        .forEach((item, i) => {
          ctx.fillStyle = item.color;
          ctx.beginPath(); ctx.arc(20, 22 + i * 22, 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = '11px Inter, sans-serif';
          ctx.fillText(item.label, 32, 26 + i * 22);
        });
      ctx.fillStyle = 'rgba(200,210,240,0.8)';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('＋ = 視線目標點', 12, 84);
    }

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);
    window.addEventListener('resize', draw);
    return () => { ro.disconnect(); window.removeEventListener('resize', draw); };
  }, [target.x, target.y, focusGap]);

  return <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ display: 'block', height: 240 }} />;
}

// ── Mini stat card ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = '#6366f1',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend === 'up' && <TrendingUp size={15} className="text-emerald-500" />}
        {trend === 'down' && <TrendingDown size={15} className="text-red-400" />}
      </div>
      <div style={{ fontWeight: 900, fontSize: '22px', color: '#0f172a', lineHeight: 1 }}>{value}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '12px', color: '#334155' }}>{label}</div>
        <div style={{ fontWeight: 500, fontSize: '11px', color: '#94a3b8' }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [levelId, setLevelId] = useState<number>(1);
  const { completedLevels } = useApp();
  const level = LEVELS_META.find(l => l.id === levelId) ?? LEVELS_META[0]!;

  const chapterProgress = CHAPTERS.map(ch => {
    const completedCount = ch.levels.filter(l => completedLevels.includes(l.id)).length;
    const mockAvgScore = completedCount === 0
      ? 0
      : Math.max(60, Math.min(95, 70 + completedCount * 4 - ch.id));
    return {
      id: ch.id,
      name: ch.levels[0]?.zodiac?.nameZh ?? ch.title,
      glyph: ch.levels[0]?.zodiac?.glyph ?? ch.mapEmoji,
      completed: completedCount,
      total: ch.levels.length,
      avgScore: completedCount > 0 ? mockAvgScore : 0,
    };
  });

  const mockFocusScore = Math.max(55, Math.min(98, 92 - levelId * 4 + (dateRange === 'today' ? 2 : dateRange === 'month' ? -3 : 0)));
  const focusGap = 100 - mockFocusScore;
  const weekAvg = Math.round(DAILY_TREND.reduce((s, d) => s + d.score, 0) / DAILY_TREND.length);
  const totalSessions = DAILY_TREND.reduce((s, d) => s + d.sessions, 0);

  const spreadFactor = Math.min(0.18, focusGap / 200);
  const qBase = [
    { id: '左上', weight: 0.44 }, { id: '右上', weight: 0.26 },
    { id: '左下', weight: 0.18 }, { id: '右下', weight: 0.12 },
  ];
  const qSum0 = qBase.reduce((s, q, i) => s + Math.max(0.06, q.weight + (i === 0 ? -spreadFactor : spreadFactor / 3)), 0);
  const quadrantPercentages = qBase.map((q, i) => ({
    id: q.id,
    pct: Math.round((Math.max(0.06, q.weight + (i === 0 ? -spreadFactor : spreadFactor / 3)) / qSum0) * 100),
  }));

  return (
    <div className="space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1e293b' }}>專注力分析報告</h2>
          <p style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>視線追蹤 · 熱點分析 · 能力雷達 · AI 建議</p>
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

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Brain} label="本週平均專注分" sub="共 7 天訓練紀錄" value={`${weekAvg}分`} trend="up" color="#6366f1" />
        <StatCard icon={Activity} label="訓練次數" sub={`本${dateRange === 'today' ? '日' : dateRange === 'week' ? '週' : '月'}`} value={`${totalSessions}次`} trend="up" color="#10b981" />
        <StatCard icon={Target} label="關卡完成率" sub="已解鎖關卡中" value="78%" trend="up" color="#f59e0b" />
        <StatCard icon={AlertCircle} label="平均干擾秒數" sub="每次訓練平均" value="6.4秒" trend="down" color="#ef4444" />
      </div>

      {/* ── Focus trend ── */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>本週專注分數趨勢</div>
        <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
          每日訓練平均專注分數（每格一天，含每日訓練次數）
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={DAILY_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 3" label={{ value: '目標 80', fill: '#10b981', fontSize: 11, fontWeight: 700 }} />
            <Tooltip
              formatter={(v: number, name: string) => [name === 'score' ? `${v} 分` : `${v} 次`, name === 'score' ? '專注分數' : '訓練次數']}
              contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12 }}
            />
            <Legend formatter={(v) => v === 'score' ? '專注分數' : '訓練次數'} wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
            <Bar dataKey="sessions" fill="#e0e7ff" radius={[4, 4, 0, 0]} opacity={0.6} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ── Heatmap + Radar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heatmap */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>視線熱力圖</div>
              <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8' }}>目標點注視分佈 · 四象限分析</p>
            </div>
            <select
              value={levelId}
              onChange={e => setLevelId(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
              style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}
              aria-label="選擇關卡"
            >
              {LEVELS_META.map(l => (
                <option key={l.id} value={l.id}>第{l.chapterId}-{l.indexInChapter}關</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 mb-3 p-3 rounded-2xl" style={{ background: '#f8fafc' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '20px', color: mockFocusScore >= 80 ? '#059669' : mockFocusScore >= 65 ? '#d97706' : '#dc2626', lineHeight: 1 }}>
                {mockFocusScore}
              </div>
              <div style={{ fontWeight: 600, fontSize: '11px', color: '#94a3b8' }}>本關專注分</div>
            </div>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${mockFocusScore}%`,
                  background: mockFocusScore >= 80 ? '#10b981' : mockFocusScore >= 65 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div style={{ fontWeight: 700, fontSize: '12px', color: '#64748b' }}>/ 100</div>
          </div>

          <HeatmapCanvas target={level.target} focusGap={focusGap} />

          <div className="mt-3 grid grid-cols-2 gap-2">
            {quadrantPercentages.map(q => (
              <div
                key={q.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: '#f1f5f9' }}
              >
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>{q.id}</span>
                <span style={{ fontWeight: 900, fontSize: '13px', color: '#334155' }}>{q.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Radar chart */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>認知能力雷達</div>
          <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
            六大專注相關能力評估（100 分為理想標準）
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} />
              <Radar name="能力值" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.22} strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} />
              <Tooltip
                formatter={(v: number) => [`${v} 分`, '能力值']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700, fontSize: 12 }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {RADAR_DATA.map(r => (
              <div key={r.skill} className="text-center">
                <div style={{
                  fontWeight: 900, fontSize: '15px', lineHeight: 1,
                  color: r.value >= 80 ? '#059669' : r.value >= 70 ? '#d97706' : '#dc2626',
                }}>{r.value}</div>
                <div style={{ fontWeight: 600, fontSize: '10px', color: '#94a3b8', marginTop: 2 }}>{r.skill}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Game mode + Distractor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mode performance */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>遊戲模式分析</div>
          <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            各模式平均專注分數比較
          </p>
          <div className="space-y-3">
            {MODE_PERFORMANCE.map(m => (
              <div key={m.mode}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{m.mode}</span>
                  <span style={{ fontWeight: 900, fontSize: '14px', color: m.color }}>{m.score} 分</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: m.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-2xl" style={{ background: '#fff7ed' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: '#92400e' }}>
              💡 建議：記憶配對得分偏低（{MODE_PERFORMANCE[3]?.score} 分），可調短展示秒數、延長作答時間讓個案更從容。
            </div>
          </div>
        </motion.div>

        {/* Distractor chart */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>干擾物停留分析</div>
          <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
            各干擾物類型吸引視線的秒數（越短越佳）
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={DISTRACTOR_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="s" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={72} />
              <Tooltip formatter={(v: number) => [`${v}s`, '停留時間']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              <Bar dataKey="seconds" radius={[0, 8, 8, 0]}>
                {DISTRACTOR_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex flex-wrap gap-2">
            {DISTRACTOR_DATA.map(d => (
              <span key={d.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#475569' }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                {d.name} {d.seconds}s
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Chapter progress ── */}
      <motion.div
        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginBottom: '4px' }}>星座章節進度</div>
        <p style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
          各章節關卡完成數與平均得分
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {chapterProgress.map(ch => {
            const pct = ch.total > 0 ? Math.round((ch.completed / ch.total) * 100) : 0;
            const done = ch.completed === ch.total && ch.total > 0;
            const started = ch.completed > 0;
            return (
              <div key={ch.id} className="rounded-2xl p-3 border" style={{
                background: done
                  ? 'linear-gradient(135deg, #ecfdf5, #f0fdf4)'
                  : started ? '#fefce8' : '#f8fafc',
                borderColor: done ? '#6ee7b7' : started ? '#fde68a' : '#e2e8f0',
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 18 }}>{ch.glyph}</span>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: done ? '#059669' : started ? '#92400e' : '#94a3b8', lineHeight: 1.2 }}>
                    {ch.name}{done ? ' ✓' : ''}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: done ? '#10b981' : started ? '#f59e0b' : '#e2e8f0',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ fontWeight: 700, fontSize: '11px', color: '#94a3b8' }}>
                    {ch.completed}/{ch.total} 關
                  </span>
                  {ch.avgScore > 0 ? (
                    <span style={{
                      fontWeight: 900, fontSize: '12px',
                      color: ch.avgScore >= 80 ? '#059669' : '#d97706',
                    }}>
                      {ch.avgScore}分
                    </span>
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: '11px', color: '#cbd5e1' }}>未開始</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── AI Feedback ── */}
      <motion.div
        className="rounded-3xl p-6 border-2 border-dashed border-violet-200"
        style={{ background: 'linear-gradient(135deg, #faf5ff, #f0f9ff)' }}
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: '#4c1d95' }}>✨ AI 復健導師回饋</div>
            <div style={{ fontWeight: 500, fontSize: '12px', color: '#7c3aed' }}>根據本{dateRange === 'today' ? '日' : dateRange === 'week' ? '週' : '月'}資料自動分析</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/85 rounded-2xl p-4">
            <div className="flex gap-2 mb-2">
              <span className="text-lg">📊</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>表現總評</div>
            </div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#475569', lineHeight: 1.65 }}>
              本週平均 <strong>{weekAvg} 分</strong>，相較上週進步 <strong className="text-emerald-600">+8%</strong>。視覺追蹤（88分）表現突出，工作記憶（73分）略顯吃力，建議增加記憶配對訓練。
            </p>
          </div>

          <div className="bg-white/85 rounded-2xl p-4">
            <div className="flex gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>需加強項目</div>
            </div>
            <ul className="space-y-1.5">
              {[
                '抗干擾力 67 分偏低，突發音效影響最大（8.2s）',
                '衝動控制 71 分，找不同遊戲中誤點頻率偏高',
                '記憶配對完成率 68 分，展示時間可考慮延長 0.5s',
              ].map((tip, i) => (
                <li key={i} className="flex gap-1.5" style={{ fontSize: '12px', fontWeight: 500, color: '#475569', lineHeight: 1.55 }}>
                  <span className="text-red-400 mt-0.5 shrink-0">•</span><span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white/85 rounded-2xl p-4">
            <div className="flex gap-2 mb-2">
              <span className="text-lg">🏠</span>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#334155' }}>居家練習建議</div>
            </div>
            <ul className="space-y-1.5">
              {[
                '每次訓練前做 2 分鐘眼球伸展，提升追蹤靈活性',
                '調暗環境光提高畫面反差，減少環境分心來源',
                '嘗試在輕柔背景音中訓練，逐步降低音效敏感度',
              ].map((tip, i) => (
                <li key={i} className="flex gap-1.5" style={{ fontSize: '12px', fontWeight: 500, color: '#475569', lineHeight: 1.55 }}>
                  <span className="text-violet-400 mt-0.5 shrink-0">•</span><span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl flex items-start gap-3" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))', border: '1px solid rgba(139,92,246,0.25)' }}>
          <Award size={18} className="text-violet-500 shrink-0 mt-0.5" />
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#4c1d95', lineHeight: 1.6 }}>
            <strong>下一步建議：</strong>個案已完成「牡羊座」全章（6/6），建議進入「金牛座」前先複習第 4-6 關，鞏固抗干擾能力後再推進新章節，有助維持學習信心。
          </p>
        </div>
      </motion.div>
    </div>
  );
}
