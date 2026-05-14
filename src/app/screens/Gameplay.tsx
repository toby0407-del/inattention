import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowDown, Pause, BookOpen, Brain, Zap } from "lucide-react";

type GameMode = "focus" | "reaction" | "reading";

export function Gameplay() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GameMode>("focus");
  const [isDistracted, setIsDistracted] = useState(false);
  const [isTooClose, setIsTooClose] = useState(false);
  const [score, setScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reactionReady, setReactionReady] = useState(false);
  const [reactionHits, setReactionHits] = useState(0);
  const [readAnswer, setReadAnswer] = useState("");

  useEffect(() => {
    const distractedInterval = setInterval(() => {
      if (Math.random() > 0.87) {
        setIsDistracted(true);
        setTimeout(() => setIsDistracted(false), 1400);
      }
    }, 2800);

    const closeInterval = setInterval(() => {
      if (Math.random() > 0.94) {
        setIsTooClose(true);
        setTimeout(() => setIsTooClose(false), 1200);
      }
    }, 3600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const step = mode === "focus" ? 2 : 1;
        const next = Math.min(prev + step, 100);
        if (next >= 100) {
          navigate("/reward");
        }
        return next;
      });
      setScore((prev) => prev + (mode === "focus" ? 10 : 6));
    }, 500);

    return () => {
      clearInterval(distractedInterval);
      clearInterval(closeInterval);
      clearInterval(progressInterval);
    };
  }, [mode, navigate]);

  useEffect(() => {
    if (mode !== "reaction") return;
    const timer = setInterval(() => setReactionReady(Math.random() > 0.45), 1200);
    return () => clearInterval(timer);
  }, [mode]);

  const submitReadingAnswer = (answer: string) => {
    setReadAnswer(answer);
    if (answer === "rain") {
      setScore((prev) => prev + 120);
      setProgress((prev) => Math.min(prev + 20, 100));
    }
  };

  return (
    <div className="size-full relative overflow-hidden app-gradient-surface p-4 md:p-8">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
            <p className="text-sm text-gray-600">分數</p>
            <p className="text-2xl">{score}</p>
          </div>

          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg min-w-20 text-center">
            <p className="text-sm text-gray-600">{progress}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setMode("focus")}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${mode === "focus" ? "border-blue-500 bg-white shadow-lg" : "border-white/70 bg-white/70"}`}
          >
            <Brain className="w-6 h-6 text-blue-600" />
            <p className="mt-2">專注追蹤</p>
            <p className="text-sm text-gray-500">盯著目標，降低分心</p>
          </button>
          <button
            onClick={() => setMode("reaction")}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${mode === "reaction" ? "border-emerald-500 bg-white shadow-lg" : "border-white/70 bg-white/70"}`}
          >
            <Zap className="w-6 h-6 text-emerald-600" />
            <p className="mt-2">反應訓練</p>
            <p className="text-sm text-gray-500">看到綠燈立刻按下</p>
          </button>
          <button
            onClick={() => setMode("reading")}
            className={`rounded-2xl p-4 text-left border-2 transition-all ${mode === "reading" ? "border-purple-500 bg-white shadow-lg" : "border-white/70 bg-white/70"}`}
          >
            <BookOpen className="w-6 h-6 text-purple-600" />
            <p className="mt-2">閱讀專注</p>
            <p className="text-sm text-gray-500">讀短文回答重點</p>
          </button>
        </div>

        <div className="flex-1 rounded-3xl bg-white/80 backdrop-blur-sm border border-white p-6 overflow-auto relative">
          {mode === "focus" && (
            <div className="h-full flex items-center justify-center">
              <motion.div
                animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-28 h-28 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl flex items-center justify-center"
              >
                <span className="text-5xl">🚀</span>
              </motion.div>
            </div>
          )}

          {mode === "reaction" && (
            <div className="h-full flex flex-col items-center justify-center gap-8">
              <div className={`w-40 h-40 rounded-full ${reactionReady ? "bg-green-500" : "bg-red-400"} shadow-xl`} />
              <button
                onClick={() => {
                  if (reactionReady) {
                    setReactionHits((prev) => prev + 1);
                    setScore((prev) => prev + 80);
                    setProgress((prev) => Math.min(prev + 8, 100));
                  } else {
                    setScore((prev) => Math.max(0, prev - 20));
                  }
                }}
                className="px-8 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-700 transition-colors"
              >
                立即按下
              </button>
              <p className="text-gray-600">成功反應次數：{reactionHits}</p>
            </div>
          )}

          {mode === "reading" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-2xl">閱讀小任務</h3>
              <p className="text-gray-700 leading-7">
                今天早上，小雨走進公園時，先看到樹上的小鳥，接著聽見風鈴聲，最後才開始下雨。
                她趕緊拿出雨傘，慢慢走回家。
              </p>
              <div className="bg-indigo-50 rounded-2xl p-4 space-y-3">
                <p>問題：小雨在什麼時候拿出雨傘？</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["bird", "rain", "wind"].map((option) => (
                    <button
                      key={option}
                      onClick={() => submitReadingAnswer(option)}
                      className="py-2 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      {option === "bird" && "看到小鳥時"}
                      {option === "rain" && "開始下雨時"}
                      {option === "wind" && "聽見風鈴時"}
                    </button>
                  ))}
                </div>
                {readAnswer && (
                  <p className={readAnswer === "rain" ? "text-green-600" : "text-red-500"}>
                    {readAnswer === "rain" ? "答對了，專注力加分！" : "再想一下，關鍵在最後一句。"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isDistracted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-30"
          style={{ boxShadow: "inset 0 0 100px 50px rgba(0,0,0,0.5)" }}
        >
          <div className="text-center space-y-5">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
              <Pause className="w-20 h-20 text-white mx-auto" />
            </motion.div>
            <h2 className="text-4xl text-white">請看回這裡</h2>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1, repeat: Infinity }}>
              <ArrowDown className="w-12 h-12 text-yellow-400 mx-auto" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {isTooClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-orange-500/80 backdrop-blur-md flex items-center justify-center z-30"
        >
          <div className="text-center space-y-6 text-white">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-8xl">
              ⚠️
            </motion.div>
            <h2 className="text-4xl">退後一點點喔</h2>
            <p className="text-xl opacity-90">保護眼睛很重要</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
