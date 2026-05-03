import type { ChapterDef } from '../data/chapters';
import { isChapterComplete } from '../data/levels';
import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';

const ZOD_RING = 12;
const IDLE_DEG_PER_FRAME = 0.1;
const EARTH_RADIUS = 1;

/** 衛星／Google Earth 風：深藍海、黃綠陸塊、少量雲絮（無外連圖檔） */
function buildProceduralEarthTexture(seed = 20260503) {
  let s = seed;
  const rnd = () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    return ((s ^ (s >>> 7)) >>> 0) / 4294967296;
  };

  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d');

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#1b4f7a');
  g.addColorStop(0.45, '#0e3a5c');
  g.addColorStop(1, '#07182a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const shallow = ctx.createRadialGradient(w * 0.35, h * 0.38, 0, w * 0.42, h * 0.45, h * 0.55);
  shallow.addColorStop(0, 'rgba(52,148,230,0.22)');
  shallow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shallow;
  ctx.fillRect(0, 0, w, h);

  const continents: [number, number, number, number][] = [
    [0.12, 0.28, w * 0.22, h * 0.2],
    [0.38, 0.22, w * 0.28, h * 0.18],
    [0.72, 0.3, w * 0.2, h * 0.22],
    [0.52, 0.46, w * 0.26, h * 0.12],
    [0.2, 0.52, w * 0.18, h * 0.14],
    [0.76, 0.58, w * 0.16, h * 0.2],
  ];
  ctx.filter = 'blur(42px)';
  for (const [nx, ny, rw, rh] of continents) {
    const ox = rnd() * 40 - 20;
    const oy = rnd() * 30 - 15;
    const cx = nx * w + ox;
    const cy = ny * h + oy;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rw, rh) * 0.55);
    gr.addColorStop(0, `rgba(${165 + rnd() * 50}, ${140 + rnd() * 45}, ${85 + rnd() * 35}, ${0.55 + rnd() * 0.2})`);
    gr.addColorStop(0.55, `rgba(${55 + rnd() * 40}, ${110 + rnd() * 50}, ${62 + rnd() * 30}, ${0.35 + rnd() * 0.15})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw * 0.45, rh * 0.45, rnd() * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';

  for (let i = 0; i < 18; i++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const rr = 8 + rnd() * 42;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gr.addColorStop(0, 'rgba(255,255,255,0.04)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.055;
  for (let x = 0; x < w; x += 5) {
    for (let y = 0; y < h; y += 6) {
      if (rnd() > 0.992) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(x, y, 1, 3 + rnd() * 8);
      }
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function buildCloudAlphaTexture(seed = 20260504) {
  let s = seed;
  const rnd = () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    return ((s ^ (s >>> 7)) >>> 0) / 4294967296;
  };
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.filter = 'blur(16px)';
  for (let i = 0; i < 32; i++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const rr = 16 + rnd() * 64;
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gr.addColorStop(0, `rgba(248,252,255,${0.08 + rnd() * 0.14})`);
    gr.addColorStop(1, 'rgba(248,252,255,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function MiniAsterismSvg({ chapter, complete }: { chapter: ChapterDef; complete: boolean }) {
  const stars = chapter.constellation?.stars ?? [];
  const edges = chapter.constellation?.edges ?? [];
  if (stars.length === 0) return null;
  const stroke = complete ? 'rgba(167,243,208,0.85)' : 'rgba(148,163,184,0.62)';
  const dot = complete ? '#a7f3d0' : '#cbd5e1';
  return (
    <svg width={13} height={13} viewBox="0 0 100 100" style={{ display: 'block', flexShrink: 0 }} aria-hidden>
      {edges.map(([a, b], i) => {
        const pa = stars[a];
        const pb = stars[b];
        if (!pa || !pb) return null;
        return (
          <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
        );
      })}
      {stars.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={dot} />
      ))}
    </svg>
  );
}

/** 顯示用簡稱：「牡羊座」→「牡羊」，避免英文字母 */
function zodiacShortZh(nameZh: string | undefined, fallback: string): string {
  const s = (nameZh ?? fallback).trim();
  if (!s) return '···';
  return s.endsWith('座') ? s.slice(0, -1) : s;
}

type SceneProps = {
  rotYDeg: number;
  ring: { ch: ChapterDef; i: number; complete: boolean }[];
};

function EarthGroup({ rotYDeg, ring }: SceneProps) {
  const tex = useMemo(() => buildProceduralEarthTexture(), []);
  const clouds = useMemo(() => buildCloudAlphaTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => () => clouds.dispose(), [clouds]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const rx = THREE.MathUtils.degToRad(15);
    const ry = THREE.MathUtils.degToRad(rotYDeg);
    groupRef.current.rotation.set(rx, ry, 0, 'XYZ');
  });

  const markerR = EARTH_RADIUS * 1.06;

  return (
    <group ref={groupRef}>
      <mesh scale={EARTH_RADIUS * 1.012} renderOrder={-2}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={0.055}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <mesh castShadow receiveShadow renderOrder={0}>
        <sphereGeometry args={[EARTH_RADIUS, 112, 112]} />
        <meshPhysicalMaterial
          map={tex}
          roughness={0.55}
          metalness={0.04}
          clearcoat={0.12}
          clearcoatRoughness={0.65}
        />
      </mesh>

      <mesh rotation={[0, THREE.MathUtils.degToRad(38), 0]} scale={EARTH_RADIUS * 1.006} renderOrder={1}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial map={clouds} transparent opacity={0.26} depthWrite={false} toneMapped={false} color="#ffffff" />
      </mesh>

      <mesh rotation={[Math.PI / 2 + 0.24, 0, 0]} renderOrder={-1}>
        <ringGeometry args={[EARTH_RADIUS * 1.22, EARTH_RADIUS * 1.248, 96]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.045} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {ring.map(({ ch, i, complete }) => {
        const theta = THREE.MathUtils.degToRad(i * (360 / ZOD_RING));
        const cx = markerR * Math.cos(theta);
        const cz = markerR * Math.sin(theta);
        const cy = markerR * Math.sin(THREE.MathUtils.degToRad(4)) * 0.048;
        const z = ch.levels[0]?.zodiac;
        const zh = z?.nameZh ?? ch.title;
        const label = zodiacShortZh(z?.nameZh, ch.title);

        return (
          <group key={ch.id} position={[cx, cy, cz]}>
            <mesh renderOrder={3}>
              <sphereGeometry args={[0.026, 10, 10]} />
              <meshBasicMaterial color={complete ? '#6ee7b7' : '#94a3b8'} toneMapped={false} />
            </mesh>
            {/*
              Billboard：標籤永遠面朝鏡頭；Html transform={false} 避免跟隨父層矩陣導致旋轉時鏡像／倒置。
            */}
            <Billboard follow>
              <Html
                transform={false}
                occlude={false}
                distanceFactor={3.15}
                zIndexRange={[100, 0]}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                center
              >
                <div
                  title={`${zh} — ${complete ? '已全數通關' : '尚未全數通關'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '2px 4px',
                    borderRadius: 6,
                    border: complete ? '1px solid rgba(52,211,153,0.45)' : '1px solid rgba(148,163,184,0.35)',
                    background: complete ? 'rgba(6,78,59,0.52)' : 'rgba(15,23,42,0.52)',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <MiniAsterismSvg chapter={ch} complete={complete} />
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '9px',
                      letterSpacing: '0.02em',
                      color: complete ? '#d1fae5' : '#e2e8f0',
                      lineHeight: 1.15,
                      fontFamily: 'Nunito, "Noto Sans TC", "PingFang TC", system-ui, sans-serif',
                      writingMode: 'horizontal-tb',
                    }}
                  >
                    {label}
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

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight castShadow position={[5.2, 1.9, 4.8]} intensity={1.55} color="#fff5e6" />
      <directionalLight position={[-4.8, -0.5, -5.6]} intensity={0.42} color="#9ec5ff" />
      <directionalLight position={[0.6, -2.4, -1.2]} intensity={0.18} color="#cfe8ff" />
    </>
  );
}

