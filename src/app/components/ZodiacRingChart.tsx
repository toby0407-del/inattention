import { useMemo } from 'react';
import type { ChapterDef } from '../data/chapters';
import StarfieldCanvas from './StarfieldCanvas';

export type ZodiacRingChartProps = {
  chapters: ChapterDef[];
  completedLevels: number[];
  collectedLevelIds: number[];
};

const CX = 500;
const CY = 340;
const RX = 400;
const RY = 260;
const MINI_R = 52;

export default function ZodiacRingChart({
  chapters,
  completedLevels,
  collectedLevelIds,
}: ZodiacRingChartProps) {
  const items = useMemo(() => {
    const first12 = chapters.slice(0, 12);
    const capricornIndex = first12.findIndex(ch => (ch.levels[0]?.zodiac?.nameZh ?? '').includes('摩羯'));
    const startIndex = capricornIndex >= 0 ? capricornIndex : 9;
    const ordered = first12.map((_, i) => first12[(i + startIndex) % first12.length]!);
    return ordered.map((ch, i) => {
      const angle = ((i / 12) * Math.PI * 2) - Math.PI / 2;
      const cx = CX + RX * Math.cos(angle);
      const cy = CY + RY * Math.sin(angle);
      const z = ch.levels[0]?.zodiac;
      const nameZh = z?.nameZh ?? ch.title;
      const done = ch.levels.filter(
        l => completedLevels.includes(l.id) || collectedLevelIds.includes(l.id),
      ).length;
      const total = ch.levels.length;
      const allDone = done === total;
      const levelDone = ch.levels.map(
        l => completedLevels.includes(l.id) || collectedLevelIds.includes(l.id),
      );
      return { ch, cx, cy, nameZh, done, total, allDone, levelDone, angle };
    });
  }, [chapters, completedLevels, collectedLevelIds]);

  return (
    <div
      className="relative w-full"
      style={{
        background: 'linear-gradient(180deg, #020617 0%, #0c1426 50%, #020617 100%)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <div className="absolute inset-0 z-0">
        <StarfieldCanvas seed={7777} opacity={0.65} uniform={1} />
      </div>

      <svg
        viewBox={`0 0 ${CX * 2} ${CY * 2 + 40}`}
        className="relative z-[1] w-full h-auto block"
        style={{ maxHeight: '52vh' }}
      >
        {/* elliptical orbit ring */}
        <ellipse
          cx={CX}
          cy={CY}
          rx={RX + 18}
          ry={RY + 18}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={1.2}
          strokeDasharray="6 4"
        />

        {/* center sun glow */}
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={52} fill="url(#sun-glow)" />
        <circle cx={CX} cy={CY} r={26} fill="#fbbf24" />
        <circle cx={CX} cy={CY} r={22} fill="#f59e0b" />

        {items.map(({ ch, cx, cy, nameZh, done, total, allDone, levelDone }) => {
          const stars = ch.constellation?.stars ?? [];
          const edges = ch.constellation?.edges ?? [];

          const xs = stars.map(s => s.x);
          const ys = stars.map(s => s.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const sw = maxX - minX || 1;
          const sh = maxY - minY || 1;
          const scale = (MINI_R * 2) / Math.max(sw, sh);
          const ocx = (minX + maxX) / 2;
          const ocy = (minY + maxY) / 2;

          const mapPt = (p: { x: number; y: number }) => ({
            x: cx + (p.x - ocx) * scale,
            y: cy + (p.y - ocy) * scale,
          });

          return (
            <g key={ch.id}>
              {/* constellation edges */}
              {edges.map(([a, b], ei) => {
                const pa = stars[a];
                const pb = stars[b];
                if (!pa || !pb) return null;
                const ma = mapPt(pa);
                const mb = mapPt(pb);
                const both = !!levelDone[a] && !!levelDone[b];
                return (
                  <line
                    key={`e-${ch.id}-${ei}`}
                    x1={ma.x}
                    y1={ma.y}
                    x2={mb.x}
                    y2={mb.y}
                    stroke={both ? 'rgba(250,204,21,0.85)' : 'rgba(255,255,255,0.4)'}
                    strokeWidth={both ? 2.2 : 1.6}
                    strokeLinecap="round"
                  />
                );
              })}

              {/* constellation nodes */}
              {stars.map((s, si) => {
                const mp = mapPt(s);
                const d = !!levelDone[si];
                return (
                  <g key={`s-${ch.id}-${si}`}>
                    {d && (
                      <circle cx={mp.x} cy={mp.y} r={6.5} fill="rgba(250,204,21,0.2)" />
                    )}
                    <circle
                      cx={mp.x}
                      cy={mp.y}
                      r={d ? 4.2 : 3.4}
                      fill={d ? '#fde047' : '#f8fafc'}
                      opacity={d ? 1 : 0.72}
                    />
                  </g>
                );
              })}

              {/* label */}
              <text
                x={cx}
                y={cy + MINI_R + 22}
                textAnchor="middle"
                dominantBaseline="auto"
                fill={allDone ? '#fde68a' : 'rgba(226,232,240,0.85)'}
                fontSize="16"
                fontWeight="900"
                fontFamily='Nunito, "Noto Sans TC", "PingFang TC", system-ui, sans-serif'
                style={{ textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}
              >
                {nameZh}
              </text>
              <text
                x={cx}
                y={cy + MINI_R + 40}
                textAnchor="middle"
                dominantBaseline="auto"
                fill={allDone ? 'rgba(253,224,71,0.7)' : 'rgba(148,163,184,0.6)'}
                fontSize="12"
                fontWeight="800"
                fontFamily='Nunito, "Noto Sans TC", "PingFang TC", system-ui, sans-serif'
              >
                {done}/{total}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
