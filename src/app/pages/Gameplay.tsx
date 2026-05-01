import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp } from '../context/AppContext';
import { getLevelMeta, themeBackground } from '../data/levels';

const PIECE_TYPE = 'PUZZLE_PIECE';

// ===================== SVG SCENE =====================
function GardenScene({ showDiff }: { showDiff: boolean }) {
  return (
    <svg viewBox="0 0 320 200" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
      {/* Sky */}
      <defs>
        <linearGradient id={`sky${showDiff}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="100%" stopColor="#c8e6f5" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#sky${showDiff})`} />

      {/* Ground */}
      <ellipse cx="160" cy="185" rx="170" ry="35" fill="#5a9e3a" />
      <rect x="0" y="165" width="320" height="35" fill="#5a9e3a" />

      {/* Sun */}
      <circle cx="260" cy="38" r="22" fill="#FFD700" />
      {Array.from({ length: showDiff ? 6 : 8 }).map((_, i) => {
        const angle = (i * (showDiff ? 60 : 45) * Math.PI) / 180;
        const x1 = 260 + Math.cos(angle) * 26;
        const y1 = 38 + Math.sin(angle) * 26;
        const x2 = 260 + Math.cos(angle) * 34;
        const y2 = 38 + Math.sin(angle) * 34;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />;
      })}

      {/* Clouds: 2 in original, 3 in diff version */}
      <g opacity="0.9">
        <ellipse cx="70" cy="40" rx="30" ry="16" fill="white" />
        <ellipse cx="55" cy="45" rx="18" ry="12" fill="white" />
        <ellipse cx="88" cy="46" rx="16" ry="10" fill="white" />
      </g>
      {!showDiff && (
        <g opacity="0.9">
          <ellipse cx="170" cy="28" rx="24" ry="13" fill="white" />
          <ellipse cx="156" cy="32" rx="15" ry="10" fill="white" />
          <ellipse cx="182" cy="33" rx="14" ry="9" fill="white" />
        </g>
      )}

      {/* Left tree */}
      <rect x="42" y="105" width="10" height="55" fill="#7a5230" rx="2" />
      <ellipse cx="47" cy="100" rx="22" ry="28" fill="#2d8c20" />
      <ellipse cx="47" cy="92" rx="16" ry="20" fill="#38a327" />
      {/* Apple on left tree - absent in diff */}
      {!showDiff && <circle cx="52" cy="102" r="5" fill="#e8323a" />}
      {!showDiff && <circle cx="40" cy="108" r="4" fill="#e8323a" />}

      {/* Right tree */}
      <rect x="255" y="110" width="10" height="50" fill="#7a5230" rx="2" />
      <ellipse cx="260" cy="105" rx="20" ry="25" fill="#2d8c20" />
      <ellipse cx="260" cy="98" rx="14" ry="18" fill="#38a327" />

      {/* House */}
      <rect x="120" y="120" width="80" height="55" fill="#e8d5b7" rx="3" />
      <polygon points="115,120 160,88 205,120" fill="#c0392b" />
      {/* Door */}
      <rect x="148" y="148" width="24" height="27" fill="#8b6914" rx="2" />
      <circle cx="170" cy="162" r="2" fill="#FFD700" />
      {/* Windows: round in original, square in diff */}
      {showDiff ? (
        <>
          <rect x="126" y="128" width="18" height="16" fill="#87ceeb" stroke="#aaa" strokeWidth="1" rx="2" />
          <rect x="196" y="128" width="18" height="16" fill="#87ceeb" stroke="#aaa" strokeWidth="1" rx="2" />
        </>
      ) : (
        <>
          <ellipse cx="135" cy="136" rx="9" ry="9" fill="#87ceeb" stroke="#aaa" strokeWidth="1" />
          <ellipse cx="205" cy="136" rx="9" ry="9" fill="#87ceeb" stroke="#aaa" strokeWidth="1" />
        </>
      )}

      {/* Flowers */}
      {[{x:88,y:160,c:'#ff6b9d'},{x:100,y:163,c:'#ffd43b'},{x:222,y:158,c:showDiff?'#4dabf7':'#ff6b9d'},{x:234,y:161,c:'#ffd43b'}].map((f,i)=>(
        <g key={i}>
          <circle cx={f.x} cy={f.y} r="5" fill={f.c} />
          <circle cx={f.x-4} cy={f.y-3} r="4" fill={f.c} opacity="0.7" />
          <circle cx={f.x+4} cy={f.y-3} r="4" fill={f.c} opacity="0.7" />
          <line x1={f.x} y1={f.y+4} x2={f.x} y2={f.y+12} stroke="#38a327" strokeWidth="1.5" />
        </g>
      ))}

      {/* Rabbit - present in original only */}
      {!showDiff && (
        <g transform="translate(180,155)">
          <ellipse cx="0" cy="8" rx="7" ry="8" fill="white" />
          <ellipse cx="-4" cy="-2" rx="2.5" ry="7" fill="white" />
          <ellipse cx="4" cy="-2" rx="2.5" ry="7" fill="white" />
          <circle cx="-1.5" cy="9" r="1" fill="pink" />
          <circle cx="1.5" cy="9" r="1" fill="pink" />
        </g>
      )}

      {/* Bird on tree branch - present in original only */}
      {!showDiff && (
        <g transform="translate(62,75)">
          <ellipse cx="0" cy="0" rx="6" ry="4" fill="#4dabf7" />
          <circle cx="-5" cy="-1" r="3" fill="#4dabf7" />
          <polygon points="-8,0 -12,1 -8,2" fill="#ffd43b" />
          <circle cx="-6" cy="-2" r="0.8" fill="black" />
        </g>
      )}
    </svg>
  );
}

