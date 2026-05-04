import type { ChapterDef } from '../data/chapters';
import { isChapterComplete, mapLayoutCoords } from '../data/levels';
import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';
import StarfieldCanvas from './StarfieldCanvas';

const ZOD_RING = 12;
const IDLE_DEG_PER_FRAME = 0.032;
const SKY_R = 56;
const MARKER_R = SKY_R * 0.9;
const EYE_Y = 0.52;
const MAX_TILT_DEG = 20;

/** 每關一顆主星：幾何與關卡數一致；必要時用路徑座標補齊，並保證主線鏈每顆都接到 */
function resolveAsterismGeometry(chapter: ChapterDef): { stars: { x: number; y: number }[]; edges: [number, number][] } {
  const n = chapter.levels.length;
  let stars = chapter.constellation?.stars ?? [];

  if (stars.length !== n || n === 0) {
    stars = mapLayoutCoords(chapter);
  }

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  const pushEdge = (a: number, b: number) => {
    if (a < 0 || b < 0 || a >= stars.length || b >= stars.length || a === b) return;
    const i = Math.min(a, b);
    const j = Math.max(a, b);
    const k = `${i},${j}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push([i, j]);
  };

  for (const [a, b] of chapter.constellation?.edges ?? []) pushEdge(a, b);
  for (let i = 0; i < stars.length - 1; i++) pushEdge(i, i + 1);

  return { stars, edges };
}

/** 僅星座示意：總是畫連線（兩端皆通關＝金色，否則白半透明）；主星已通關＝亮黃、未通關＝白半透明 */
function SkyAsterismSvg({
  chapter,
  levelDone,
  sizePx,
}: {
  chapter: ChapterDef;
  levelDone: boolean[];
  sizePx: number;
}) {
  const { stars, edges } = useMemo(() => resolveAsterismGeometry(chapter), [chapter]);
  const doneAt = useMemo(() => {
    const out = stars.map((_, i) => !!levelDone[i]);
    return out;
  }, [stars, levelDone]);

  const lineGold = 'rgba(250,204,21,0.92)';
  const lineDimWhite = 'rgba(255,255,255,0.52)';

  const sparkleLit = '#fde68a';
  const sparkleDim = '#f8fafc';

  const rng01 = useCallback((seed: number) => {
    // xorshift32 -> [0, 1)
    let x = seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  }, []);

  const bgDots = useMemo(() => {
    const seedBase = (chapter.id + 1) * 2654435761;
    // fill the whole card with starfield (dense, but lightweight)
    const n = 320;
    const out: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < n; i++) {
      const rx = rng01(seedBase ^ (i * 1013904223));
      const ry = rng01(seedBase ^ (i * 1664525));
      const rr = rng01(seedBase ^ (i * 69069));
      const ro = rng01(seedBase ^ (i * 1103515245));
      // spread across the whole viewBox
      const x = rx * 100;
      const y = ry * 100;
      // many tiny stars + some brighter ones
      const r = 0.25 + rr * 1.35;
      const o = 0.06 + ro * 0.42;
      out.push({ x, y, r, o });
    }
    return out;
  }, [chapter.id, rng01]);

  return (
    <svg width={sizePx} height={sizePx} viewBox="0 0 100 100" style={{ display: 'block' }} aria-hidden>
      <defs>
        <filter id="glowWhite" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glowGold" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* faint background dots inside each asterism card */}
      {bgDots.map((d, i) => (
        <circle key={`bg-${i}`} cx={d.x} cy={d.y} r={d.r} fill="rgba(255,255,255,0.95)" opacity={d.o} />
      ))}

      {edges.map(([a, b], i) => {
          const pa = stars[a];
          const pb = stars[b];
          if (!pa || !pb) return null;
          const both = !!doneAt[a] && !!doneAt[b];
          return (
            <line
              key={`e-${i}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={both ? lineGold : lineDimWhite}
              strokeWidth={both ? 2.9 : 2.35}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={both ? 0.98 : 0.62}
            />
          );
        })}
      {stars.map((p, i) => {
        const done = !!doneAt[i];
        const r = done ? 2.25 : 1.85;
        const spike = done ? 7.2 : 5.8;
        const fill = done ? sparkleLit : sparkleDim;
        const f = done ? 'url(#glowGold)' : 'url(#glowWhite)';
        return (
          <g key={`s-${i}`}>
            {/* sparkle spikes */}
            <g filter={f} opacity={done ? 1 : 0.92}>
              <line
                x1={p.x - spike}
                y1={p.y}
                x2={p.x + spike}
                y2={p.y}
                stroke={fill}
                strokeWidth={done ? 1.35 : 1.1}
                strokeLinecap="round"
                opacity={done ? 0.95 : 0.75}
              />
              <line
                x1={p.x}
                y1={p.y - spike}
                x2={p.x}
                y2={p.y + spike}
                stroke={fill}
                strokeWidth={done ? 1.35 : 1.1}
                strokeLinecap="round"
                opacity={done ? 0.95 : 0.75}
              />
              <line
                x1={p.x - spike * 0.72}
                y1={p.y - spike * 0.72}
                x2={p.x + spike * 0.72}
                y2={p.y + spike * 0.72}
                stroke={fill}
                strokeWidth={done ? 1.05 : 0.9}
                strokeLinecap="round"
                opacity={done ? 0.55 : 0.35}
              />
              <line
                x1={p.x - spike * 0.72}
                y1={p.y + spike * 0.72}
                x2={p.x + spike * 0.72}
                y2={p.y - spike * 0.72}
                stroke={fill}
                strokeWidth={done ? 1.05 : 0.9}
                strokeLinecap="round"
                opacity={done ? 0.55 : 0.35}
              />
              <circle cx={p.x} cy={p.y} r={r + 0.65} fill={fill} opacity={done ? 0.35 : 0.22} />
              <circle cx={p.x} cy={p.y} r={r} fill={fill} opacity={1} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}

function DarkDome() {
  return (
    <mesh renderOrder={-9} scale={[-1, 1, 1]}>
      <sphereGeometry args={[SKY_R, 48, 48]} />
      <meshBasicMaterial side={THREE.BackSide} color="#020617" toneMapped={false} />
    </mesh>
  );
}

function zodiacShortZh(nameZh: string | undefined, fallback: string): string {
  const s = (nameZh ?? fallback).trim();
  if (!s) return '···';
  return s.endsWith('座') ? s.slice(0, -1) : s;
}

type RingEntry = {
  ch: ChapterDef;
  i: number;
  complete: boolean;
  levelDone: boolean[];
};

function levelDoneForChapter(ch: ChapterDef, completedLevels: number[], collectedLevelIds: number[]): boolean[] {
  return ch.levels.map(l => completedLevels.includes(l.id) || collectedLevelIds.includes(l.id));
}

/** 第一視角仰望：略抬視線、稍廣角，像站在地平線上 */
function FirstPersonCamera() {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(0, EYE_Y, 0.1);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(1.02, 0, 0, 'YXZ');
  });
  return null;
}

function SkyContent({
  rotYDeg,
  rotXDeg,
  ring,
  layout,
}: {
  rotYDeg: number;
  rotXDeg: number;
  ring: RingEntry[];
  layout: 'embedded' | 'fullscreen';
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.order = 'YXZ';
    groupRef.current.rotation.y = THREE.MathUtils.degToRad(rotYDeg);
    groupRef.current.rotation.x = THREE.MathUtils.degToRad(rotXDeg);
  });

  const markerPositions = useMemo(() => {
    const polarFromZenith = THREE.MathUtils.degToRad(54);
    return ring.map(({ ch, i, complete, levelDone }) => {
      const az = THREE.MathUtils.degToRad(i * (360 / ZOD_RING));
      const y = MARKER_R * Math.cos(polarFromZenith);
      const rh = MARKER_R * Math.sin(polarFromZenith);
      const x = rh * Math.sin(az);
      const z = rh * Math.cos(az);
      return { ch, complete, levelDone, pos: new THREE.Vector3(x, y, z) };
    });
  }, [ring]);

  const svgPx = layout === 'fullscreen' ? 460 : 320;
  const df = layout === 'fullscreen' ? 17.2 : 11.2;

  return (
    <group ref={groupRef}>
      <DarkDome />

      {markerPositions.map(({ ch, complete, levelDone, pos }) => {
        const z = ch.levels[0]?.zodiac;
        const zh = z?.nameZh ?? ch.title;
        const label = zodiacShortZh(z?.nameZh, ch.title);
        const doneCount = levelDone.filter(Boolean).length;
        const total = ch.levels.length;

        return (
          <group key={ch.id} position={pos}>
            <Billboard follow>
              <Html
                transform={false}
                occlude={false}
                distanceFactor={df}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                center
              >
                <div
                  title={`${zh} — 主星 ${doneCount}/${total}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: layout === 'fullscreen' ? 4 : 5,
                    padding: layout === 'fullscreen' ? '6px 8px' : '6px 8px',
                    borderRadius: layout === 'fullscreen' ? 12 : 11,
                    border: complete ? '2px solid rgba(250,204,21,0.45)' : '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(2,6,23,0.58)',
                    boxShadow: complete ? '0 0 22px rgba(250,204,21,0.18)' : '0 4px 16px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(10px)',
                    minWidth: layout === 'fullscreen' ? svgPx + 20 : svgPx + 14,
                  }}
                >
                  <SkyAsterismSvg
                    chapter={ch}
                    levelDone={levelDone}
                    sizePx={layout === 'fullscreen' ? svgPx + 40 : svgPx + 52}
                  />
                  <span
                    style={{
                      fontWeight: 900,
                      fontSize: layout === 'fullscreen' ? '10px' : '10px',
                      letterSpacing: '0.04em',
                      color: complete ? '#fef9c3' : 'rgba(226,232,240,0.88)',
                      lineHeight: 1.15,
                      fontFamily: 'Nunito, "Noto Sans TC", "PingFang TC", system-ui, sans-serif',
                      textShadow: complete ? '0 0 10px rgba(250,204,21,0.35)' : 'none',
                    }}
                  >
                    {label}
                    <span style={{ opacity: 0.78, fontWeight: 800 }}> · {doneCount}/{total}</span>
                  </span>
                </div>
              </Html>
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

function TransparentBackdrop() {
  const { scene, gl } = useThree();
  useEffect(() => {
    scene.background = null;
    gl.setClearColor(0x000000, 0);
    return () => {
      gl.setClearColor(0x000000, 1);
    };
  }, [scene, gl]);
  return null;
}

type SkyGlProps = {
  widthPx: number;
  heightPx: number;
  rotYDeg: number;
  rotXDeg: number;
  ring: RingEntry[];
  layout: 'embedded' | 'fullscreen';
  starSeed: number;
};

function SkyGl({ widthPx, heightPx, rotYDeg, rotXDeg, ring, layout, starSeed }: SkyGlProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [0, EYE_Y, 0.14], fov: layout === 'fullscreen' ? 80 : 74, near: 0.08, far: 280 }}
      style={{
        width: widthPx,
        height: heightPx,
        display: 'block',
        borderRadius: 0,
        touchAction: 'none',
      }}
    >
      <Html
        transform={false}
        occlude={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: `${widthPx}px`,
          height: `${heightPx}px`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <StarfieldCanvas seed={starSeed} opacity={layout === 'fullscreen' ? 0.85 : 0.75} uniform={1} />
      </Html>
      <TransparentBackdrop />
      <ambientLight intensity={0.045} color="#cbd5e1" />
      <FirstPersonCamera />
      <Suspense fallback={null}>
        <SkyContent rotYDeg={rotYDeg} rotXDeg={rotXDeg} ring={ring} layout={layout} />
      </Suspense>
    </Canvas>
  );
}

type BoundaryState = { hasError: boolean };

class GlobeErrorBoundary extends React.Component<React.PropsWithChildren<object>, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    /* 靜默 */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center text-center px-6"
          style={{ width: '100%', minHeight: 200, fontWeight: 800, fontSize: 14, color: '#57534e' }}
        >
          3D 星空暫無法載入，請重整頁面或更新瀏覽器。
        </div>
      );
    }
    return this.props.children;
  }
}

export type ConstellationGlobeProps = {
  chapters: ChapterDef[];
  completedLevels: number[];
  collectedLevelIds: number[];
  /** embedded：星圖內嵌；fullscreen：圖鑑全螢幕時放大天幕 */
  layout?: 'embedded' | 'fullscreen';
};

export default function ConstellationGlobe({
  chapters,
  completedLevels,
  collectedLevelIds,
  layout = 'embedded',
}: ConstellationGlobeProps) {
  const [size, setSize] = useState(280);
  const [fsSize, setFsSize] = useState({ w: 360, h: 520 });
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (layout === 'fullscreen') {
        const el = viewportRef.current;
        if (el) {
          const r = el.getBoundingClientRect();
          const w = Math.max(280, Math.floor(r.width));
          const h = Math.max(320, Math.floor(r.height));
          setFsSize({ w, h });
          return;
        }
        const pw = Math.max(280, window.innerWidth);
        const ph = Math.max(320, window.innerHeight);
        setFsSize({ w: pw, h: ph });
      } else {
        setSize(Math.min(300, Math.max(220, Math.min(window.innerWidth - 48, 304))));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [layout]);

  useEffect(() => {
    if (layout !== 'fullscreen') return;
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const w = Math.max(280, Math.floor(r.width));
      const h = Math.max(320, Math.floor(r.height));
      setFsSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);

  const [rotY, setRotY] = useState(0);
  const [rotX, setRotX] = useState(0);
  const draggingRef = useRef(false);
  const idleRef = useRef(true);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (idleRef.current && !draggingRef.current) {
        setRotY(prev => prev + IDLE_DEG_PER_FRAME);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    idleRef.current = false;
  }, []);

  const lastX = useRef(0);
  const lastY = useRef(0);
  useEffect(() => {
    function move(e: PointerEvent) {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      setRotY(r => r + dx * 0.42);
      setRotX(r => Math.min(MAX_TILT_DEG, Math.max(-MAX_TILT_DEG, r - dy * 0.32)));
    }
    function up() {
      draggingRef.current = false;
      idleRef.current = true;
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const onPointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      onPointerDown(e);
    },
    [onPointerDown],
  );

  const ring = useMemo(() => {
    return chapters.slice(0, ZOD_RING).map((ch, i) => {
      const complete = isChapterComplete(ch, completedLevels);
      const levelDone = levelDoneForChapter(ch, completedLevels, collectedLevelIds);
      return { ch, i, complete, levelDone };
    });
  }, [chapters, completedLevels, collectedLevelIds]);

  const hMul = 0.72;
  const hPx = Math.round(size * hMul);
  const corner = layout === 'fullscreen' ? 16 : 16;
  const boxW = layout === 'fullscreen' ? fsSize.w : size;
  const boxH = layout === 'fullscreen' ? fsSize.h : hPx;
  const starSeed = (chapters[0]?.id ?? 1) * 9973;

  return (
    <div className={`flex flex-col items-center select-none ${layout === 'fullscreen' ? 'flex-1 min-h-0 justify-stretch w-full' : ''}`}>
      <div
        ref={layout === 'fullscreen' ? viewportRef : undefined}
        className="relative mx-auto cursor-grab active:cursor-grabbing overflow-hidden w-full"
        role="application"
        aria-label={
          layout === 'fullscreen'
            ? '星象圖：背景有隨機星海；僅十二星座主星與連線為遊戲標示。已通關主星與線段為黃色，否則白半透明。拖曳旋轉。'
            : '星象收藏：背景有隨機星海示意；僅十二星座主星與連線為遊戲標示。黃為已通關，拖曳旋轉。'
        }
        style={{
          touchAction: 'none',
          width: layout === 'fullscreen' ? '100%' : size,
          maxWidth: layout === 'fullscreen' ? boxW : undefined,
          height: boxH,
          borderRadius: corner,
          boxShadow:
            layout === 'fullscreen'
              ? 'inset 0 -24px 60px rgba(0,0,0,0.65)'
              : 'inset 0 -40px 80px rgba(0,0,0,0.45), 0 8px 32px rgba(2,6,23,0.35)',
        }}
        onPointerDown={onPointerDownCapture}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            borderRadius: corner,
            background:
              layout === 'fullscreen'
                ? 'linear-gradient(180deg, #020617 0%, #0b1220 40%, #000 100%)'
                : 'linear-gradient(180deg, #030712 0%, #071018 52%, #000105 100%)',
          }}
        />
        <div className="relative z-[1] h-full w-full [&>canvas]:block">
          <GlobeErrorBoundary>
            <SkyGl
              widthPx={boxW}
              heightPx={boxH}
              rotYDeg={rotY}
              rotXDeg={rotX}
              ring={ring}
              layout={layout}
              starSeed={starSeed}
            />
          </GlobeErrorBoundary>
        </div>
      </div>

      {layout !== 'fullscreen' && (
        <>
          <p className="text-center px-4 mt-2 sm:mt-3" style={{ fontWeight: 800, fontSize: '13px', color: '#44403c' }}>
            僅十二星座主星與連線 · 背景隨機星海 · 拖曳旋轉 · 黃＝已通關／白半透明＝未通關
          </p>
          <div
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-2 mb-1"
            style={{ fontWeight: 800, fontSize: '11px', color: '#57534e' }}
          >
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                style={{ background: '#fde047', boxShadow: '0 0 8px rgba(250,204,21,0.75)' }}
              />
              主星已點亮
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-3.5 h-3.5 rounded-full shrink-0 bg-slate-500 opacity-50" />
              主星未達
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
                style={{ background: 'linear-gradient(145deg,#facc15,#eab308)', border: '1px solid #fde047' }}
              />
          十二星座連線（兩端通關＝金色）
        </span>
      </div>
        </>
      )}
    </div>
  );
}
