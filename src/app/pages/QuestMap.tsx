import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LEVELS_META } from '../data/levels';
import { ensureBlueBgm } from '../utils/blueBgm';
import { getLevelMeta, themeBackground } from '../data/levels';

type Level = (typeof LEVELS_META)[number] & { x: number; y: number; stars: number };

const LEVELS: Level[] = [
  { ...LEVELS_META[0], x: 15, y: 78, stars: 3 },
  { ...LEVELS_META[1], x: 32, y: 62, stars: 3 },
  { ...LEVELS_META[2], x: 50, y: 72, stars: 2 },
  { ...LEVELS_META[3], x: 65, y: 55, stars: 0 },
  { ...LEVELS_META[4], x: 78, y: 40, stars: 0 },
  { ...LEVELS_META[5], x: 85, y: 22, stars: 0 },
];

function StarCount({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} style={{ fontSize: '12px', opacity: i < count ? 1 : 0.3 }}>⭐</span>
      ))}
    </div>
  );
}

export default function QuestMap() {
  const navigate = useNavigate();
  const { totalStars, completedLevels, currentLevel, collectedLevelIds } = useApp();
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);

  // make sure BGM starts even if user refreshes on this page
  useEffect(() => {
    ensureBlueBgm();
  }, []);

  const stageLevel = useMemo(() => getLevelMeta(currentLevel), [currentLevel]);
  const bg = useMemo(() => themeBackground(stageLevel.theme, stageLevel.mode), [stageLevel.theme, stageLevel.mode]);

  function handleLevelClick(level: Level) {
    if (level.id > currentLevel) return;
    setSelectedLevel(level);
  }

  function handleStart() {
    if (!selectedLevel) return;
    navigate(`/child/play?mode=${selectedLevel.mode}&level=${selectedLevel.id}`);
    setSelectedLevel(null);
  }

  const connectorPoints = LEVELS.map(l => ({ x: l.x, y: l.y }));

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: 'Nunito, sans-serif', background: bg }}
    >
      {/* Stage collectible hint */}
      <div className="absolute top-28 left-6 z-10 select-none">
        <div
          className="rounded-3xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{stageLevel.collectible.emoji}</div>
            <div>
              <div className="text-white" style={{ fontWeight: 900, fontSize: '13px', textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>
                本章收集物
              </div>
              <div className="text-white/80" style={{ fontWeight: 700, fontSize: '12px' }}>
                {stageLevel.collectible.name}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Starry sky decorations */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 55}%`,
            opacity: Math.random() * 0.6 + 0.2,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Moon */}
      <div className="absolute top-12 right-16 w-14 h-14 rounded-full" style={{ background: '#fef3c7', boxShadow: '0 0 30px rgba(254,243,199,0.5)' }} />
      
      {/* Clouds */}
      {[{x:8,y:15},{x:40,y:10},{x:72,y:18}].map((c, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl opacity-40 select-none"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ☁️
        </motion.div>
      ))}

      {/* Stars counter - top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-4 pb-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}>
        <button
          onClick={() => navigate('/')}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '2px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            fontSize: '26px',
            fontWeight: 900,
          }}
          title="返回"
          aria-label="返回"
        >
          ←
        </button>
        <motion.div
          className="flex items-center gap-3 px-5 py-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-3xl">⭐</span>
          <span className="text-white" style={{ fontWeight: 900, fontSize: '28px' }}>{totalStars}</span>
        </motion.div>
        <div className="w-8" />
      </div>

      {/* Map title */}
      <div className="absolute top-20 left-0 right-0 text-center z-10">
        <div className="text-white" style={{ fontWeight: 900, fontSize: '18px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          🗺️ 魔法森林冒險地圖
        </div>
      </div>

      {/* SVG path connecting levels */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }} preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {LEVELS.slice(0, -1).map((level, i) => {
          const next = LEVELS[i + 1];
          const unlocked = level.id < currentLevel;
          return (
            <line
              key={i}
              x1={`${level.x}%`} y1={`${level.y}%`}
              x2={`${next.x}%`} y2={`${next.y}%`}
              stroke={unlocked ? '#ffd43b' : 'rgba(255,255,255,0.2)'}
              strokeWidth={unlocked ? 4 : 3}
              strokeDasharray={unlocked ? 'none' : '8,6'}
              filter={unlocked ? 'url(#glow)' : 'none'}
            />
          );
        })}
      </svg>

      {/* Level nodes */}
      {LEVELS.map(level => {
        const isCompleted = completedLevels.includes(level.id);
        const isCurrent = level.id === currentLevel;
        const isLocked = level.id > currentLevel;

        return (
          <div
            key={level.id}
            className="absolute z-10"
            style={{
              left: `${level.x}%`,
              top: `${level.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Glow effect for current level */}
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: 80, height: 80,
                  left: -20, top: -20,
                  background: 'rgba(255, 212, 59, 0.4)',
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <motion.button
              className="relative w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-xl border-3"
              style={{
                background: isLocked
                  ? 'rgba(100,116,139,0.7)'
                  : isCompleted
                  ? 'linear-gradient(135deg, #ffd43b, #ff922b)'
                  : 'linear-gradient(135deg, #a855f7, #6366f1)',
                borderColor: isCurrent ? '#fff' : isCompleted ? '#ff922b' : 'transparent',
                border: isCurrent ? '3px solid white' : isCompleted ? '3px solid #ff922b' : '3px solid transparent',
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
              whileHover={!isLocked ? { scale: 1.15 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
              transition={isCurrent ? { duration: 1, repeat: Infinity } : {}}
              onClick={() => handleLevelClick(level)}
            >
              <span style={{ fontSize: '22px' }}>{isLocked ? '🔒' : level.icon}</span>
            </motion.button>

            {/* Level label + stars */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
              <div className="text-white" style={{ fontWeight: 800, fontSize: '11px', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                第{level.id}關
              </div>
              {isCompleted && (
                <div className="flex justify-center">
                  <StarCount count={level.stars} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Sticker book FAB */}
      <motion.button
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl z-20"
        style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff922b)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => setShowStickerBook(true)}
      >
        🎒
      </motion.button>

      {/* Level start modal */}
      <AnimatePresence>
        {selectedLevel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLevel(null)}
          >
            <motion.div
              className="rounded-3xl p-8 text-center max-w-xs w-full"
              style={{ background: 'linear-gradient(135deg, #2d1b69, #1e3a5f)', border: '2px solid rgba(255,255,255,0.2)' }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 18 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">{selectedLevel.icon}</div>
              <div className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>第{selectedLevel.id}關</div>
              <div className="text-white/70 mt-1 mb-6" style={{ fontWeight: 600, fontSize: '15px' }}>{selectedLevel.type}挑戰</div>
              <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="text-white" style={{ fontWeight: 900, fontSize: '14px' }}>
                  📖 {selectedLevel.story.title}
                </div>
                <div className="text-white/70 mt-1" style={{ fontWeight: 600, fontSize: '12px', lineHeight: 1.6 }}>
                  {selectedLevel.story.text}
                </div>
                <div className="text-white/70 mt-2" style={{ fontWeight: 700, fontSize: '12px' }}>
                  🎁 本關可收集：{selectedLevel.collectible.emoji} {selectedLevel.collectible.name}
                </div>
              </div>
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #ffd43b, #ff922b)', fontWeight: 900, fontSize: '18px' }}
              >
                ▶ 開始！
              </button>
              <button
                onClick={() => setSelectedLevel(null)}
                className="mt-3 w-full py-3 text-white/50"
                style={{ fontWeight: 700, fontSize: '14px' }}
              >
                等等再玩
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticker book modal */}
      <AnimatePresence>
        {showStickerBook && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-lg rounded-t-3xl p-6"
              style={{ background: 'linear-gradient(135deg, #fef3c7, #fff7ed)', maxHeight: '70vh', overflowY: 'auto' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div style={{ fontWeight: 900, fontSize: '20px', color: '#92400e' }}>🎒 我的收藏冊</div>
                <button onClick={() => setShowStickerBook(false)} className="text-2xl">✕</button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {LEVELS.map((lvl) => {
                  const unlocked = collectedLevelIds.includes(lvl.id) || completedLevels.includes(lvl.id);
                  return (
                    <motion.div
                      key={lvl.id}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center text-3xl overflow-hidden"
                      style={{
                        background: unlocked ? 'linear-gradient(135deg, #ffd43b, #ff922b)' : 'rgba(0,0,0,0.08)',
                        border: unlocked ? '2px solid rgba(255,146,43,0.35)' : '2px dashed rgba(0,0,0,0.15)',
                      }}
                      whileHover={{ scale: 1.06 }}
                    >
                      <span style={{ opacity: unlocked ? 1 : 0.25 }}>{unlocked ? lvl.collectible.emoji : '🔒'}</span>
                      <div className="mt-1 text-center" style={{ fontSize: '10px', fontWeight: 900, color: unlocked ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.35)' }}>
                        第{lvl.id}關
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-4 text-center" style={{ fontWeight: 700, fontSize: '13px', color: '#d97706' }}>
                已收集 {collectedLevelIds.length}/{LEVELS.length} 件收藏！每一關都能拿到一樣故事相關的寶物 ✨
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
