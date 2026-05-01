import { useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Home, Settings, LogOut, Download, Calendar } from "lucide-react";

const eyeMetrics = [
  { label: "平均視線停留", value: "2.4 秒", trend: "+0.3 秒" },
  { label: "注意力切換次數", value: "18 次", trend: "-4 次" },
  { label: "有效專注比例", value: "76%", trend: "+8%" },
  { label: "分心事件", value: "6 次", trend: "-2 次" },
  { label: "視線回正反應", value: "1.2 秒", trend: "-0.4 秒" },
  { label: "注視穩定度", value: "83 / 100", trend: "+6" },
];

const trajectoryPoints = [
  { x: 18, y: 22 },
  { x: 32, y: 28 },
  { x: 46, y: 38 },
  { x: 58, y: 33 },
  { x: 70, y: 48 },
  { x: 62, y: 60 },
  { x: 44, y: 58 },
  { x: 30, y: 68 },
  { x: 22, y: 52 },
];

export function Analytics() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("2026-04-30");

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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600"
          >
            <BarChart3 className="w-5 h-5" />
            分析報告
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-700"
          >
            <Settings className="w-5 h-5" />
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
        <div className="max-w-6xl space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl">專注力分析報告</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="focus:outline-none"
                />
              </div>
              <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                <Download className="w-5 h-5" />
                匯出 PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl mb-4">專注力熱點圖</h3>
            <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-gray-500">遊戲畫面截圖</p>
                  <p className="text-sm text-gray-400">紅色區域表示視線停留最久的位置</p>
                </div>
              </div>
              <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-red-500/30 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-yellow-500/30 rounded-full blur-2xl"></div>
              <div className="absolute bottom-1/4 left-1/2 w-20 h-20 bg-green-500/30 rounded-full blur-xl"></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div>
              <h3 className="text-xl">眼動與行為資料（進階分析）</h3>
              <p className="text-sm text-gray-500 mt-1">包含運作軌跡、視線方向變化、停留時間與分心事件趨勢。</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                <p className="text-sm text-gray-500 mb-3">視線運作軌跡（本次訓練）</p>
                <svg viewBox="0 0 100 80" className="w-full h-52 rounded-lg bg-white border border-slate-100">
                  <defs>
                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#trackGradient)"
                    strokeWidth="2.5"
                    points={trajectoryPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {trajectoryPoints.map((point, idx) => (
                    <g key={`${point.x}-${point.y}`}>
                      <circle cx={point.x} cy={point.y} r={idx === trajectoryPoints.length - 1 ? 2.6 : 1.8} fill={idx === trajectoryPoints.length - 1 ? "#0f172a" : "#6366f1"} />
                      {idx === 0 && <text x={point.x + 2} y={point.y - 2} fontSize="3" fill="#334155">開始</text>}
                      {idx === trajectoryPoints.length - 1 && <text x={point.x + 2} y={point.y - 2} fontSize="3" fill="#0f172a">目前</text>}
                    </g>
                  ))}
                </svg>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-500 mb-3">核心分析數據</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {eyeMetrics.map((item) => (
                    <div key={item.label} className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-lg mt-1">{item.value}</p>
                      <p className="text-xs text-emerald-600 mt-1">{item.trend}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl mb-6">詳細數據分析</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">基準線對比</span>
                <span className="text-green-600">+12% 進步</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">視覺干擾物停留時間</span>
                <span>3.2 秒</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">聽覺干擾物停留時間</span>
                <span>2.8 秒</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">強制暫停次數</span>
                <span>5 次</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">平均專注維持時長</span>
                <span>22.5 秒</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">遊戲完成度</span>
                <span className="text-blue-600">100%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
