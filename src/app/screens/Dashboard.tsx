import { useState } from "react";
import { useNavigate } from "react-router";
import { BarChart3, Clock, Eye, TrendingUp, FileText, Settings, Home, LogOut } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { date: "4/24", score: 65 },
  { date: "4/25", score: 72 },
  { date: "4/26", score: 68 },
  { date: "4/27", score: 78 },
  { date: "4/28", score: 82 },
  { date: "4/29", score: 85 },
  { date: "4/30", score: 88 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState("小明");

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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-600"
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
            <div>
              <h2 className="text-3xl">歡迎回來！</h2>
              <p className="text-gray-500 mt-1">以下是訓練摘要</p>
            </div>
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>小明</option>
              <option>小華</option>
              <option>小美</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">本週訓練時長</p>
                  <p className="text-2xl mt-1">42 分鐘</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">平均專注維持</p>
                  <p className="text-2xl mt-1">18.5 秒</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">分心偏移次數</p>
                  <p className="text-2xl mt-1">23 次</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl mb-6">近 7 天專注力趨勢</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">最新遊戲報告</h3>
              <button
                onClick={() => navigate("/analytics")}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FileText className="w-5 h-5" />
                查看完整報告
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">遊戲時長</p>
                <p className="text-lg mt-1">8 分 32 秒</p>
              </div>
              <div>
                <p className="text-gray-500">專注得分</p>
                <p className="text-lg mt-1">88 / 100</p>
              </div>
              <div>
                <p className="text-gray-500">完成關卡</p>
                <p className="text-lg mt-1">第 5 關</p>
              </div>
              <div>
                <p className="text-gray-500">獲得星星</p>
                <p className="text-lg mt-1">⭐ ⭐ ⭐</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
