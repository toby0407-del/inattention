import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { generateEncouragement } from '../utils/geminiEncouragement';
import { getLevelMeta, LEVELS_META, type LevelMode } from '../data/levels';

export default function Reward() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { totalStars, lastGameScore } = useApp();
  const hasFired = useRef(false);
  const [encouragement, setEncouragement] = useState<string>('');
  const [encouragementLoading, setEncouragementLoading] = useState(false);

  const level = Number(searchParams.get('level') ?? 1);
  const rawMode = searchParams.get('mode');
  const mode: LevelMode =
    rawMode === 'spot' || rawMode === 'jigsaw' || rawMode === 'order' || rawMode === 'memory' ? rawMode : 'spot';
  const levelMeta = getLevelMeta(level);
  const maxLevelId = LEVELS_META[LEVELS_META.length - 1]!.id;
  const nextLevelMeta = LEVELS_META.find(l => l.id === level + 1);
  const score = lastGameScore > 0 ? lastGameScore : 88;

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#ffd43b', '#ff922b', '#20c997', '#4dabf7', '#a855f7', '#ff6b6b'];

    function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }

    frame();

    // Big burst
    setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        colors,
        scalar: 1.2,
      });
    }, 400);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEncouragementLoading(true);
    generateEncouragement({ levelId: level, mode, score })
      .then((t) => {
        if (cancelled) return;
        setEncouragement(t);
      })
      .finally(() => {
        if (cancelled) return;
        setEncouragementLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [level, mode, score]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        fontFamily: 'Nunito, sans-serif',
        background: 'linear-gradient(135deg, #1a0a3c 0%, #2d1060 40%, #0a2040 100%)',
      }}
    >
      {/* Starry bg */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0.1, 0.7, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Success animation */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10, delay: 0.2 }}
      >
        {/* Glowing background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,212,59,0.4) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Main icon */}
        <motion.div
          className="relative text-8xl"
          animate={{
            rotate: [0, 10, -10, 8, -5, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 0.8, delay: 0.5, repeat: 2 }}
        >
          {mode === 'spot' ? '🔍✨' : mode === 'jigsaw' ? '🧩' : mode === 'order' ? '📜✨' : '🧠✨'}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="text-white" style={{ fontWeight: 900, fontSize: '32px', textShadow: '0 0 20px rgba(255,212,59,0.6)' }}>
          太棒了！🎉
        </div>
        <div className="text-white/80 mt-1 px-6" style={{ fontWeight: 700, fontSize: '17px', lineHeight: 1.45 }}>
          {levelMeta.zodiac
            ? `${levelMeta.zodiac.glyph} ${levelMeta.zodiac.nameZh} 已點亮！`
            : levelMeta.chapterId != null && levelMeta.indexInChapter != null
              ? `第 ${levelMeta.chapterId}-${levelMeta.indexInChapter} 關完成！`
              : `第 ${level} 關完成！`}
          <br />
          <span className="text-white/70" style={{ fontWeight: 600, fontSize: '15px' }}>
            {levelMeta.zodiac ? `寓意：${levelMeta.zodiac.meaning}` : `拿到 ${levelMeta.collectible.emoji} ${levelMeta.collectible.name}`}
          </span>
        </div>
      </motion.div>

      {/* Stars earned */}
      <motion.div
        className="flex gap-3 mb-6"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="text-5xl"
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.15, type: 'spring', damping: 10 }}
          >
            ⭐
          </motion.div>
        ))}
      </motion.div>

      {/* Score card */}
      <motion.div
        className="rounded-3xl p-5 mb-8 text-center w-64"
        style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-white/60" style={{ fontWeight: 600, fontSize: '12px' }}>專注力得分</div>
        <motion.div
          className="text-white"
          style={{ fontWeight: 900, fontSize: '52px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {score}
        </motion.div>
        <div className="text-white/50" style={{ fontWeight: 600, fontSize: '12px' }}>/ 100 分</div>

        <div className="mt-3 flex items-center justify-center gap-2 text-yellow-300" style={{ fontWeight: 700, fontSize: '14px' }}>
          <span>⭐</span>
          <span>總收集：{totalStars} 顆星星</span>
        </div>
      </motion.div>

      {/* Encouragement (Gemini) */}
      <motion.div
        className="text-center mb-5 px-8 max-w-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div
          className="inline-block rounded-3xl px-5 py-3"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}
        >
          <div className="text-white/70" style={{ fontWeight: 900, fontSize: '12px', letterSpacing: 0.6 }}>
            今日評語
          </div>
          <div className="text-white mt-1" style={{ fontWeight: 800, fontSize: '15px', lineHeight: 1.5 }}>
            {encouragementLoading
              ? '正在生成鼓勵中…'
              : (encouragement ||
                (mode === 'spot'
                  ? '你的眼睛超厲害！找到了所有不同的地方 👀'
                  : mode === 'jigsaw'
                  ? '拼圖完成啦！所有圖塊都回到正確位置了 🎊'
                  : mode === 'order'
                  ? '順序排得好整齊！故事線在你心中超清楚 📜'
                  : '記憶力滿分！每個圖標都回到正確的位置了 🧠'))}
          </div>
          <div className="text-white/50 mt-1" style={{ fontWeight: 700, fontSize: '11px' }}>
            {import.meta.env?.VITE_GEMINI_API_KEY ? '由 Gemini 產生' : '（未設定 Gemini Key，使用備用文案）'}
          </div>
        </div>
      </motion.div>

      {/* Navigation buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs px-4">
        <motion.button
          className="py-5 rounded-2xl text-white flex items-center justify-center gap-3 shadow-2xl"
          style={{
            background: nextLevelMeta
              ? 'linear-gradient(135deg, #ffd43b, #ff922b)'
              : 'linear-gradient(135deg, #20c997, #4dabf7)',
            fontWeight: 900,
            fontSize: '18px',
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          onClick={() => {
            if (nextLevelMeta) navigate(`/child/play?mode=${nextLevelMeta.mode}&level=${nextLevelMeta.id}`);
            else navigate('/child/lobby');
          }}
        >
          <span>{nextLevelMeta ? '▶▶' : '🗺️'}</span>
          <span>{nextLevelMeta ? '前往下一關' : level >= maxLevelId ? '恭喜通關！回大廳' : '回大廳地圖'}</span>
        </motion.button>

        <motion.button
          className="py-4 rounded-2xl flex items-center justify-center gap-3"
          style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, fontSize: '16px' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={() => navigate('/child/lobby')}
        >
          <span>🗺️</span>
          <span>回到大廳地圖</span>
        </motion.button>
      </div>
    </div>
  );
}