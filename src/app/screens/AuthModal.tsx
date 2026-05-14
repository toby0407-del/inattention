import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Fingerprint, Lock, ArrowLeft, Network } from "lucide-react";

export function AuthModal() {
  const navigate = useNavigate();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin];
      newPin[index] = value;
      setPin(newPin);
      setError(false);

      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        nextInput?.focus();
      }

      if (newPin.every(digit => digit !== "") && newPin.join("") === "1234") {
        setTimeout(() => navigate("/dashboard"), 300);
      } else if (newPin.every(digit => digit !== "")) {
        setError(true);
        setTimeout(() => setPin(["", "", "", ""]), 1000);
      }
    }
  };

  const handleBiometric = () => {
    setTimeout(() => navigate("/dashboard"), 500);
  };

  return (
    <div className="size-full relative flex items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-purple-100 p-8 overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-blue-300/45 to-cyan-200/30 blur-3xl"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-purple-300/40 to-pink-200/25 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-200/35 to-sky-100/25 blur-2xl"></div>

      <div className="max-w-md w-full relative z-10">
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-white rounded-3xl p-8 shadow-xl space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl">身份驗證</h2>
            <p className="text-gray-500 text-sm">請使用生物辨識或密碼解鎖</p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleBiometric}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl flex items-center justify-center gap-3 hover:shadow-lg transition-all"
            >
              <Fingerprint className="w-6 h-6" />
              使用 Face ID / Touch ID
            </button>

            <button
              onClick={() => navigate("/architecture")}
              className="w-full py-3 bg-white border border-blue-200 text-blue-700 rounded-2xl flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors"
            >
              <Network className="w-5 h-5" />
              查看系統架構圖
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">或輸入密碼</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  className={`w-14 h-14 text-center text-2xl border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    error ? "border-red-500 bg-red-50" : "border-gray-300"
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-red-500 text-sm">密碼錯誤，請重試</p>
            )}

            <p className="text-center text-xs text-gray-400">
              預設密碼：1234
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