// ===================== SPOT THE DIFFERENCE =====================
interface Difference {
  id: number;
  label: string;
  x: number;
  y: number;
}

const DIFFERENCES: Difference[] = [
  { id: 1, label: '太陽光芒數不同',   x: 81, y: 19 },
  { id: 2, label: '雲朵數量不同',      x: 53, y: 14 },
  { id: 3, label: '樹上沒有蘋果',      x: 15, y: 52 },
  { id: 4, label: '花朵顏色不同',      x: 69, y: 79 },
  { id: 5, label: '兔子和小鳥不見了', x: 56, y: 78 },
];

function SpotDiff({ onComplete }: { onComplete: () => void }) {
  const [found, setFound] = useState<number[]>([]);
  const [wrongClicks, setWrongClicks] = useState<{ x: number; y: number; id: number }[]>([]);
  const rightRef = useRef<HTMLDivElement>(null);

  function handleRightClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = rightRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const hit = DIFFERENCES.find(d => !found.includes(d.id) && Math.abs(d.x - x) < 7 && Math.abs(d.y - y) < 8);
    if (hit) {
      const next = [...found, hit.id];
      setFound(next);
      if (next.length === DIFFERENCES.length) {
        setTimeout(onComplete, 800);
      }
    } else {
      const id = Date.now();
      setWrongClicks(prev => [...prev, { x, y, id }]);
      setTimeout(() => setWrongClicks(prev => prev.filter(w => w.id !== id)), 1000);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Star progress */}
      <div className="flex justify-center gap-3 py-3">
        {DIFFERENCES.map((d, i) => (
          <motion.div
            key={d.id}
            className="text-2xl"
            animate={found.includes(d.id) ? { scale: [1.5, 1], rotate: [20, 0] } : {}}
          >
            {found.includes(d.id) ? '⭐' : '☆'}
          </motion.div>
        ))}
      </div>

      <div className="text-center text-white/70 mb-3" style={{ fontWeight: 700, fontSize: '13px' }}>
        找出 {found.length}/{DIFFERENCES.length} 個不同之處！
      </div>

      {/* Two scenes */}
      <div className="flex gap-4 flex-1 px-4 pb-4">
        {/* Left - original */}
        <div className="flex-1 rounded-2xl overflow-hidden border-3 border-white/30 shadow-2xl relative"
          style={{ border: '3px solid rgba(255,255,255,0.3)', minHeight: 0 }}>
          <GardenScene showDiff={false} />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg" style={{ fontSize: '11px', fontWeight: 700 }}>
            原圖
          </div>
        </div>

        {/* Right - different */}
        <div
          ref={rightRef}
          className="flex-1 rounded-2xl overflow-hidden border-3 shadow-2xl relative cursor-crosshair"
          style={{ border: '3px solid rgba(255,255,255,0.3)', minHeight: 0 }}
          onClick={handleRightClick}
        >
          <GardenScene showDiff={true} />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg" style={{ fontSize: '11px', fontWeight: 700 }}>
            找不同
          </div>

          {/* Found markers */}
          {found.map(id => {
            const d = DIFFERENCES.find(x => x.id === id)!;
            return (
              <motion.div
                key={id}
                className="absolute"
                style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%,-50%)' }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div className="w-10 h-10 rounded-full border-3 border-green-400 bg-green-400/20 flex items-center justify-center"
                  style={{ border: '3px solid #4ade80' }}>
                  <span style={{ color: '#4ade80', fontWeight: 900, fontSize: '16px' }}>✓</span>
                </div>
              </motion.div>
            );
          })}

          {/* Wrong click X marks */}
          {wrongClicks.map(w => (
            <motion.div
              key={w.id}
              className="absolute"
              style={{ left: `${w.x}%`, top: `${w.y}%`, transform: 'translate(-50%,-50%)' }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-red-400 text-xl font-black">✗</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== JIGSAW PUZZLE =====================
interface PieceData {
  id: number;
  emoji: string;
  bg: string;
  correctSlot: number;
}

const PIECES_DATA: PieceData[] = [
  { id: 0, emoji: '🌤️', bg: '#87ceeb', correctSlot: 0 },
  { id: 1, emoji: '☀️', bg: '#FFD700', correctSlot: 1 },
  { id: 2, emoji: '🌤️', bg: '#a0d8ef', correctSlot: 2 },
  { id: 3, emoji: '🌿', bg: '#7ec8a0', correctSlot: 3 },
  { id: 4, emoji: '🏠', bg: '#f0c080', correctSlot: 4 },
  { id: 5, emoji: '🌿', bg: '#8bc48a', correctSlot: 5 },
  { id: 6, emoji: '🌱', bg: '#5a9e3a', correctSlot: 6 },
  { id: 7, emoji: '🌻', bg: '#4caf50', correctSlot: 7 },
  { id: 8, emoji: '🌱', bg: '#45a049', correctSlot: 8 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function DraggablePiece({ piece, inTray }: { piece: PieceData; inTray: boolean }) {
  const [{ isDragging }, drag] = useDrag({
    type: PIECE_TYPE,
    item: { id: piece.id },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag as any}
      className="rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all"
      style={{
        background: piece.bg,
        opacity: isDragging ? 0.4 : 1,
        width: inTray ? '56px' : '100%',
        height: inTray ? '56px' : '100%',
        fontSize: inTray ? '28px' : '32px',
        border: '2px solid rgba(255,255,255,0.5)',
        boxShadow: isDragging ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {piece.emoji}
    </div>
  );
}

function DropSlot({
  slotIndex,
  placedPieceId,
  onDrop,
}: {
  slotIndex: number;
  placedPieceId: number | null;
  onDrop: (pieceId: number, slotIndex: number) => void;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: PIECE_TYPE,
    drop: (item: { id: number }) => onDrop(item.id, slotIndex),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  const piece = placedPieceId !== null ? PIECES_DATA.find(p => p.id === placedPieceId) : null;
  const isCorrect = piece ? piece.correctSlot === slotIndex : false;

  return (
    <div
      ref={drop as any}
      className="rounded-xl flex items-center justify-center transition-all relative"
      style={{
        background: isOver ? 'rgba(255,255,255,0.3)' : piece ? piece.bg : 'rgba(255,255,255,0.08)',
        border: isCorrect ? '2px solid #4ade80' : isOver ? '2px dashed rgba(255,255,255,0.8)' : '2px dashed rgba(255,255,255,0.25)',
        aspectRatio: '1',
      }}
    >
      {piece ? (
        <motion.div
          className="w-full h-full flex items-center justify-center"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          style={{ fontSize: '32px' }}
        >
          {piece.emoji}
        </motion.div>
      ) : (
        <span style={{ fontSize: '18px', opacity: 0.3 }}>{slotIndex + 1}</span>
      )}
      {isCorrect && (
        <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-green-400 flex items-center justify-center" style={{ fontSize: '9px' }}>✓</div>
      )}
    </div>
  );
}

function JigsawGame({ onComplete }: { onComplete: () => void }) {
  const [slots, setSlots] = useState<(number | null)[]>(Array(9).fill(null));
  const [tray, setTray] = useState<number[]>(() => shuffleArray(PIECES_DATA.map(p => p.id)));

  function handleDrop(pieceId: number, slotIndex: number) {
    setSlots(prev => {
      const next = [...prev];
      // Remove from other slot if already placed
      const existingSlot = next.indexOf(pieceId);
      if (existingSlot !== -1) next[existingSlot] = null;
      // Swap if slot already occupied
      const displaced = next[slotIndex];
      next[slotIndex] = pieceId;
      // Put displaced piece back in tray
      if (displaced !== null) {
        setTray(t => t.includes(displaced) ? t : [...t, displaced]);
      }
      // Remove from tray
      setTray(t => t.filter(id => id !== pieceId));

      // Check win
      const allCorrect = next.every((id, i) => id !== null && PIECES_DATA.find(p => p.id === id)?.correctSlot === i);
      if (allCorrect) setTimeout(onComplete, 600);
      return next;
    });
  }

  const correctCount = slots.filter((id, i) => id !== null && PIECES_DATA.find(p => p.id === id)?.correctSlot === i).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-dnd-root className="flex flex-col h-full px-4 pb-4">
        {/* Progress */}
        <div className="flex justify-center items-center gap-3 py-3">
          <div className="text-white/80" style={{ fontWeight: 700, fontSize: '13px' }}>
            已完成 {correctCount}/9 片
          </div>
          <div className="flex-1 max-w-48 h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ffd43b, #20c997)', width: `${(correctCount / 9) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Reference image */}
        <div className="flex justify-center mb-3">
          <div className="rounded-xl overflow-hidden border border-white/30 shadow-lg" style={{ width: 100 }}>
            <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-white/20">
              {PIECES_DATA.map(p => (
                <div key={p.id} className="rounded flex items-center justify-center" style={{ background: p.bg, aspectRatio: '1', fontSize: '14px' }}>
                  {p.emoji}
                </div>
              ))}
            </div>
            <div className="text-center text-white/60 py-1" style={{ fontSize: '9px', fontWeight: 700 }}>參考圖</div>
          </div>
        </div>

        {/* Main puzzle grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-2" style={{ width: 'min(280px, 60vw)', height: 'min(280px, 60vw)' }}>
            {Array(9).fill(null).map((_, i) => (
              <DropSlot key={i} slotIndex={i} placedPieceId={slots[i]} onDrop={handleDrop} />
            ))}
          </div>
        </div>

        {/* Tray */}
        <div className="mt-3">
          <div className="text-center text-white/50 mb-2" style={{ fontSize: '11px', fontWeight: 700 }}>拖曳拼圖塊到上方框格</div>
          <div className="flex flex-wrap gap-2 justify-center p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)' }}>
            {tray.map(id => {
              const piece = PIECES_DATA.find(p => p.id === id)!;
              return <DraggablePiece key={id} piece={piece} inTray={true} />;
            })}
            {tray.length === 0 && (
              <div className="text-white/30" style={{ fontWeight: 700, fontSize: '13px' }}>所有拼圖已放置！</div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

// ===================== MAIN GAMEPLAY =====================
export default function Gameplay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLastGameScore, setCompletedLevels, completedLevels, currentLevel, setCurrentLevel, totalStars, setTotalStars, distractorLevel, collectedLevelIds, setCollectedLevelIds } = useApp();

  const mode = searchParams.get('mode') ?? 'spot';
  const level = Number(searchParams.get('level') ?? 1);
  const levelMeta = getLevelMeta(level);

  const [showDistracted, setShowDistracted] = useState(false);
  const [showDistance, setShowDistance] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [showStory, setShowStory] = useState(true);

  // Simulate distraction events (mock)
  useEffect(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    if (paused) return;
    if (distractorLevel === 'off') return;

    const profile = (() => {
      switch (distractorLevel) {
        case 'low': return { distractedAt: 22000, distanceAt: 36000 };
        case 'medium': return { distractedAt: 15000, distanceAt: 30000 };
        case 'high': return { distractedAt: 11000, distanceAt: 24000 };
        case 'extreme': return { distractedAt: 8000, distanceAt: 18000 };
        default: return { distractedAt: 15000, distanceAt: 30000 };
      }
    })();

    const t1 = setTimeout(() => {
      setShowDistracted(true);
      const t = setTimeout(() => setShowDistracted(false), 3000);
      timersRef.current.push(t);
    }, profile.distractedAt);
    const t2 = setTimeout(() => {
      setShowDistance(true);
      const t = setTimeout(() => setShowDistance(false), 3500);
      timersRef.current.push(t);
    }, profile.distanceAt);
    timersRef.current.push(t1, t2);

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
    };
  }, [paused, distractorLevel]);

  function handleComplete() {
    setGameComplete(true);
    const score = Math.floor(Math.random() * 20) + 75;
    setLastGameScore(score);
    if (!completedLevels.includes(level)) {
      setCompletedLevels([...completedLevels, level]);
      setTotalStars(totalStars + 3);
      setCurrentLevel(Math.max(currentLevel, level + 1));
    }
    if (!collectedLevelIds.includes(level)) {
      setCollectedLevelIds([...collectedLevelIds, level]);
    }
    setTimeout(() => navigate(`/child/reward?level=${level}&mode=${mode}`), 800);
  }

  function handleExit() {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
    navigate('/child/lobby');
  }

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        fontFamily: 'Nunito, sans-serif',
        background: themeBackground(levelMeta.theme, mode as any),
      }}
    >
      {/* Story intro */}
      <AnimatePresence>
        {showStory && !paused && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(10px)', background: 'rgba(2,6,23,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              initial={{ scale: 0.92, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 18, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl">{levelMeta.collectible.emoji}</div>
                <div className="flex-1">
                  <div className="text-white" style={{ fontWeight: 900, fontSize: '18px' }}>
                    第 {levelMeta.id} 關 · {levelMeta.story.title}
                  </div>
                  <div className="text-white/75 mt-2" style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.6 }}>
                    {levelMeta.story.text}
                  </div>
                  <div className="text-white/75 mt-3" style={{ fontWeight: 800, fontSize: '13px' }}>
                    🎁 本關收集：{levelMeta.collectible.emoji} {levelMeta.collectible.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStory(false)}
                className="mt-6 w-full py-3 rounded-2xl text-white transition-all active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, #20c997, #4dabf7)', fontWeight: 900, fontSize: '16px' }}
              >
                開始遊玩
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="text-white/70" style={{ fontWeight: 700, fontSize: '13px' }}>
          {mode === 'spot' ? '🔍 找不同挑戰' : '🧩 拼圖挑戰'}
        </div>
        <div className="flex items-center gap-2 text-white" style={{ fontWeight: 700, fontSize: '13px' }}>
          ⭐ 第 {level} 關
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPaused(true); setShowExitConfirm(false); }}
            className="w-14 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.22)',
              fontSize: '22px',
              fontWeight: 900,
            }}
            title="暫停"
            aria-label="暫停"
          >
            ⏸
          </button>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 overflow-hidden" style={{ pointerEvents: paused ? 'none' : 'auto' }}>
        {mode === 'spot' ? (
          <SpotDiff onComplete={handleComplete} />
        ) : (
          <JigsawGame onComplete={handleComplete} />
        )}
      </div>

      {/* DnD helper: prevent iOS/Touch scroll from stealing drag */}
      <style>{`
        [data-dnd-root] {
          touch-action: none;
        }
      `}</style>

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(10px)', background: 'rgba(15,23,42,0.55)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl p-6 border border-white/20 shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="text-center">
                <div className="text-6xl mb-3">{showExitConfirm ? '🚪' : '⏸'}</div>
                <div className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>
                  {showExitConfirm ? '要退出關卡嗎？' : '已暫停'}
                </div>
                <div className="text-white/70 mt-2" style={{ fontWeight: 600, fontSize: '13px' }}>
                  {showExitConfirm ? '進度不會保留，會回到大廳地圖。' : '準備好再繼續。'}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {showExitConfirm ? (
                  <>
                    <button
                      onClick={handleExit}
                      className="w-full py-3 rounded-2xl text-white transition-all active:scale-[0.99]"
                      style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff922b)', fontWeight: 900, fontSize: '16px' }}
                    >
                      退出並回到地圖
                    </button>
                    <button
                      onClick={() => { setPaused(false); setShowExitConfirm(false); }}
                      className="w-full py-3 rounded-2xl text-white/80 transition-all hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', fontWeight: 800, fontSize: '15px' }}
                    >
                      繼續遊玩
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setPaused(false)}
                      className="w-full py-3 rounded-2xl text-white transition-all active:scale-[0.99]"
                      style={{ background: 'linear-gradient(135deg, #20c997, #4dabf7)', fontWeight: 900, fontSize: '16px' }}
                    >
                      繼續
                    </button>
                    <button
                      onClick={() => setShowExitConfirm(true)}
                      className="w-full py-3 rounded-2xl text-white/90 transition-all active:scale-[0.99]"
                      style={{ background: 'rgba(255,107,107,0.22)', border: '1px solid rgba(255,255,255,0.16)', fontWeight: 800, fontSize: '15px' }}
                    >
                      退出關卡
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distracted overlay */}
      <AnimatePresence>
        {showDistracted && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.0)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Vignette */}
            <div
              className="absolute inset-0"
              style={{ boxShadow: 'inset 0 0 120px 60px rgba(0,0,0,0.85)', pointerEvents: 'none' }}
            />
            {/* Blur overlay */}
            <div className="absolute inset-0" style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.2)' }} />

            <motion.div
              className="relative z-10 text-center p-6 rounded-3xl"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,0.2)' }}
              animate={{ scale: [0.9, 1.05, 1] }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-7xl mb-3"
                animate={{ x: [-5, 5, -5, 5, 0] }}
                transition={{ duration: 0.6, repeat: 3 }}
              >
                👆
              </motion.div>
              <div className="text-white" style={{ fontWeight: 900, fontSize: '20px' }}>請看回這裡喔！</div>
              <div className="text-white/70 mt-2" style={{ fontWeight: 600, fontSize: '14px' }}>精靈正在等你回來 ✨</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distance warning overlay */}
      <AnimatePresence>
        {showDistance && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(255,100,50,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center p-8 rounded-3xl shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <div className="text-8xl mb-4">🐼</div>
              <div className="text-white" style={{ fontWeight: 900, fontSize: '24px' }}>退後一點點喔！</div>
              <div className="text-white/80 mt-2" style={{ fontWeight: 700, fontSize: '16px' }}>
                👀 眼睛離螢幕太近啦
              </div>
              <div className="text-white/60 mt-1" style={{ fontWeight: 600, fontSize: '13px' }}>
                坐好後遊戲自動繼續
              </div>
              <motion.div
                className="mt-4 w-16 h-2 rounded-full mx-auto"
                style={{ background: '#ffd43b' }}
                animate={{ width: ['4rem', '0rem'] }}
                transition={{ duration: 3.5, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete flash */}
      <AnimatePresence>
        {gameComplete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(255,212,59,0.2)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="text-8xl"
              animate={{ scale: [0, 1.3, 1], rotate: [0, 20, -10, 0] }}
              transition={{ duration: 0.7 }}
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
