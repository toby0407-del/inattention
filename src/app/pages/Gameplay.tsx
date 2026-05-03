import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useApp } from '../context/AppContext';
import { getLevelMeta, themeBackground } from '../data/levels';
import type { LevelMode, ZodiacInfo } from '../data/levels';

const PIECE_TYPE = 'PUZZLE_PIECE';
const ORDER_CARD_TYPE = 'ORDER_CARD';
const MEMORY_ITEM_TYPE = 'MEMORY_ITEM';

function ZodiacPortraitCaption({
  zodiac,
  compact,
}: {
  zodiac?: ZodiacInfo;
  compact?: boolean;
}) {
  if (!zodiac) return null;
  return (
    <div
      className="absolute left-0 right-0 top-0 z-10 rounded-t-2xl overflow-hidden px-1.5 py-1 sm:py-1.5"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 70%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      <div className="text-white text-center leading-tight">
        <div style={{ fontWeight: 900, fontSize: compact ? '8px' : '11px' }}>
          {zodiac.glyph} {zodiac.nameZh} <span className="text-white/65">({zodiac.latin})</span>
        </div>
        {compact ? (
          <div className="text-white/78 mt-0.5" style={{ fontWeight: 600, fontSize: '7px', lineHeight: 1.3 }}>
            {zodiac.meaning.length > 32 ? `${zodiac.meaning.slice(0, 32)}…` : zodiac.meaning}
          </div>
        ) : (
          <div className="text-white/88" style={{ fontWeight: 600, fontSize: '10px', lineHeight: 1.35, marginTop: 2 }}>
            {zodiac.meaning}
          </div>
        )}
      </div>
    </div>
  );
}

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

