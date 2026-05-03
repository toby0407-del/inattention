import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CHAPTERS,
  themeBackground,
  getChapterForLevel,
  layoutPathForCount,
  isChapterComplete,
  type LevelMeta,
} from '../data/levels';
import { ensureBlueBgm } from '../utils/blueBgm';

type MapLevel = LevelMeta & { x: number; y: number; stars: number };

function StarCount({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} style={{ fontSize: '14px', opacity: i < count ? 1 : 0.3 }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export default function QuestMap() {
  const navigate = useNavigate();
  const { totalStars, completedLevels, currentLevel, collectedLevelIds } = useApp();
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showStickerBook, setShowStickerBook] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<MapLevel | null>(null);

  useEffect(() => {
    ensureBlueBgm();
  }, []);

  /** 進入地圖時，自動切到「目前主線關卡」所在章節 */
  useEffect(() => {
    const ch = getChapterForLevel(currentLevel);
    if (!ch) return;
    const idx = CHAPTERS.findIndex(c => c.id === ch.id);
    if (idx >= 0) setChapterIndex(idx);
  }, [currentLevel]);

  const chapter = CHAPTERS[chapterIndex] ?? CHAPTERS[0];
  const chapterComplete = isChapterComplete(chapter, completedLevels);

  const LEVELS: MapLevel[] = useMemo(() => {
    const coords = layoutPathForCount(chapter.levels.length);
    return chapter.levels.map((l, i) => ({
      ...l,
      x: coords[i]?.x ?? 50,
      y: coords[i]?.y ?? 50,
      stars: 3,
    }));
  }, [chapter]);

  const bg = useMemo(() => {
    const mode = chapter.levels[0]?.mode ?? 'spot';
    return themeBackground(chapter.mapTheme, mode);
  }, [chapter]);

  function handleLevelClick(level: MapLevel) {
    if (level.id > currentLevel) return;
    setSelectedLevel(level);
  }

  function handleStart() {
    if (!selectedLevel) return;
    navigate(`/child/play?mode=${selectedLevel.mode}&level=${selectedLevel.id}`);
    setSelectedLevel(null);
  }

  const canPrevChapter = chapterIndex > 0;
  const canNextChapter = chapterIndex < CHAPTERS.length - 1;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: 'Nunito, sans-serif', background: bg }}
    >
      {/* 章節標題與資訊卡（箭頭改到卡片下方，避免與文字左右重疊） */}
      <div className="absolute left-0 right-0 z-20 flex flex-col items-center px-4 pt-[5.25rem] pb-2 max-w-lg mx-auto w-full gap-3">
        <div className="text-center w-full px-1">
          <div className="text-white/95 mb-1" style={{ fontWeight: 900, fontSize: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.55)' }}>
            {chapter.mapEmoji} 章節地圖 · 共 {chapter.levels.length} 關
          </div>
          <div className="text-white leading-snug" style={{ fontWeight: 900, fontSize: '22px', textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}>
            第 {chapter.id} 章 · {chapter.title}
          </div>
          <div className="text-white/85 mt-1" style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.35 }}>
            {chapter.subtitle}
          </div>
        </div>

        <div
          className="rounded-3xl px-5 py-4 w-full"
          style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-start gap-4">
            <div className="text-5xl shrink-0">{chapter.assembledReward.emoji}</div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-white" style={{ fontWeight: 900, fontSize: '15px', textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>
                本章終極收藏（集滿碎片後合成）
              </div>
              <div className="text-white mt-1" style={{ fontWeight: 900, fontSize: '17px' }}>
                {chapter.assembledReward.name}
              </div>
              <div className="text-white/75 mt-2" style={{ fontWeight: 600, fontSize: '14px', lineHeight: 1.5 }}>
                {chapter.assembledReward.description}
              </div>
              <div className="text-yellow-100 mt-3" style={{ fontWeight: 800, fontSize: '14px' }}>
                進度：本章碎片 {chapter.levels.filter(l => collectedLevelIds.includes(l.id) || completedLevels.includes(l.id)).length}/{chapter.levels.length}
                {chapterComplete ? ' · 已可視為合成完成 ✓' : ''}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-14 w-full px-2 pb-1">
          <button
            type="button"
            disabled={!canPrevChapter}
            onClick={() => canPrevChapter && setChapterIndex(chapterIndex - 1)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '26px',
              fontWeight: 900,
            }}
            aria-label="上一章"
          >
            ◀
          </button>
          <div className="text-white/75 text-center" style={{ fontWeight: 800, fontSize: '13px', maxWidth: '7rem', lineHeight: 1.35 }}>
            左右切換章節
          </div>
          <button
            type="button"
            disabled={!canNextChapter}
            onClick={() => canNextChapter && setChapterIndex(chapterIndex + 1)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.3)',
              fontSize: '26px',
              fontWeight: 900,
            }}
            aria-label="下一章"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 前景裝飾：依章節略調，避免搶眼蓋字 */}
      {Array.from({ length: chapterIndex === 1 ? 18 : 28 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * (chapterIndex === 1 ? 40 : 55)}%`,
            opacity: Math.random() * 0.6 + 0.15,
          }}
          animate={{ opacity: [0.2, 0.75, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {chapterIndex === 0 && (
        <div className="absolute top-12 right-16 w-14 h-14 rounded-full z-[6]" style={{ background: '#fef3c7', boxShadow: '0 0 30px rgba(254,243,199,0.5)' }} />
      )}
      {chapterIndex === 1 && (
        <div className="absolute top-14 right-12 text-6xl opacity-30 z-[6] select-none">🌊</div>
      )}
      {chapterIndex === 2 && (
        <div className="absolute top-14 right-12 text-5xl opacity-25 z-[6] select-none">✨</div>
      )}

      {chapterIndex !== 1 &&
        [{ x: 8, y: 15 }, { x: 40, y: 10 }, { x: 72, y: 18 }].map((c, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute text-5xl opacity-35 select-none z-[6]"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ☁️
          </motion.div>
        ))}

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
          <span className="text-white" style={{ fontWeight: 900, fontSize: '30px' }}>{totalStars}</span>
        </motion.div>
        <div className="w-8" />
      </div>

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
              key={`${chapter.id}-${i}`}
              x1={`${level.x}%`}
              y1={`${level.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke={unlocked ? '#ffd43b' : 'rgba(255,255,255,0.2)'}
              strokeWidth={unlocked ? 4 : 3}
              strokeDasharray={unlocked ? 'none' : '8,6'}
              filter={unlocked ? 'url(#glow)' : 'none'}
            />
          );
        })}
      </svg>

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
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: 80,
                  height: 80,
                  left: -20,
                  top: -20,
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

            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
              <div className="text-white" style={{ fontWeight: 800, fontSize: '13px', textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                {level.chapterId != null && level.indexInChapter != null
                  ? `${level.chapterId}-${level.indexInChapter}`
                  : `第${level.id}關`}
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
              <div className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>
                第 {selectedLevel.chapterId}-{selectedLevel.indexInChapter} 關
              </div>
              <div className="text-white/70 mt-1 mb-6" style={{ fontWeight: 600, fontSize: '15px' }}>
                {selectedLevel.type}挑戰
              </div>
              <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="text-white" style={{ fontWeight: 900, fontSize: '14px' }}>
                  📖 {selectedLevel.story.title}
                </div>
                <div className="text-white/70 mt-1" style={{ fontWeight: 600, fontSize: '12px', lineHeight: 1.6 }}>
                  {selectedLevel.story.text}
                </div>
                <div className="text-white/70 mt-2" style={{ fontWeight: 700, fontSize: '12px' }}>
                  🧩 本關碎片：{selectedLevel.collectible.emoji} {selectedLevel.collectible.name}
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
              style={{ background: 'linear-gradient(135deg, #fef3c7, #fff7ed)', maxHeight: '78vh', overflowY: 'auto' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div style={{ fontWeight: 900, fontSize: '20px', color: '#92400e' }}>🎒 收藏冊 · 章節碎片與合成</div>
                <button type="button" onClick={() => setShowStickerBook(false)} className="text-2xl">
                  ✕
                </button>
              </div>

              {CHAPTERS.map(ch => {
                const done = ch.levels.filter(l => collectedLevelIds.includes(l.id) || completedLevels.includes(l.id)).length;
                const assembled = isChapterComplete(ch, completedLevels);
                return (
                  <div key={ch.id} className="mb-6 pb-5 border-b border-amber-200/80 last:border-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{ch.mapEmoji}</span>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#78350f' }}>
                          第 {ch.id} 章 {ch.title}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#b45309' }}>
                          碎片 {done}/{ch.levels.length}
                          {assembled ? ' · 可合成終極收藏' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3">
                      {ch.levels.map(lvl => {
                        const unlocked = collectedLevelIds.includes(lvl.id) || completedLevels.includes(lvl.id);
                        return (
                          <div
                            key={lvl.id}
                            className="aspect-square rounded-xl flex flex-col items-center justify-center text-xl"
                            style={{
                              background: unlocked ? 'linear-gradient(135deg, #fcd34d, #fb923c)' : 'rgba(0,0,0,0.06)',
                              border: unlocked ? '2px solid rgba(251,146,60,0.4)' : '2px dashed rgba(0,0,0,0.12)',
                            }}
                          >
                            <span style={{ opacity: unlocked ? 1 : 0.25 }}>{unlocked ? lvl.collectible.emoji : '🔒'}</span>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: unlocked ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.35)', marginTop: 4 }}>
                              {ch.id}-{lvl.indexInChapter ?? lvl.id}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{
                        background: assembled ? 'linear-gradient(135deg, #34d399, #38bdf8)' : 'rgba(255,255,255,0.65)',
                        border: `2px solid ${assembled ? 'rgba(16,185,129,0.5)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                    >
                      <div className="text-4xl">{ch.assembledReward.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '14px', color: assembled ? '#fff' : '#92400e' }}>
                          {assembled ? '合成解鎖：' : '終極收藏預覽：'}
                          {ch.assembledReward.name}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: assembled ? 'rgba(255,255,255,0.92)' : '#78350f', lineHeight: 1.45 }}>
                          {ch.assembledReward.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-2 text-center" style={{ fontWeight: 700, fontSize: '13px', color: '#d97706' }}>
                已收集碎片 {collectedLevelIds.length} / {CHAPTERS.reduce((n, c) => n + c.levels.length, 0)} · 每章集滿即可視為合成該章終極收藏 ✨
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
