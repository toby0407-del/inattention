import type { ChapterDef } from '../data/chapters';
import { isChapterComplete } from '../data/levels';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ZOD_RING = 12;
const IDLE_DEG_PER_FRAME = 0.12;

type Props = {
  chapters: ChapterDef[];
  completedLevels: number[];
};

export default function ConstellationGlobe({ chapters, completedLevels }: Props) {
  const [size, setSize] = useState(260);
  useEffect(() => {
    const w = () => setSize(Math.min(280, Math.max(220, window.innerWidth - 48)));
    w();
    window.addEventListener('resize', w);
    return () => window.removeEventListener('resize', w);
  }, []);
  const radius = size * 0.46;

  const [rotY, setRotY] = useState(0);
  const draggingRef = useRef(false);
  const idleRef = useRef(true);

  /** 自動慢轉（未拖曳時） */
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

  const onPointerDownCapture = useCallback((e: React.PointerEvent) => {
    lastX.current = e.clientX;
    onPointerDown(e);
  }, [onPointerDown]);

  const ring = useMemo(() => {
    return chapters.slice(0, ZOD_RING).map((ch, i) => {
      const complete = isChapterComplete(ch, completedLevels);
      return { ch, i, complete };
    });
  }, [chapters, completedLevels]);

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="relative mx-auto"
        style={{
          width: size,
          height: size,
          perspective: 960,
          perspectiveOrigin: '50% 45%',
          touchAction: 'none',
        }}
      >
        <div
          role="application"
          aria-label="可旋轉的地球；外圈十二格代表黃道十二星座，顏色顯示是否已全數通關"
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ transformStyle: 'preserve-3d' }}
          onPointerDown={onPointerDownCapture}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full overflow-hidden"
            style={{
              width: size * 0.92,
              height: size * 0.92,
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotY}deg) rotateX(12deg)`,
              background: `
                radial-gradient(120% 100% at 28% 24%, rgba(220,243,252,0.35) 0%, transparent 42%),
                radial-gradient(90% 80% at 62% 68%, rgba(34,197,94,0.55) 0%, transparent 45%),
                radial-gradient(70% 70% at 40% 48%, rgba(22,163,74,0.45) 0%, transparent 50%),
                radial-gradient(circle at 35% 35%, #5eead4 0%, #0f766e 18%, #1d4ed8 42%, #1e3a8a 68%, #0f172a 100%)
              `,
              boxShadow: `
                inset -18px -12px 36px rgba(0,0,0,0.55),
                inset 10px 8px 28px rgba(255,255,255,0.15),
                0 0 32px rgba(56,189,248,0.25)
              `,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            style={{
              width: 0,
              height: 0,
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotY}deg) rotateX(12deg)`,
            }}
          >
            {ring.map(({ ch, i, complete }) => (
              <div
                key={ch.id}
                className="absolute flex items-center justify-center rounded-full"
                style={{
                  width: 38,
                  height: 38,
                  left: -19,
                  top: -19,
                  transform: `rotateY(${i * (360 / ZOD_RING)}deg) translateZ(${radius}px)`,
                  background: complete
                    ? 'linear-gradient(145deg, #6ee7b7, #22c55e)'
                    : 'linear-gradient(145deg, #94a3b8, #475569)',
                  border: complete ? '2px solid rgba(167,243,208,0.95)' : '2px solid rgba(148,163,184,0.75)',
                  boxShadow: complete
                    ? '0 0 14px rgba(52,211,153,0.65), inset 0 1px 0 rgba(255,255,255,0.45)'
                    : '0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
                title={`${ch.levels[0]?.zodiac?.nameZh ?? ch.title} — ${complete ? '此星座主星皆已通關' : '尚未全數通關'}`}
              >
                <span
                  className="leading-none"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 900,
                    color: complete ? '#064e3b' : '#e2e8f0',
                    textShadow: complete ? '0 1px 0 rgba(255,255,255,0.4)' : '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {ch.levels[0]?.zodiac?.glyph ?? ch.mapEmoji}
                </span>
              </div>
            ))}
          </div>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: size + 44,
              height: size + 44,
              transform: `rotateY(${rotY * 0.85}deg) rotateX(68deg) translateZ(${-radius * 0.35}px)`,
              transformStyle: 'preserve-3d',
              opacity: 0.22,
              background: 'conic-gradient(from 0deg, rgba(251,191,36,0.5), transparent 40%, rgba(251,191,36,0.35))',
              border: '1px solid rgba(253,224,71,0.25)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <p className="text-center px-6 mt-3" style={{ fontWeight: 800, fontSize: '13px', color: '#44403c' }}>
        ← 手指或滑鼠左右拖曳旋轉地球 →
      </p>
      <div className="flex items-center gap-6 mt-2 mb-2" style={{ fontWeight: 800, fontSize: '12px', color: '#57534e' }}>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full shrink-0" style={{ background: 'linear-gradient(145deg,#6ee7b7,#22c55e)', border: '1px solid #a7f3d0' }} />
          已點亮
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded-full shrink-0" style={{ background: 'linear-gradient(145deg,#94a3b8,#475569)', border: '1px solid #94a3b8' }} />
          未完成
        </span>
      </div>
      <p className="text-center px-8 opacity-85" style={{ fontWeight: 700, fontSize: '11px', color: '#78716c', lineHeight: 1.45 }}>
        「已點亮」代表該星座全部主星關卡均已通關。
      </p>
    </div>
  );
}
