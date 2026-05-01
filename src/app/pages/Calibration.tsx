import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

interface CalibPoint {
  id: number;
  x: string;
  y: string;
  label: string;
}

const POINTS: CalibPoint[] = [
  { id: 0, x: '10%',  y: '15%',  label: '左上角' },
  { id: 1, x: '90%',  y: '15%',  label: '右上角' },
  { id: 2, x: '50%',  y: '50%',  label: '正中央' },
  { id: 3, x: '10%',  y: '85%',  label: '左下角' },
  { id: 4, x: '90%',  y: '85%',  label: '右下角' },
];

export default function Calibration() {
  const navigate = useNavigate();
  const [currentPoint, setCurrentPoint] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [allDone, setAllDone] = useState<number[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isHolding && !done) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval!);
            handlePointDone();
            return 100;
          }
          return p + 3.33;
        });
      }, 66);
    } else if (!isHolding) {
      if (progress < 100) setProgress(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isHolding]);

  function handlePointDone() {
    setIsHolding(false);
    setAllDone(prev => [...prev, currentPoint]);
    setProgress(0);
    if (currentPoint < POINTS.length - 1) {
      setTimeout(() => setCurrentPoint(p => p + 1), 600);
    } else {
      setTimeout(() => setDone(true), 800);
    }
  }

  const point = POINTS[currentPoint];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #1e1060 0%, #0a0520 100%)', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Stars bg */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {!done ? (
        <>
          {/* Progress bar */}
          <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-2 z-10">
            <div className="text-white/60" style={{ fontWeight: 700, fontSize: '14px' }}>
              眼動校正進行中 {currentPoint + 1} / {POINTS.length}
            </div>
            <div className="flex gap-2">
              {POINTS.map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: allDone.includes(i)
                      ? '#20c997'
                      : i === currentPoint
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Instruction */}
          <div className="absolute bottom-10 left-0 right-0 text-center z-10">
            <div className="text-white/80" style={{ fontWeight: 700, fontSize: '16px' }}>
              👀 看著發光的目標，長按住它！
            </div>
            <div className="text-white/50 mt-1" style={{ fontWeight: 600, fontSize: '13px' }}>
              盯著目標 2 秒完成校正
            </div>
          </div>

          {/* Completed points */}
          {allDone.map(id => (
            <div
              key={id}
              className="absolute"
              style={{ left: POINTS[id].x, top: POINTS[id].y, transform: 'translate(-50%,-50%)' }}
            >
              <div className="w-8 h-8 rounded-full bg-teal-400/80 flex items-center justify-center text-white text-lg">
                ✓
              </div>
            </div>
          ))}

          {/* Current calibration point */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPoint}
              className="absolute z-20"
              style={{ left: point.x, top: point.y, transform: 'translate(-50%,-50%)' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {/* Outer pulse ring */}
              <motion.div
                className="absolute rounded-full"
                style={{ width: 80, height: 80, top: -24, left: -24, border: '2px solid rgba(255,212,59,0.4)' }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />

              {/* Progress ring (SVG) */}
              <svg width="60" height="60" className="-rotate-90" style={{ position: 'absolute', top: -14, left: -14 }}>
                <circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="30" cy="30" r="26"
                  fill="none"
                  stroke="#ffd43b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - progress / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>

              {/* Center button */}
              <motion.button
                className="w-8 h-8 rounded-full flex items-center justify-center text-xl shadow-2xl"
                style={{
                  background: progress > 0 ? `rgba(255,212,59,${0.5 + progress / 200})` : 'rgba(255,212,59,0.7)',
                  boxShadow: `0 0 ${20 + progress / 2}px rgba(255,212,59,0.8)`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                onMouseDown={() => setIsHolding(true)}
                onMouseUp={() => setIsHolding(false)}
                onMouseLeave={() => setIsHolding(false)}
                onTouchStart={() => setIsHolding(true)}
                onTouchEnd={() => setIsHolding(false)}
              >
                🔍
              </motion.button>

              {/* Label */}
              <div
                className="absolute text-white/80 whitespace-nowrap"
                style={{ fontWeight: 700, fontSize: '11px', top: 40, left: '50%', transform: 'translateX(-50%)' }}
              >
                {point.label}
              </div>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        /* Done screen */
        <motion.div
          className="text-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, repeat: 2 }}
          >
            🎯
          </motion.div>
          <div className="text-white" style={{ fontWeight: 900, fontSize: '30px' }}>校正完成！</div>
          <div className="text-white/70 mt-2 mb-8" style={{ fontWeight: 600, fontSize: '16px' }}>
            視線追蹤已準備好，開始冒險吧！
          </div>
          <motion.button
            className="px-12 py-4 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #ffd43b, #ff922b)', fontWeight: 900, fontSize: '20px' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/child/lobby')}
          >
            ▶ 進入冒險！
          </motion.button>
        </motion.div>
      )}

      {/* Skip button (hidden, low opacity) */}
      <button
        className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-all"
        style={{ fontWeight: 500, fontSize: '12px' }}
        onClick={() => navigate('/child/lobby')}
      >
        略過
      </button>
    </div>
  );
}