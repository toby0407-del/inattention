import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

const calibrationPoints = [
  { x: 50, y: 50, label: "中央" },
  { x: 10, y: 10, label: "左上" },
  { x: 90, y: 10, label: "右上" },
  { x: 10, y: 90, label: "左下" },
  { x: 90, y: 90, label: "右下" },
];

export function Calibration() {
  const navigate = useNavigate();
  const [currentPoint, setCurrentPoint] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (currentPoint >= calibrationPoints.length) {
      setTimeout(() => navigate("/game"), 1000);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setCurrentPoint((curr) => curr + 1);
            setProgress(0);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(progressInterval);
  }, [currentPoint, navigate]);

  if (currentPoint >= calibrationPoints.length) {
    return (
      <div className="size-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto" />
          </motion.div>
          <h2 className="text-3xl text-white">校正完成！</h2>
        </motion.div>
      </div>
    );
  }

  const point = calibrationPoints[currentPoint];

  return (
    <div className="size-full bg-gradient-to-br from-purple-900 to-blue-900 relative overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white text-center space-y-2">
        <p className="text-xl">請盯著星星看</p>
        <p className="text-sm opacity-80">{currentPoint + 1} / {calibrationPoints.length}</p>
      </div>

      <motion.div
        key={currentPoint}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-16 h-16"
          >
            <Sparkles className="w-full h-full text-yellow-400 fill-yellow-400" />
          </motion.div>

          <svg className="absolute inset-0 -m-2" width="80" height="80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              transform="rotate(-90 40 40)"
              className="transition-all duration-100"
            />
          </svg>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10">
        <div
          className="h-full bg-yellow-400 transition-all duration-100"
          style={{ width: `${((currentPoint * 100 + progress) / calibrationPoints.length) / 100 * 100}%` }}
        ></div>
      </div>
    </div>
  );
}
