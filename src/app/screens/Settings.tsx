import { useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Home, Settings as SettingsIcon, LogOut, RotateCcw } from "lucide-react";

export function Settings() {
  const navigate = useNavigate();
  const [distanceAlert, setDistanceAlert] = useState(true);
  const [tolerance, setTolerance] = useState(1.5);
  const [distraction, setDistraction] = useState("medium");

  return (
    <div className="size-full flex app-gradient-surface">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-xl">控制台</h1>
          <p className="text-sm text-gray-500">家長 / 治療師</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
          >
            <Home className="w-5 h-5" />
            首頁
          </button>
          <button
            onClick={() => navigate("/analytics")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
          >
            <BarChart3 className="w-5 h-5" />
            分析報告
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600"
          >
            <SettingsIcon className="w-5 h-5" />
            訓練設定
          </button>
        </nav>

        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-500 absolute bottom-6"
        >
          <LogOut className="w-5 h-5" />
          登出
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl space-y-8">
          <h2 className="text-3xl">訓練設定</h2>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg">視距安全鎖</h3>
                <p className="text-sm text-gray-500 mt-1">當孩子過度靠近螢幕時提醒</p>
              </div>
              <button
                onClick={() => setDistanceAlert(!distanceAlert)}
                className={`w-14 h-8 rounded-full transition-colors ${
                  distanceAlert ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    distanceAlert ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg">容忍度設定</h3>
                  <span className="text-blue-600">{tolerance} 秒</span>
                </div>
                <p className="text-sm text-gray-500">視線離開目標多久後觸發暫停</p>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0.5 秒</span>
                  <span>3.0 秒</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="space-y-4">
                <h3 className="text-lg">干擾物強度</h3>
                <p className="text-sm text-gray-500 mb-4">設定遊戲中的干擾程度</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDistraction("low")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      distraction === "low"
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    低 (無干擾)
                  </button>
                  <button
                    onClick={() => setDistraction("medium")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      distraction === "medium"
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    中 (視覺)
                  </button>
                  <button
                    onClick={() => setDistraction("high")}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      distraction === "high"
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    高 (視覺+聽覺)
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <button className="w-full flex items-center justify-center gap-3 py-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <RotateCcw className="w-5 h-5" />
                重新校正眼動追蹤
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                下次進入遊戲時會自動進行校正流程
              </p>
            </div>
          </div>

          <button className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            儲存設定
          </button>
        </div>
      </main>
    </div>
  );
}
