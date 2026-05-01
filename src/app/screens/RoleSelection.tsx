import React from "react";
import { useNavigate } from "react-router";
import { Smile, Settings } from "lucide-react";

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center">
            <Smile className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl">專注力訓練小幫手</h1>
          <p className="text-gray-600">請選擇你的身份</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/child")}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-4 border-transparent hover:border-yellow-400"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-400 to-orange-400 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Smile className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl text-center">我是小勇士</h2>
              <p className="text-gray-500 text-center text-sm">開始遊戲冒險</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/auth")}
            className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-4 border-transparent hover:border-blue-400"
          >
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl text-center">家長 / 治療師</h2>
              <p className="text-gray-500 text-center text-sm">查看數據與設定</p>
            </div>
          </button>
        </div>

        <div className="text-center text-sm text-gray-400 space-y-1">
          <p>版本 1.0.0</p>
          <a href="#" className="hover:text-gray-600 transition-colors">隱私權政策</a>
        </div>
      </div>
    </div>
  );
}
