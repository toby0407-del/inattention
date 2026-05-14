import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

type SceneKey =
  | 'ramsay'
  | 'cowboy'
  | 'fabio'
  | 'nixon'
  | 'school'
  | 'uber'
  | 'astrodad'
  | 'beemovie'
  | 'yikes'
  | 'vapormatt';

type PhotoHuntSpotDiffProps = {
  levelId: number;
  onComplete: () => void;
  /** round time (seconds) */
  seconds?: number;
  /** max wrong taps before fail */
  maxMistakes?: number;
};

const BASE_W = 996;
const BASE_H = 500;

type HotspotPos = { left: number; top: number };
type SceneDef = {
  key: SceneKey;
  src: string;
  hotspots: Record<`butt${1 | 2 | 3 | 4 | 5 | 6}${'L' | 'R'}`, HotspotPos>;
};

const SCENES: SceneDef[] = [
  {
    key: 'ramsay',
    src: '/photohunt/assets/scenes/ramsay.jpg',
    hotspots: {
      butt1L: { left: 125, top: 50 }, butt1R: { left: 625, top: 50 },
      butt2L: { left: 320, top: 282 }, butt2R: { left: 820, top: 282 },
      butt3L: { left: 220, top: 190 }, butt3R: { left: 720, top: 190 },
      butt4L: { left: 150, top: 390 }, butt4R: { left: 650, top: 390 },
      butt5L: { left: 0, top: 385 }, butt5R: { left: 500, top: 385 },
      butt6L: { left: 170, top: 320 }, butt6R: { left: 670, top: 320 },
    },
  },
  {
    key: 'cowboy',
    src: '/photohunt/assets/scenes/cowboy.jpg',
    hotspots: {
      butt1L: { left: 0, top: -15 }, butt1R: { left: 500, top: -15 },
      butt2L: { left: 40, top: 142 }, butt2R: { left: 540, top: 142 },
      butt3L: { left: 235, top: 175 }, butt3R: { left: 735, top: 175 },
      butt4L: { left: 120, top: 350 }, butt4R: { left: 620, top: 350 },
      butt5L: { left: 420, top: 385 }, butt5R: { left: 920, top: 385 },
      butt6L: { left: 430, top: -20 }, butt6R: { left: 930, top: -20 },
    },
  },
  {
    key: 'fabio',
    src: '/photohunt/assets/scenes/fabio.jpg',
    hotspots: {
      butt1L: { left: 0, top: -10 }, butt1R: { left: 500, top: -10 },
      butt2L: { left: 390, top: 300 }, butt2R: { left: 890, top: 300 },
      butt3L: { left: 370, top: 215 }, butt3R: { left: 870, top: 215 },
      butt4L: { left: 130, top: 210 }, butt4R: { left: 630, top: 210 },
      butt5L: { left: 10, top: 420 }, butt5R: { left: 510, top: 420 },
      butt6L: { left: 200, top: 210 }, butt6R: { left: 700, top: 210 },
    },
  },
  {
    key: 'nixon',
    src: '/photohunt/assets/scenes/nixon.jpg',
    hotspots: {
      butt1L: { left: 30, top: 110 }, butt1R: { left: 530, top: 110 },
      butt2L: { left: 275, top: 330 }, butt2R: { left: 775, top: 330 },
      butt3L: { left: 400, top: 15 }, butt3R: { left: 900, top: 15 },
      butt4L: { left: 185, top: 425 }, butt4R: { left: 685, top: 425 },
      butt5L: { left: 95, top: 85 }, butt5R: { left: 595, top: 85 },
      butt6L: { left: 285, top: 85 }, butt6R: { left: 785, top: 85 },
    },
  },
  {
    key: 'school',
    src: '/photohunt/assets/scenes/school.jpg',
    hotspots: {
      butt1L: { left: 50, top: 110 }, butt1R: { left: 550, top: 110 },
      butt2L: { left: 245, top: 165 }, butt2R: { left: 745, top: 165 },
      butt3L: { left: 320, top: 100 }, butt3R: { left: 820, top: 100 },
      butt4L: { left: 50, top: 200 }, butt4R: { left: 550, top: 200 },
      butt5L: { left: 260, top: 75 }, butt5R: { left: 760, top: 75 },
      butt6L: { left: 180, top: 35 }, butt6R: { left: 680, top: 35 },
    },
  },
  {
    key: 'uber',
    src: '/photohunt/assets/scenes/uber.jpg',
    hotspots: {
      butt1L: { left: 75, top: 130 }, butt1R: { left: 575, top: 130 },
      butt2L: { left: 205, top: 330 }, butt2R: { left: 705, top: 330 },
      butt3L: { left: 220, top: 215 }, butt3R: { left: 720, top: 215 },
      butt4L: { left: 20, top: 250 }, butt4R: { left: 520, top: 250 },
      butt5L: { left: 105, top: 365 }, butt5R: { left: 605, top: 365 },
      butt6L: { left: 240, top: 140 }, butt6R: { left: 740, top: 140 },
    },
  },
  {
    key: 'astrodad',
    src: '/photohunt/assets/scenes/astrodad.jpg',
    hotspots: {
      butt1L: { left: 175, top: 40 }, butt1R: { left: 675, top: 40 },
      butt2L: { left: 315, top: 400 }, butt2R: { left: 815, top: 400 },
      butt3L: { left: 290, top: 170 }, butt3R: { left: 790, top: 170 },
      butt4L: { left: 180, top: 330 }, butt4R: { left: 680, top: 330 },
      butt5L: { left: 0, top: 100 }, butt5R: { left: 500, top: 100 },
      butt6L: { left: 430, top: 255 }, butt6R: { left: 930, top: 255 },
    },
  },
  {
    key: 'beemovie',
    src: '/photohunt/assets/scenes/beemovie.jpg',
    hotspots: {
      butt1L: { left: 305, top: 100 }, butt1R: { left: 805, top: 100 },
      butt2L: { left: 325, top: 15 }, butt2R: { left: 825, top: 15 },
      butt3L: { left: 290, top: 170 }, butt3R: { left: 790, top: 170 },
      butt4L: { left: 210, top: 330 }, butt4R: { left: 720, top: 330 },
      butt5L: { left: 185, top: 140 }, butt5R: { left: 685, top: 140 },
      butt6L: { left: 400, top: 160 }, butt6R: { left: 900, top: 160 },
    },
  },
  {
    key: 'yikes',
    src: '/photohunt/assets/scenes/yikes.jpg',
    hotspots: {
      butt1L: { left: 175, top: 200 }, butt1R: { left: 675, top: 200 },
      butt2L: { left: 255, top: 370 }, butt2R: { left: 755, top: 370 },
      butt3L: { left: 290, top: 200 }, butt3R: { left: 790, top: 200 },
      butt4L: { left: 350, top: -10 }, butt4R: { left: 850, top: -10 },
      butt5L: { left: 100, top: 190 }, butt5R: { left: 600, top: 190 },
      butt6L: { left: 395, top: 165 }, butt6R: { left: 895, top: 165 },
    },
  },
  {
    key: 'vapormatt',
    src: '/photohunt/assets/scenes/vapormatt.jpg',
    hotspots: {
      butt1L: { left: 110, top: 100 }, butt1R: { left: 610, top: 100 },
      butt2L: { left: 375, top: 370 }, butt2R: { left: 875, top: 370 },
      butt3L: { left: 330, top: 200 }, butt3R: { left: 830, top: 200 },
      butt4L: { left: 250, top: 30 }, butt4R: { left: 750, top: 30 },
      butt5L: { left: 0, top: 170 }, butt5R: { left: 500, top: 170 },
      butt6L: { left: 420, top: 210 }, butt6R: { left: 920, top: 210 },
    },
  },
];

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function pickSceneIndex(levelId: number, seed: number, randomEnabled: boolean, len: number) {
  if (len <= 0) return 0;
  if (!randomEnabled) return levelId % len;
  const rnd = mulberry32(seed + levelId * 101);
  return Math.floor(rnd() * len) % len;
}

