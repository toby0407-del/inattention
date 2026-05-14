import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Star, Home, Play } from "lucide-react";
import confetti from "canvas-confetti";

export function Reward() {
  const navigate = useNavigate();
  const [stars, setStars] = useState(0);
  const [coins, setCoins] = useState(0);
  const maxStars = 3;
  const maxCoins = 50;

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#fbbf24", "#f59e0b", "#f97316"],
    });

    const starInterval = setInterval(() => {
      setStars((prev) => {
        if (prev >= maxStars) {
          clearInterval(starInterval);
          return maxStars;
        }
        confetti({
          particleCount: 20,
          spread: 50,
          origin: { x: 0.5, y: 0.4 },
          colors: ["#fbbf24"],
        });
        return prev + 1;
      });
    }, 600);

    const coinInterval = setInterval(() => {
      setCoins((prev) => {
        if (prev >= maxCoins) {
          clearInterval(coinInterval);
          return maxCoins;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      clearInterval(starInterval);
      clearInterval(coinInterval);
    };
  }, []);

  return (
    <div className="size-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>

      <div className="relative z-10 text-center space-y-12 max-w-2xl px-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          <div className="text-8xl mb-4">🎉</div>
          <h1 className="text-5xl text-white mb-2">太棒了！</h1>
          <p className="text-xl text-white/90">任務完成</p>
        </motion.div>

        <div className="bg-white/20 backdrop-blur-md rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-center gap-4">
            {Array.from({ length: maxStars }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: i < stars ? 1 : 0,
                  rotate: i < stars ? 0 : -180,
                }}
                transition={{ delay: i * 0.6, type: "spring" }}
              >
                <Star className="w-16 h-16 text-yellow-300 fill-yellow-300" />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="flex items-center justify-center gap-3 text-white"
          >
            <div className="text-4xl">💰</div>
            <div className="text-4xl">+{coins}</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/child")}
            className="flex items-center gap-3 px-8 py-4 bg-white text-purple-600 rounded-2xl hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
          >
            <Home className="w-6 h-6" />
            回到大廳
          </button>
          <button
            onClick={() => navigate("/calibration")}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl hover:shadow-2xl transition-all hover:scale-105 shadow-xl"
          >
            <Play className="w-6 h-6" />
            下一關
          </button>
        </motion.div>
      </div>

      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
      ></motion.div>
      <motion.div
        animate={{
          rotate: -360,
          scale: [1, 1.3, 1],
        }}
        transition={{
          rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
      ></motion.div>
    </div>
  );
}