function SpotDiff({ onComplete, zodiac }: { onComplete: () => void; zodiac?: ZodiacInfo }) {
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
          <ZodiacPortraitCaption zodiac={zodiac} compact />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg z-20" style={{ fontSize: '11px', fontWeight: 700 }}>
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
          <ZodiacPortraitCaption zodiac={zodiac} compact />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded-lg z-20" style={{ fontSize: '11px', fontWeight: 700 }}>
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

// 9 片使用不同 emoji，避免「圖示看起來一樣其實放錯片」導致怎麼擺都過不了檢查
const PIECES_DATA: PieceData[] = [
  { id: 0, emoji: '🌤️', bg: '#87ceeb', correctSlot: 0 },
  { id: 1, emoji: '☀️', bg: '#FFD700', correctSlot: 1 },
  { id: 2, emoji: '⛅', bg: '#a0d8ef', correctSlot: 2 },
  { id: 3, emoji: '🌿', bg: '#7ec8a0', correctSlot: 3 },
  { id: 4, emoji: '🏠', bg: '#f0c080', correctSlot: 4 },
  { id: 5, emoji: '🍃', bg: '#8bc48a', correctSlot: 5 },
  { id: 6, emoji: '🌱', bg: '#5a9e3a', correctSlot: 6 },
  { id: 7, emoji: '🌻', bg: '#4caf50', correctSlot: 7 },
  { id: 8, emoji: '🌳', bg: '#45a049', correctSlot: 8 },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** react-dnd 有時會把 item.id 當成字串，與數字 id 比對會失敗，導致檢查永遠不過 */
function normalizePieceId(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
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
  highlightWrong,
}: {
  slotIndex: number;
  placedPieceId: number | null;
  onDrop: (pieceId: number, slotIndex: number) => void;
  highlightWrong?: boolean;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: PIECE_TYPE,
    drop: (item: { id: number }) => onDrop(item.id, slotIndex),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  const pid = normalizePieceId(placedPieceId);
  const piece = pid !== null ? PIECES_DATA.find(p => p.id === pid) : null;

  return (
    <div
      ref={drop as any}
      className="rounded-xl flex items-center justify-center transition-all relative overflow-hidden"
      style={{
        background: isOver ? 'rgba(255,255,255,0.3)' : piece ? piece.bg : 'rgba(255,255,255,0.08)',
        border: highlightWrong
          ? '2px solid #ff6b6b'
          : isOver
          ? '2px dashed rgba(255,255,255,0.85)'
          : '2px dashed rgba(255,255,255,0.28)',
        aspectRatio: '1',
      }}
    >
      {piece ? (
        <motion.div
          className="w-full h-full flex items-center justify-center"
          initial={{ scale: 0.92 }}
          animate={{ scale: 1 }}
        >
          <DraggablePiece piece={piece} inTray={false} />
        </motion.div>
      ) : (
        <span style={{ fontSize: '18px', opacity: 0.3 }}>{slotIndex + 1}</span>
      )}
    </div>
  );
}

function PuzzleTrayStrip({
  onReturnPiece,
  children,
}: {
  onReturnPiece: (pieceId: number) => void;
  children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: PIECE_TYPE,
    drop: (item: { id: number }) => onReturnPiece(item.id),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as any}
      className="flex flex-wrap gap-2 justify-center p-3 rounded-2xl min-h-[88px]"
      style={{
        background: isOver ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
        boxShadow: isOver ? 'inset 0 0 0 2px rgba(255,255,255,0.3)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function JigsawGame({ onComplete, zodiac }: { onComplete: () => void; zodiac?: ZodiacInfo }) {
  const [slots, setSlots] = useState<(number | null)[]>(Array(9).fill(null));
  const [tray, setTray] = useState<number[]>(() => shuffleArray(PIECES_DATA.map(p => p.id)));
  const [slotWrong, setSlotWrong] = useState<boolean[]>(() => Array(9).fill(false));
  const [checkHint, setCheckHint] = useState<string | null>(null);

  function handleDrop(rawPieceId: number, slotIndex: number) {
    const pieceId = normalizePieceId(rawPieceId);
    if (pieceId === null || !PIECES_DATA.some(p => p.id === pieceId)) return;

    setSlotWrong(Array(9).fill(false));
    setCheckHint(null);
    setSlots(prev => {
      const next = [...prev];
      const existingSlot = next.indexOf(pieceId);
      if (existingSlot !== -1) next[existingSlot] = null;
      const displaced = normalizePieceId(next[slotIndex]);
      next[slotIndex] = pieceId;
      if (displaced !== null) {
        setTray(t => (t.includes(displaced) ? t : [...t, displaced]));
      }
      setTray(t => t.filter(id => id !== pieceId));
      return next;
    });
  }

  function returnPieceToTray(rawPieceId: number) {
    const pieceId = normalizePieceId(rawPieceId);
    if (pieceId === null) return;

    setSlotWrong(Array(9).fill(false));
    setCheckHint(null);
    setSlots(prev => {
      const next = [...prev];
      const idx = next.indexOf(pieceId);
      if (idx !== -1) next[idx] = null;
      return next;
    });
    setTray(t => (t.includes(pieceId) ? t : [...t, pieceId]));
  }

  function handleCheck() {
    setSlotWrong(Array(9).fill(false));
    setCheckHint(null);

    const normalized = slots.map(s => normalizePieceId(s));
    if (!normalized.every(id => id !== null)) {
      setCheckHint('請先把 9 片都放進格子裡，排好後再按「檢查」。');
      return;
    }

    // 以「與參考圖同一格是否同一片」判斷：第 i 格必須是 PIECES_DATA[i]（與 id / 外觀一致）
    const wrong = normalized.map((id, i) => {
      if (id === null) return true;
      const meta = PIECES_DATA.find(p => p.id === id);
      if (!meta) return true;
      return meta.correctSlot !== i;
    });

    if (wrong.some(Boolean)) {
      setSlotWrong(wrong);
      setCheckHint('還有些拼圖不在對的位置。可對照小參考圖「由左到右、由上而下」第幾格應是什麼圖示，再拖曳調整。');
      return;
    }
    setTimeout(onComplete, 450);
  }

  const placedCount = slots.filter(id => id !== null).length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-dnd-root className="flex flex-col h-full px-4 pb-4">
        {/* Progress */}
        <div className="flex justify-center items-center gap-3 py-3">
          <div className="text-white/80" style={{ fontWeight: 700, fontSize: '13px' }}>
            已放入 {placedCount}/9 片（可隨意拖曳調整）
          </div>
          <div className="flex-1 max-w-48 h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #ffd43b, #20c997)', width: `${(placedCount / 9) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Reference image */}
        <div className="flex justify-center mb-3">
          <div className="relative rounded-xl overflow-hidden border border-white/30 shadow-lg" style={{ width: 100 }}>
            <ZodiacPortraitCaption zodiac={zodiac} compact />
            <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-white/20 mt-8">
              {PIECES_DATA.map(p => (
                <div key={p.id} className="rounded flex items-center justify-center" style={{ background: p.bg, aspectRatio: '1', fontSize: '14px' }}>
                  {p.emoji}
                </div>
              ))}
            </div>
            <div className="text-center text-white/70 py-1 px-1" style={{ fontSize: '9px', fontWeight: 700, lineHeight: 1.3 }}>
              參考圖{zodiac ? ` · ${zodiac.nameZh}` : ''}
            </div>
            {zodiac && (
              <div className="text-center text-white/55 px-1 pb-1" style={{ fontSize: '8px', fontWeight: 600, lineHeight: 1.35 }}>
                {zodiac.meaning}
              </div>
            )}
          </div>
        </div>

        {/* Main puzzle grid */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {zodiac && (
            <div className="w-full max-w-[min(280px,60vw)] mb-3 px-1">
              <div
                className="text-center px-3 py-2 rounded-2xl"
                style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(255,255,255,0.14)' }}
              >
                <div className="text-white" style={{ fontWeight: 900, fontSize: '12px', lineHeight: 1.3 }}>
                  {zodiac.glyph} {zodiac.nameZh} ({zodiac.latin})
                </div>
                <div className="text-white/80 mt-1" style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.45 }}>
                  {zodiac.meaning}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2" style={{ width: 'min(280px, 60vw)', height: 'min(280px, 60vw)' }}>
            {Array(9).fill(null).map((_, i) => (
              <DropSlot
                key={i}
                slotIndex={i}
                placedPieceId={slots[i]}
                onDrop={handleDrop}
                highlightWrong={slotWrong[i]}
              />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {checkHint && (
            <motion.div
              className="mx-auto mb-2 rounded-2xl px-4 py-2 max-w-md text-center"
              style={{ background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,255,255,0.18)' }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-white/95" style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.5 }}>
                {checkHint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={handleCheck}
            className="px-8 py-3 rounded-2xl text-white shadow-lg active:scale-[0.99] transition-transform"
            style={{ background: 'linear-gradient(135deg, #20c997, #4dabf7)', fontWeight: 900, fontSize: '15px' }}
          >
            檢查
          </button>
        </div>

        {/* Tray */}
        <div className="mt-1">
          <div className="text-center text-white/50 mb-2" style={{ fontSize: '11px', fontWeight: 700 }}>
            拖曳拼圖塊到上方框格 · 也可拖回下方區域取下
          </div>
          <PuzzleTrayStrip onReturnPiece={returnPieceToTray}>
            {tray.map(id => {
              const piece = PIECES_DATA.find(p => p.id === id)!;
              return <DraggablePiece key={id} piece={piece} inTray={true} />;
            })}
            {tray.length === 0 && (
              <div className="text-white/30 py-2" style={{ fontWeight: 700, fontSize: '13px' }}>
                拼圖都在格子上 — 需要調整可拖回這裡
              </div>
            )}
          </PuzzleTrayStrip>
        </div>
      </div>
    </DndProvider>
  );
}

// ===================== ORDER SORT =====================
interface OrderCardData {
  id: number;
  emoji: string;
  order: number;
  caption: string;
}

const ORDER_CARDS: OrderCardData[] = [
  { id: 0, emoji: '🌅', order: 0, caption: '晨光' },
  { id: 1, emoji: '☀️', order: 1, caption: '正午' },
  { id: 2, emoji: '🌇', order: 2, caption: '黃昏' },
  { id: 3, emoji: '🌙', order: 3, caption: '夜晚' },
];

function OrderDraggable({ card }: { card: OrderCardData }) {
  const [{ isDragging }, drag] = useDrag({
    type: ORDER_CARD_TYPE,
    item: { id: card.id },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag as any}
      className="rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
        opacity: isDragging ? 0.45 : 1,
        width: 64,
        minHeight: 72,
        fontSize: 30,
        border: '2px solid rgba(255,255,255,0.45)',
        boxShadow: isDragging ? 'none' : '0 4px 14px rgba(0,0,0,0.25)',
      }}
    >
      <span>{card.emoji}</span>
      <span className="text-white/65" style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>
        {card.caption}
      </span>
    </div>
  );
}

function OrderDropSlot({
  slotIndex,
  placedId,
  onDrop,
  highlightWrong,
}: {
  slotIndex: number;
  placedId: number | null;
  onDrop: (cardId: number, slotIndex: number) => void;
  highlightWrong: boolean;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: ORDER_CARD_TYPE,
    drop: (item: { id: number }) => onDrop(item.id, slotIndex),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  const card = placedId !== null ? ORDER_CARDS.find(c => c.id === placedId) : null;

  return (
    <div
      ref={drop as any}
      className="rounded-xl flex flex-col items-center justify-center transition-all relative px-1 py-2"
      style={{
        border: highlightWrong
          ? '3px solid #ff6b6b'
          : isOver
          ? '2px dashed rgba(255,255,255,0.95)'
          : '2px dashed rgba(255,255,255,0.28)',
        background: isOver ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
        minWidth: 70,
        minHeight: 86,
      }}
    >
      {card ? (
        <OrderDraggable card={card} />
      ) : (
        <>
          <span className="text-white/35" style={{ fontSize: 11, fontWeight: 900 }}>
            {slotIndex + 1}
          </span>
          <span className="text-white/25 mt-1" style={{ fontSize: 9, fontWeight: 700 }}>
            順位
          </span>
        </>
      )}
    </div>
  );
}

function OrderTrayStrip({
  onReturnCard,
  children,
}: {
  onReturnCard: (cardId: number) => void;
  children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: ORDER_CARD_TYPE,
    drop: (item: { id: number }) => onReturnCard(item.id),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as any}
      className="flex flex-wrap gap-2 justify-center p-3 rounded-2xl mb-2 min-h-[96px]"
      style={{
        background: isOver ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
        boxShadow: isOver ? 'inset 0 0 0 2px rgba(255,255,255,0.3)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function OrderSortGame({ onComplete, zodiac }: { onComplete: () => void; zodiac?: ZodiacInfo }) {
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(ORDER_CARDS.length).fill(null));
  const [tray, setTray] = useState<number[]>(() => shuffleArray(ORDER_CARDS.map(c => c.id)));
  const [checkHint, setCheckHint] = useState<string | null>(null);
  const [slotWrong, setSlotWrong] = useState<boolean[]>(() => Array(ORDER_CARDS.length).fill(false));

  function handleDrop(cardId: number, slotIndex: number) {
    setSlotWrong(Array(ORDER_CARDS.length).fill(false));
    setCheckHint(null);

    setSlots(prev => {
      const next = [...prev];
      const fromSlot = next.indexOf(cardId);
      if (fromSlot !== -1) next[fromSlot] = null;
      const displaced = next[slotIndex];
      next[slotIndex] = cardId;

      setTray(t => {
        let t2 = t.filter(id => id !== cardId);
        if (displaced !== null && !t2.includes(displaced)) t2 = [...t2, displaced];
        return t2;
      });

      return next;
    });
  }

  function returnCardToTray(cardId: number) {
    setSlotWrong(Array(ORDER_CARDS.length).fill(false));
    setCheckHint(null);
    setSlots(prev => {
      const next = [...prev];
      const idx = next.indexOf(cardId);
      if (idx !== -1) next[idx] = null;
      return next;
    });
    setTray(t => (t.includes(cardId) ? t : [...t, cardId]));
  }

  function handleCheck() {
    setSlotWrong(Array(ORDER_CARDS.length).fill(false));
    setCheckHint(null);
    if (!slots.every(id => id !== null)) {
      setCheckHint('請先把四張圖卡都放進順位格，排好後再按「檢查」。');
      return;
    }
    const wrong = slots.map((id, i) => ORDER_CARDS.find(c => c.id === id)!.order !== i);
    if (wrong.some(Boolean)) {
      setSlotWrong(wrong);
      setCheckHint('順序不太對喔！想想看：從清晨 → 正午 → 黃昏 → 夜晚⋯ 調整後再按檢查！');
      return;
    }
    setTimeout(onComplete, 500);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-dnd-root className="flex flex-col h-full px-4 pb-4">
        <div className="text-center text-white/75 pt-2 pb-1" style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.5 }}>
          把下面圖卡拖進上面格子，排出「一天故事的先後順序」— 隨意調整後按檢查
        </div>

        {zodiac && (
          <div className="mt-2 mx-auto max-w-md text-center px-3 py-2 rounded-2xl" style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <div className="text-yellow-50" style={{ fontWeight: 900, fontSize: '12px' }}>
              {zodiac.glyph} {zodiac.nameZh} ({zodiac.latin})
            </div>
            <div className="text-white/80 mt-1" style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.45 }}>
              {zodiac.meaning}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 flex-wrap mt-3 mb-3">
          {slots.map((id, i) => (
            <OrderDropSlot
              key={i}
              slotIndex={i}
              placedId={id}
              onDrop={handleDrop}
              highlightWrong={slotWrong[i] ?? false}
            />
          ))}
        </div>

        <AnimatePresence>
          {checkHint && (
            <motion.div
              className="mx-auto mb-3 rounded-2xl px-4 py-2 max-w-md text-center"
              style={{ background: 'rgba(255,107,107,0.22)', border: '1px solid rgba(255,255,255,0.2)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-white/95" style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.55 }}>
                {checkHint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center mb-2">
          <button
            type="button"
            onClick={handleCheck}
            className="px-8 py-3 rounded-2xl text-white shadow-lg active:scale-[0.99] transition-transform"
            style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', fontWeight: 900, fontSize: '15px' }}
          >
            檢查
          </button>
        </div>

        <div className="flex-1" />

        <div className="text-center text-white/45 mb-2" style={{ fontSize: 10, fontWeight: 800 }}>
          卡片可從格子拖回下方區域取下 · 格子裡也可直接拖曳交換
        </div>
        <OrderTrayStrip onReturnCard={returnCardToTray}>
          {tray.map(id => (
            <OrderDraggable key={id} card={ORDER_CARDS.find(c => c.id === id)!} />
          ))}
          {tray.length === 0 && (
            <div className="text-white/35 py-2" style={{ fontWeight: 800, fontSize: 13 }}>
              四張都在順位上 — 需要修正可拖回這裡
            </div>
          )}
        </OrderTrayStrip>
      </div>
    </DndProvider>
  );
}

// ===================== MEMORY DROP =====================
interface MemoryItemData {
  id: number;
  emoji: string;
  slotIndex: number;
}

const MEMORY_ITEMS: MemoryItemData[] = [
  { id: 0, emoji: '💧', slotIndex: 0 },
  { id: 1, emoji: '🌵', slotIndex: 1 },
  { id: 2, emoji: '🐪', slotIndex: 2 },
];

const MEMORY_SHOW_MS = 3200;

function MemoryDraggable({ item }: { item: MemoryItemData }) {
  const [{ isDragging }, drag] = useDrag({
    type: MEMORY_ITEM_TYPE,
    item: { id: item.id },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div
      ref={drag as any}
      className="rounded-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'linear-gradient(135deg, rgba(255,212,59,0.25), rgba(255,146,43,0.15))',
        opacity: isDragging ? 0.45 : 1,
        width: 68,
        minHeight: 76,
        fontSize: 34,
        border: '2px solid rgba(255,255,255,0.4)',
      }}
    >
      {item.emoji}
    </div>
  );
}

function MemoryDropSlot({
  slotIndex,
  placedId,
  phase,
  revealedEmoji,
  onDrop,
  highlightWrong,
}: {
  slotIndex: number;
  placedId: number | null;
  phase: 'memorize' | 'play';
  revealedEmoji: string | null;
  onDrop: (itemId: number, slotIndex: number) => void;
  highlightWrong?: boolean;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: MEMORY_ITEM_TYPE,
    canDrop: () => phase === 'play',
    drop: (item: { id: number }) => phase === 'play' && onDrop(item.id, slotIndex),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  const itemData = placedId !== null ? MEMORY_ITEMS.find(m => m.id === placedId) : null;
  const showPeek = phase === 'memorize' && revealedEmoji;

  return (
    <div
      ref={drop as any}
      className="rounded-2xl flex flex-col items-center justify-center transition-all px-1"
      style={{
        width: 'min(92px, 22vw)',
        minHeight: 100,
        border: highlightWrong
          ? '2px solid rgba(255,107,107,0.9)'
          : isOver && phase === 'play'
          ? '2px dashed rgba(255,255,255,0.95)'
          : '2px dashed rgba(255,255,255,0.22)',
        background:
          phase === 'memorize'
            ? 'rgba(255,255,255,0.14)'
            : isOver && phase === 'play'
            ? 'rgba(255,255,255,0.18)'
            : 'rgba(0,0,0,0.12)',
      }}
    >
      <span className="text-white/50 mb-2" style={{ fontSize: 11, fontWeight: 900 }}>
        第 {slotIndex + 1} 格
      </span>
      {showPeek && (
        <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} style={{ fontSize: 42 }}>
          {revealedEmoji}
        </motion.span>
      )}
      {phase === 'play' && !showPeek && itemData && <MemoryDraggable item={itemData} />}
      {phase === 'play' && !itemData && (
        <span className="text-white/35" style={{ fontSize: 28, fontWeight: 900 }}>
          ?
        </span>
      )}
    </div>
  );
}

function MemoryTrayStrip({
  onReturnItem,
  children,
}: {
  onReturnItem: (itemId: number) => void;
  children: React.ReactNode;
}) {
  const [{ isOver }, drop] = useDrop({
    accept: MEMORY_ITEM_TYPE,
    drop: (item: { id: number }) => onReturnItem(item.id),
    collect: monitor => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={drop as any}
      className="flex flex-wrap gap-2 justify-center p-4 rounded-2xl min-h-[100px]"
      style={{
        background: isOver ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
        boxShadow: isOver ? 'inset 0 0 0 2px rgba(255,255,255,0.28)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

function MemoryMatchGame({ onComplete, zodiac }: { onComplete: () => void; zodiac?: ZodiacInfo }) {
  const [phase, setPhase] = useState<'memorize' | 'play'>('memorize');
  const [slots, setSlots] = useState<(number | null)[]>(() => Array(MEMORY_ITEMS.length).fill(null));
  const [tray, setTray] = useState<number[]>([]);
  const [checkHint, setCheckHint] = useState<string | null>(null);
  const [slotWrong, setSlotWrong] = useState<boolean[]>(() => Array(MEMORY_ITEMS.length).fill(false));

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPhase('play');
      setTray(shuffleArray(MEMORY_ITEMS.map(m => m.id)));
    }, MEMORY_SHOW_MS);
    return () => clearTimeout(t);
  }, []);

  function handleDrop(itemId: number, slotIndex: number) {
    setCheckHint(null);
    setSlotWrong(Array(MEMORY_ITEMS.length).fill(false));

    setSlots(prev => {
      const next = [...prev];
      const prevSlotOfItem = next.indexOf(itemId);
      if (prevSlotOfItem !== -1) next[prevSlotOfItem] = null;
      const displaced = next[slotIndex];
      next[slotIndex] = itemId;

      setTray(t => {
        let t2 = t.filter(id => id !== itemId);
        if (displaced !== null && !t2.includes(displaced)) t2 = [...t2, displaced];
        return t2;
      });

      return next;
    });
  }

  function returnItemToTray(itemId: number) {
    if (phase !== 'play') return;
    setCheckHint(null);
    setSlotWrong(Array(MEMORY_ITEMS.length).fill(false));
    setSlots(prev => {
      const next = [...prev];
      const idx = next.indexOf(itemId);
      if (idx !== -1) next[idx] = null;
      return next;
    });
    setTray(t => (t.includes(itemId) ? t : [...t, itemId]));
  }

  function handleCheck() {
    if (phase !== 'play') return;
    setSlotWrong(Array(MEMORY_ITEMS.length).fill(false));
    setCheckHint(null);
    if (!slots.every(id => id !== null)) {
      setCheckHint('請先把三個圖標都放進格子裡，再按「檢查」。');
      return;
    }
    const wrong = slots.map((id, i) => MEMORY_ITEMS.find(m => m.id === id)!.slotIndex !== i);
    if (wrong.some(Boolean)) {
      setSlotWrong(wrong);
      setCheckHint('有些位置和記憶中的不一樣喔！拖曳調整後再按檢查。');
      return;
    }
    setTimeout(onComplete, 500);
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div data-dnd-root className="flex flex-col h-full px-4 pb-4">
        <div className="text-center pt-2 pb-2" style={{ fontWeight: 900, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
          {phase === 'memorize' ? '先看清楚⋯ 等等格子會遮住，要靠記憶拖回去！' : '憑記憶把圖標拖回原位 — 排好後按檢查'}
        </div>

        {zodiac && (
          <div className="mx-auto mb-2 max-w-md text-center px-3 py-2 rounded-2xl" style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <div style={{ fontWeight: 900, fontSize: '12px', color: '#fef3c7' }}>
              {zodiac.glyph} {zodiac.nameZh} ({zodiac.latin})
            </div>
            <div className="text-white/82 mt-1" style={{ fontWeight: 600, fontSize: '11px', lineHeight: 1.45 }}>
              {zodiac.meaning}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 flex-wrap my-4">
          {MEMORY_ITEMS.map((m, slotIndex) => (
            <MemoryDropSlot
              key={slotIndex}
              slotIndex={slotIndex}
              placedId={slots[slotIndex]}
              phase={phase}
              revealedEmoji={m.emoji}
              onDrop={handleDrop}
              highlightWrong={phase === 'play' ? slotWrong[slotIndex] : false}
            />
          ))}
        </div>

        {phase === 'memorize' && (
          <motion.div
            className="text-center text-yellow-100/95 mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontWeight: 900, fontSize: 12 }}
          >
            提示：約 {(MEMORY_SHOW_MS / 1000).toFixed(1)} 秒後進入作答
          </motion.div>
        )}

        <AnimatePresence>
          {checkHint && phase === 'play' && (
            <motion.div
              className="mx-auto rounded-2xl px-4 py-2 mb-3 max-w-md text-center"
              style={{ background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,255,255,0.14)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="text-white/95" style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.5 }}>
                {checkHint}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'play' && (
          <div className="flex justify-center mb-2">
            <button
              type="button"
              onClick={handleCheck}
              className="px-8 py-3 rounded-2xl text-white shadow-lg active:scale-[0.99] transition-transform"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ff922b)', fontWeight: 900, fontSize: '15px' }}
            >
              檢查
            </button>
          </div>
        )}

        <div className="flex-1" />

        {phase === 'play' && (
          <>
            <div className="text-center text-white/45 mb-2" style={{ fontSize: 10, fontWeight: 800 }}>
              拖曳到對應格子 · 可拖回下方取下再重放
            </div>
            <MemoryTrayStrip onReturnItem={returnItemToTray}>
              {tray.map(id => (
                <MemoryDraggable key={id} item={MEMORY_ITEMS.find(m => m.id === id)!} />
              ))}
              {tray.length === 0 && (
                <div className="text-white/35 py-2" style={{ fontWeight: 800, fontSize: 13 }}>
                  三個圖標都在格子裡 — 需要改可拖回這裡
                </div>
              )}
            </MemoryTrayStrip>
          </>
        )}
      </div>
    </DndProvider>
  );
}

// ===================== MAIN GAMEPLAY =====================
export default function Gameplay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setLastGameScore, setCompletedLevels, completedLevels, currentLevel, setCurrentLevel, totalStars, setTotalStars, distractorLevel, collectedLevelIds, setCollectedLevelIds } = useApp();

  const rawMode = searchParams.get('mode');
  const mode: LevelMode =
    rawMode === 'spot' || rawMode === 'jigsaw' || rawMode === 'order' || rawMode === 'memory' ? rawMode : 'spot';
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
        background: themeBackground(levelMeta.theme, mode),
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
                    {levelMeta.zodiac
                      ? `${levelMeta.zodiac.glyph} ${levelMeta.zodiac.nameZh} (${levelMeta.zodiac.latin})`
                      : levelMeta.chapterId != null && levelMeta.indexInChapter != null
                        ? `第 ${levelMeta.chapterId}-${levelMeta.indexInChapter} 關`
                        : `第 ${levelMeta.id} 關`}
                  </div>
                  <div className="text-amber-100/95 mt-1" style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.5 }}>
                    {levelMeta.zodiac ? `寓意：${levelMeta.zodiac.meaning}` : levelMeta.story.title}
                  </div>
                  <div className="text-white/75 mt-2" style={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.6 }}>
                    {levelMeta.story.text}
                  </div>
                  <div className="text-white/75 mt-3" style={{ fontWeight: 800, fontSize: '13px' }}>
                    ✨ 星辰印記：{levelMeta.collectible.emoji} {levelMeta.collectible.name}
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
          {mode === 'spot'
            ? '🔍 找不同挑戰'
            : mode === 'jigsaw'
            ? '🧩 拼圖挑戰'
            : mode === 'order'
            ? '📜 順序排列挑戰'
            : '🧠 記憶配對挑戰'}
        </div>
        <div className="flex items-center gap-2 text-white" style={{ fontWeight: 700, fontSize: '13px' }}>
          ⭐{' '}
          {levelMeta.chapterId != null && levelMeta.indexInChapter != null
            ? `第 ${levelMeta.chapterId}-${levelMeta.indexInChapter} 關`
            : `第 ${level} 關`}
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
          <SpotDiff onComplete={handleComplete} zodiac={levelMeta.zodiac} />
        ) : mode === 'jigsaw' ? (
          <JigsawGame onComplete={handleComplete} zodiac={levelMeta.zodiac} />
        ) : mode === 'order' ? (
          <OrderSortGame onComplete={handleComplete} zodiac={levelMeta.zodiac} />
        ) : (
          <MemoryMatchGame onComplete={handleComplete} zodiac={levelMeta.zodiac} />
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
              ⭐
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