export default function PhotoHuntSpotDiff({
  levelId,
  onComplete,
  seconds = 40,
  maxMistakes = 6,
}: PhotoHuntSpotDiffProps) {
  const { spotSceneRandomEnabled, spotSceneRandomSeed } = useApp();
  const scene = useMemo(() => {
    const idx = pickSceneIndex(levelId, spotSceneRandomSeed, spotSceneRandomEnabled, SCENES.length);
    return SCENES[idx] ?? SCENES[0]!;
  }, [levelId, spotSceneRandomEnabled, spotSceneRandomSeed]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [found, setFound] = useState(() => new Set<number>());
  const [secLeft, setSecLeft] = useState(seconds);
  const [ended, setEnded] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  // 一次性完成鎖：避免 useEffect cleanup 把 onComplete 的 timeout 取消掉
  const completeFiredRef = useRef(false);

  // scale to fit container width (keep hotspots in original px-space)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width ?? BASE_W;
      setScale(Math.max(0.2, Math.min(1, w / BASE_W)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // reset per level/scene
  useEffect(() => {
    setFound(new Set());
    setSecLeft(seconds);
    setEnded(false);
    setMistakes(0);
    completeFiredRef.current = false;
  }, [levelId, seconds, maxMistakes]);

  // timer
  useEffect(() => {
    if (ended) return;
    const t = window.setInterval(() => {
      setSecLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(t);
          setEnded(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [ended]);

  // win condition：完成過就不再重排，避免 cleanup 取消 timeout
  useEffect(() => {
    if (completeFiredRef.current) return;
    if (found.size >= 6) {
      completeFiredRef.current = true;
      setEnded(true);
      // 不設 cleanup 的 clearTimeout，否則下一輪 effect 會把它取消掉
      window.setTimeout(() => onComplete(), 450);
    }
  }, [found, onComplete]);

  function markFound(n: number) {
    setFound(prev => {
      if (prev.has(n)) return prev;
      const next = new Set(prev);
      next.add(n);
      return next;
    });
  }

  function handleHotspotClick(id: string) {
    // butt{n}{L|R}
    const m = id.match(/^butt(\d)(L|R)$/);
    if (!m) return;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > 6) return;
    markFound(n);
  }

  function markMistake() {
    if (ended) return;
    setMistakes(prev => {
      const next = prev + 1;
      if (next >= maxMistakes) {
        setEnded(true);
      }
      return next;
    });
  }

  const circles = Array.from({ length: 6 }).map((_, i) => i + 1);

  return (
    <div className="h-full w-full flex flex-col items-center justify-start px-4 py-3 overflow-y-auto overscroll-contain">
      <div className="w-full max-w-3xl flex items-center justify-between gap-3 mb-2">
        <div className="text-white/85" style={{ fontWeight: 900, fontSize: 14 }}>
          找不同：{found.size}/6
        </div>
        <div className="flex items-center gap-2">
          {circles.map(n => (
            <img
              key={n}
              src={found.has(n) ? '/photohunt/assets/greyCircleGreenCheck.png' : '/photohunt/assets/greyCircle.png'}
              alt={found.has(n) ? `已找到 ${n}` : `未找到 ${n}`}
              style={{ width: 22, height: 22, opacity: found.has(n) ? 1 : 0.6 }}
            />
          ))}
        </div>
        <div className="text-white/85 tabular-nums" style={{ fontWeight: 900, fontSize: 14 }}>
          ⏱ {secLeft}s
        </div>
        <div className="text-white/85 tabular-nums" style={{ fontWeight: 900, fontSize: 14 }}>
          ❌ {mistakes}/{maxMistakes}
        </div>
      </div>

      <div
        ref={rootRef}
        className="w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.25)', border: '2px solid rgba(255,255,255,0.16)' }}
      >
        <div
          style={{
            width: BASE_W,
            height: BASE_H,
            position: 'relative',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          onClick={e => {
            if (ended) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest('button')) return;
            markMistake();
          }}
        >
          <img
            src={scene.src}
            alt="找不同圖片"
            style={{ width: BASE_W, height: BASE_H, display: 'block' }}
            draggable={false}
          />

          {/* 12 hotspots, positioned by scene CSS */}
          {Array.from({ length: 6 }).map((_, i) => {
            const n = i + 1;
            const ids = [`butt${n}L`, `butt${n}R`];
            return ids.map(hid => {
              const isFound = found.has(n);
              const showMiss = ended && found.size < 6 && !isFound;
              const pos = scene.hotspots[hid as keyof SceneDef['hotspots']];
              return (
                <button
                  key={hid}
                  id={hid}
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (ended) return;
                    const m = hid.match(/^butt(\d)(L|R)$/);
                    const n = m ? Number(m[1]) : NaN;
                    if (Number.isFinite(n) && found.has(n)) {
                      markMistake();
                      return;
                    }
                    handleHotspotClick(hid);
                  }}
                  aria-label={`差異 ${n}`}
                  style={{
                    height: 80,
                    width: 80,
                    opacity: isFound || showMiss ? 1 : 0,
                    position: 'absolute',
                    left: pos?.left ?? 0,
                    top: pos?.top ?? 0,
                    zIndex: 10,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: ended ? 'default' : 'pointer',
                  }}
                >
                  {isFound ? (
                    <img
                      src="/photohunt/assets/greencircle.png"
                      alt=""
                      style={{ width: '100%', height: '100%' }}
                      draggable={false}
                    />
                  ) : showMiss ? (
                    <img
                      src="/photohunt/assets/redcircle.png"
                      alt=""
                      style={{ width: '100%', height: '100%' }}
                      draggable={false}
                    />
                  ) : null}
                </button>
              );
            });
          })}
        </div>
      </div>

      {ended && found.size < 6 && (
        <div className="w-full max-w-3xl mt-3 flex items-center justify-between gap-3">
          <div className="text-white/70" style={{ fontWeight: 800, fontSize: 13 }}>
            {secLeft <= 0
              ? '時間到囉！紅圈是你沒找到的差異'
              : `超過試錯上限（${maxMistakes} 次）囉！紅圈是你沒找到的差異`}
          </div>
          <button
            type="button"
            onClick={() => {
              setFound(new Set());
              setSecLeft(seconds);
              setEnded(false);
              setMistakes(0);
              completeFiredRef.current = false;
            }}
            className="px-5 py-2.5 rounded-2xl text-white shadow-lg active:scale-[0.99] transition-transform"
            style={{ background: 'linear-gradient(135deg, #6366f1, #2563eb)', fontWeight: 900, fontSize: 14 }}
          >
            再玩一次
          </button>
        </div>
      )}
    </div>
  );
}