type GlobeGlProps = {
  sizePx: number;
  rotYDeg: number;
  ring: { ch: ChapterDef; i: number; complete: boolean }[];
};

function GlobeGl({ sizePx, rotYDeg, ring }: GlobeGlProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [0, 0.24, 3.95], fov: 38, near: 0.1, far: 25 }}
      style={{ width: sizePx, height: sizePx, display: 'block', borderRadius: 16, touchAction: 'none' }}
    >
      <TransparentBackdrop />
      <SceneLights />
      <Suspense fallback={null}>
        <EarthGroup rotYDeg={rotYDeg} ring={ring} />
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
    /* 靜默；僅退回 2D 佔位 */
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center text-center px-6"
          style={{ width: '100%', minHeight: 200, fontWeight: 800, fontSize: 14, color: '#57534e' }}
        >
          3D 地球暫無法載入，請重整頁面或更新瀏覽器。
        </div>
      );
    }
    return this.props.children;
  }
}

type Props = {
  chapters: ChapterDef[];
  completedLevels: number[];
};

export default function ConstellationGlobe({ chapters, completedLevels }: Props) {
  const [size, setSize] = useState(236);
  useEffect(() => {
    const w = () => setSize(Math.min(252, Math.max(204, Math.min(window.innerWidth - 48, 276))));
    w();
    window.addEventListener('resize', w);
    return () => window.removeEventListener('resize', w);
  }, []);

  const [rotY, setRotY] = useState(0);
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
  useEffect(() => {
    function move(e: PointerEvent) {
      if (!draggingRef.current) return;
      const dx = e.clientX - lastX.current;
      lastX.current = e.clientX;
      setRotY(r => r + dx * 0.45);
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
      onPointerDown(e);
    },
    [onPointerDown],
  );

  const ring = useMemo(() => {
    return chapters.slice(0, ZOD_RING).map((ch, i) => {
      const complete = isChapterComplete(ch, completedLevels);
      return { ch, i, complete };
    });
  }, [chapters, completedLevels]);

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="relative mx-auto cursor-grab active:cursor-grabbing"
        role="application"
        aria-label="可旋轉的三維地球；外圈十二格代表黃道十二星座，顏色顯示是否已全數通關"
        style={{ touchAction: 'none', width: size, height: size }}
        onPointerDown={onPointerDownCapture}
      >
        <GlobeErrorBoundary>
          <GlobeGl sizePx={size} rotYDeg={rotY} ring={ring} />
        </GlobeErrorBoundary>
      </div>

      <p className="text-center px-6 mt-3" style={{ fontWeight: 800, fontSize: '13px', color: '#44403c' }}>
        ← 拖曳旋轉立體地球 →
      </p>
      <div className="flex items-center gap-6 mt-2 mb-2" style={{ fontWeight: 800, fontSize: '12px', color: '#57534e' }}>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full shrink-0"
            style={{ background: 'linear-gradient(145deg,#6ee7b7,#22c55e)', border: '1px solid #a7f3d0' }}
          />
          已點亮
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full shrink-0"
            style={{ background: 'linear-gradient(145deg,#94a3b8,#475569)', border: '1px solid #94a3b8' }}
          />
          未完成
        </span>
      </div>
      <p className="text-center px-8 opacity-85" style={{ fontWeight: 700, fontSize: '11px', color: '#78716c', lineHeight: 1.45 }}>
        「已點亮」為該星座全通關 · 標籤為中文簡稱＋示意星線（文字恆為正向、隨視角對正）
      </p>
    </div>
  );
}
