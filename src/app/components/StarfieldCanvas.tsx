import { useEffect, useRef } from 'react';

type StarfieldCanvasProps = {
  seed: number;
  opacity?: number;
  /** 0 = bias toward top (sky), 1 = uniform full rectangle */
  uniform?: number;
};

export default function StarfieldCanvas({ seed, opacity = 1, uniform = 0 }: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parent = parentRef.current;
    const canvas = canvasRef.current;
    if (!parent || !canvas) return;

    const mulberry32 = (a: number) => () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const draw = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rng = mulberry32((seed + 1) * 2654435761);
      const u = Math.min(1, Math.max(0, uniform));

      // density scales with screen size; keep it bounded for performance
      const count = Math.min(1800, Math.max(650, Math.floor((w * h) / 2200)));
      for (let i = 0; i < count; i++) {
        const x = rng() * w;
        const yMix = rng();
        const y = (1 - u) * Math.pow(yMix, 0.72) * h + u * yMix * h;
        const r = 0.35 + rng() * 1.9;
        const a = (0.05 + rng() * 0.55) * opacity;
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // occasional brighter sparkle
        if (rng() > 0.985) {
          const a2 = Math.min(1, (a + 0.35) * 1.15);
          ctx.fillStyle = `rgba(255,255,255,${a2.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, r + 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    draw();
    let ro: ResizeObserver | null = null;
    const onWinResize = () => draw();
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => draw());
      ro.observe(parent);
    } else {
      // older iOS / embedded webviews fallback
      window.addEventListener('resize', onWinResize);
    }
    window.addEventListener('orientationchange', draw);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('orientationchange', draw);
    };
  }, [seed, opacity, uniform]);

  return (
    <div ref={parentRef} className="absolute inset-0 pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
