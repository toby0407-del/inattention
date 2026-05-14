import { useNavigate } from "react-router";
import { Star, Lock, Sparkles, Trophy } from "lucide-react";

const levels = [
  { id: 1, unlocked: true, completed: true, stars: 3, x: 20, y: 70 },
  { id: 2, unlocked: true, completed: true, stars: 3, x: 35, y: 55 },
  { id: 3, unlocked: true, completed: true, stars: 2, x: 50, y: 60 },
  { id: 4, unlocked: true, completed: true, stars: 3, x: 65, y: 45 },
  { id: 5, unlocked: true, completed: false, stars: 0, x: 80, y: 50 },
  { id: 6, unlocked: false, completed: false, stars: 0, x: 90, y: 30 },
];

export function ChildHome() {
  const navigate = useNavigate();
  const totalStars = levels.reduce((sum, level) => sum + level.stars, 0);

  const handleLevelClick = (level: typeof levels[0]) => {
    if (level.unlocked) {
      navigate("/calibration");
    }
  };

  return (
    <div className="size-full bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 relative overflow-hidden">
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
          <span className="text-2xl">{totalStars}</span>
        </div>

        <button
          onClick={() => navigate("/")}
          className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg hover:bg-white transition-colors"
        >
          返回
        </button>
      </div>

      <div className="absolute inset-0">
        <svg className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {levels.slice(0, -1).map((level, index) => {
            const nextLevel = levels[index + 1];
            return (
              <path
                key={`path-${level.id}`}
                d={`M ${level.x} ${level.y} Q ${(level.x + nextLevel.x) / 2} ${(level.y + nextLevel.y) / 2 - 5} ${nextLevel.x} ${nextLevel.y}`}
                fill="none"
                stroke={level.completed ? "#fbbf24" : "#cbd5e1"}
                strokeWidth="0.5"
                strokeDasharray={level.completed ? "none" : "1 1"}
              />
            );
          })}
        </svg>
      </div>

      <div className="absolute inset-0">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => handleLevelClick(level)}
            disabled={!level.unlocked}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 disabled:hover:scale-100"
            style={{ left: `${level.x}%`, top: `${level.y}%` }}
          >
            <div className={`relative ${!level.unlocked && "opacity-50"}`}>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                  level.unlocked && !level.completed
                    ? "bg-gradient-to-br from-yellow-300 to-orange-400 animate-pulse shadow-yellow-400/50"
                    : level.completed
                    ? "bg-gradient-to-br from-green-400 to-blue-500"
                    : "bg-gray-400"
                }`}
              >
                {level.unlocked ? (
                  <span className="text-3xl text-white">{level.id}</span>
                ) : (
                  <Lock className="w-8 h-8 text-white" />
                )}
              </div>

              {level.unlocked && !level.completed && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}

              {level.stars > 0 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {Array.from({ length: level.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => {}}
        className="absolute bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Trophy className="w-8 h-8 text-white" />
      </button>

      <div className="absolute top-1/4 left-10 w-16 h-16 bg-white/30 rounded-full blur-xl"></div>
      <div className="absolute bottom-1/3 right-20 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
    </div>
  );
}
