import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

const blocks = [
  { title: "前端介面", detail: "React + Vite\n角色選擇 / 登入 / 遊戲 / 報表", color: "from-blue-500 to-cyan-500" },
  { title: "眼動與行為資料", detail: "視線方向\n停留時間\n分心事件", color: "from-purple-500 to-pink-500" },
  { title: "訓練引擎", detail: "專注任務\n即時回饋\n關卡進度", color: "from-emerald-500 to-green-500" },
  { title: "家長/治療師後台", detail: "趨勢分析\n報告輸出\n訓練參數調整", color: "from-amber-500 to-orange-500" },
];

export function SystemArchitecture() {
  const navigate = useNavigate();

  return (
    <div className="size-full app-gradient-surface p-8 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回登入
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white">
          <h2 className="text-3xl mb-2">系統架構圖</h2>
          <p className="text-gray-600">從資料蒐集到訓練與報表的主要流程。</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {blocks.map((block) => (
              <div key={block.title} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                <div className={`inline-flex px-4 py-2 text-white rounded-xl bg-gradient-to-r ${block.color}`}>
                  {block.title}
                </div>
                <p className="mt-3 text-gray-600 whitespace-pre-line">{block.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/70 p-5">
            <p className="text-indigo-900">
              流程摘要：前端互動 {"->"} 蒐集專注資料 {"->"} 訓練引擎即時調整 {"->"} 後台提供趨勢分析與設定回寫。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
