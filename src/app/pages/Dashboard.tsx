import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Clock, Eye, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Granularity = 'day' | 'week' | 'month';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateInput(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfWeek(d: Date) {
  // Monday as start
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Mon=0, Sun=6
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function labelForBucket(bucketStart: Date, g: Granularity) {
  if (g === 'day') {
    return `${pad2(bucketStart.getMonth() + 1)}/${pad2(bucketStart.getDate())}`;
  }
  if (g === 'week') {
    return `週 ${pad2(bucketStart.getMonth() + 1)}/${pad2(bucketStart.getDate())}`;
  }
  return `${bucketStart.getFullYear()}/${pad2(bucketStart.getMonth() + 1)}`;
}

function bucketStartFor(d: Date, g: Granularity) {
  if (g === 'day') return startOfDay(d);
  if (g === 'week') return startOfWeek(d);
  return startOfMonth(d);
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function seeded(n: number) {
  // deterministic pseudo-random in [0,1)
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function buildMockSessions(days: number) {
  const today = startOfDay(new Date());
  const sessions: { date: Date; score: number; focus: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const t = (days - i) / days; // 0..1
    const base = 55 + t * 30;
    const noise = (seeded(i * 13.7) - 0.5) * 10;
    const score = Math.max(35, Math.min(100, Math.round(base + noise)));
    const focus = Math.max(10, Math.min(120, Math.round(25 + t * 55 + (seeded(i * 7.3) - 0.5) * 12)));
    sessions.push({ date: d, score, focus });
  }
  return sessions;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-3">
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{label}</p>
        <p style={{ fontSize: '12px', color: '#0f766e', fontWeight: 600 }}>專注得分：{payload[0]?.value}</p>
        <p style={{ fontSize: '12px', color: '#4dabf7', fontWeight: 600 }}>專注秒數：{payload[1]?.value}s</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedChild } = useApp();
  const sessions = useMemo(() => buildMockSessions(120), []);

  const [granularity, setGranularity] = useState<Granularity>('day');
  const defaultTo = startOfDay(new Date());
  const defaultFrom = addDays(defaultTo, -6);
  const [from, setFrom] = useState(toDateInputValue(defaultFrom));
  const [to, setTo] = useState(toDateInputValue(defaultTo));

  const progressData = useMemo(() => {
    const fromD = startOfDay(parseDateInput(from));
    const toD = startOfDay(parseDateInput(to));
    const start = fromD <= toD ? fromD : toD;
    const end = fromD <= toD ? toD : fromD;

    const buckets = new Map<string, { start: Date; scoreSum: number; focusSum: number; count: number }>();

    sessions.forEach(s => {
      const d = startOfDay(s.date);
      if (d < start || d > end) return;
      const bStart = bucketStartFor(d, granularity);
      const key = dateKey(bStart);
      const b = buckets.get(key) ?? { start: bStart, scoreSum: 0, focusSum: 0, count: 0 };
      b.scoreSum += s.score;
      b.focusSum += s.focus;
      b.count += 1;
      buckets.set(key, b);
    });

    const arr = Array.from(buckets.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
    return arr.map(b => ({
      day: labelForBucket(b.start, granularity),
      score: Math.round(b.scoreSum / Math.max(1, b.count)),
      focus: Math.round(b.focusSum / Math.max(1, b.count)),
    }));
  }, [from, to, granularity, sessions]);

  const stats = [
    {
      icon: Clock,
      label: '本週訓練時長',
      value: '142',
      unit: '分鐘',
      change: '+12%',
      positive: true,
      gradient: 'from-emerald-400 to-teal-500',
      bg: 'bg-emerald-50',
    },
    {
      icon: Eye,
      label: '平均專注維持',
      value: '8.3',
      unit: '秒',
      change: '+0.7s',
      positive: true,
      gradient: 'from-blue-400 to-indigo-500',
      bg: 'bg-blue-50',
    },
    {
      icon: AlertTriangle,
      label: '分心偏移次數',
      value: '24',
      unit: '次',
      change: '-5次',
      positive: true,
      gradient: 'from-orange-400 to-red-400',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Welcome banner */}
      <motion.div
        className="rounded-3xl p-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f9b8e, #1d6fa4)' }}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute right-6 top-4 text-7xl opacity-20 select-none">👁️</div>
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>個案追蹤</div>
        <h2 className="mt-1 text-white" style={{ fontWeight: 900, fontSize: '24px' }}>{selectedChild.name} 的本週訓練摘要</h2>
        <p style={{ fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
          本週進步顯著！專注維持時間提升 0.7 秒 🎉
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon size={16} className="text-white" />
                </div>
              </div>
              <span
                className="text-sm px-2 py-1 rounded-lg"
                style={{
                  background: stat.positive ? '#f0fdf4' : '#fef2f2',
                  color: stat.positive ? '#16a34a' : '#dc2626',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                {stat.change}
              </span>
            </div>
            <div style={{ fontWeight: 500, fontSize: '13px', color: '#94a3b8' }}>{stat.label}</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span style={{ fontWeight: 900, fontSize: '32px', color: '#1e293b' }}>{stat.value}</span>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#94a3b8' }}>{stat.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line chart */}
        <motion.div
          className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>進步曲線</div>
              <div style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8' }}>可調整日期區間與日/週/月</div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-teal-400" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>得分</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>專注秒</span>
              </div>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <select
                value={granularity}
                onChange={e => setGranularity(e.target.value as Granularity)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}
                aria-label="時間粒度"
              >
                <option value="day">每日</option>
                <option value="week">每週</option>
                <option value="month">每月</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}
                  aria-label="起始日期"
                />
                <span className="text-slate-400" style={{ fontWeight: 700, fontSize: '12px' }}>—</span>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}
                  aria-label="結束日期"
                />
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progressData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#20c997" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#20c997" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4dabf7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4dabf7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#20c997" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#20c997', r: 4 }} />
              <Area type="monotone" dataKey="focus" stroke="#4dabf7" strokeWidth={2.5} fill="url(#focusGrad)" dot={{ fill: '#4dabf7', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent snapshot */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b', marginBottom: '4px' }}>最新訓練快照</div>
          <div style={{ fontWeight: 500, fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>今日 14:23</div>

          {/* Mock heatmap thumbnail */}
          <div className="rounded-2xl overflow-hidden mb-4 relative" style={{ aspectRatio: '16/9', background: '#1a2744' }}>
            {/* Simplified game scene */}
            <svg viewBox="0 0 160 90" className="w-full h-full">
              <rect width="160" height="90" fill="#1a2744" />
              <ellipse cx="80" cy="55" rx="70" ry="25" fill="#2d5a27" />
              <circle cx="80" cy="40" r="15" fill="#ffd43b" opacity="0.7" />
              <circle cx="30" cy="30" r="8" fill="#74c0fc" opacity="0.5" />
              <circle cx="130" cy="35" r="6" fill="#74c0fc" opacity="0.5" />
              {/* Heat zones */}
              <circle cx="80" cy="40" r="20" fill="rgba(0,255,0,0.25)" />
              <circle cx="30" cy="30" r="15" fill="rgba(255,165,0,0.3)" />
              <circle cx="130" cy="35" r="12" fill="rgba(255,0,0,0.3)" />
              <circle cx="25" cy="70" r="10" fill="rgba(255,0,0,0.25)" />
            </svg>
            <div className="absolute top-2 right-2 bg-black/60 text-white rounded-lg px-2 py-0.5" style={{ fontSize: '9px', fontWeight: 700 }}>
              視線熱點圖
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            {[
              { color: '#20c997', label: '中央專注', value: '68%' },
              { color: '#ffd43b', label: '周邊游移', value: '22%' },
              { color: '#ff6b6b', label: '邊角干擾', value: '10%' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/parent/analytics')}
            className="mt-4 w-full py-2.5 rounded-2xl flex items-center justify-center gap-1 transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #20c997, #4dabf7)', color: 'white', fontWeight: 700, fontSize: '13px' }}
          >
            查看完整分析 <ChevronRight size={15} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
