import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { ensureBlueBgm } from '../utils/blueBgm';
import AppLogoMark from '../components/AppLogoMark';
const CORRECT_PIN = '1234';
const DEV_PIN = '0000';

function FloatingShape({ className, children, delay = 0 }: { className: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      className={`absolute select-none pointer-events-none ${className}`}
      animate={{ y: [0, -18, 0], rotate: [0, 10, -10, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const { setIsParentAuth, setIsDeveloperAuth } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [faceIdStep, setFaceIdStep] = useState(false);
  const [authMode, setAuthMode] = useState<'parent' | 'dev'>('parent');

  function handleChildEntry() {
    // start BGM on user gesture (browser autoplay policy)
    ensureBlueBgm();
    navigate('/child/lobby');
  }

  function handleParentEntry() {
    setShowAuthModal(true);
    setPin('');
    setPinError(false);
    setAuthMode('parent');
  }

  function handleDevEntry() {
    setShowAuthModal(true);
    setPin('');
    setPinError(false);
    setAuthMode('dev');
  }

  function handlePinDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setPinError(false);
    if (next.length === 4) {
      setTimeout(() => {
        if (authMode === 'parent') {
          if (next === CORRECT_PIN) {
            setIsParentAuth(true);
            setIsDeveloperAuth(false);
            setShowAuthModal(false);
            navigate('/parent');
            return;
          }
        } else {
          if (next === DEV_PIN) {
            setIsParentAuth(true);
            setIsDeveloperAuth(true);
            setShowAuthModal(false);
            navigate('/parent/dev');
            return;
          }
        }
        setPinError(true);
        setPin('');
      }, 300);
    }
  }

  function handleBackspace() {
    setPin(p => p.slice(0, -1));
    setPinError(false);
  }

  function handleFaceId() {
    setFaceIdStep(true);
    setTimeout(() => {
      setFaceIdStep(false);
      setIsParentAuth(true);
      setIsDeveloperAuth(false);
      setShowAuthModal(false);
      navigate('/parent');
    }, 1800);
  }

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #a8edca 0%, #c8eef8 50%, #aacff5 100%)', fontFamily: 'Nunito, sans-serif' }}
    >
      {/* Floating decorations */}
      <FloatingShape className="top-[8%] left-[6%] text-5xl opacity-40" delay={0}>⭐</FloatingShape>
      <FloatingShape className="top-[15%] right-[8%] text-4xl opacity-35" delay={1.2}>☁️</FloatingShape>
      <FloatingShape className="top-[35%] left-[3%] text-3xl opacity-30" delay={0.7}>🔵</FloatingShape>
      <FloatingShape className="bottom-[20%] left-[8%] text-4xl opacity-35" delay={1.8}>🌟</FloatingShape>
      <FloatingShape className="bottom-[12%] right-[6%] text-5xl opacity-40" delay={0.5}>☁️</FloatingShape>
      <FloatingShape className="top-[50%] right-[4%] text-3xl opacity-25" delay={2.1}>💫</FloatingShape>
      <FloatingShape className="top-[5%] left-[40%] text-2xl opacity-30" delay={1.5}>✨</FloatingShape>
      <FloatingShape className="bottom-[35%] right-[12%] text-2xl opacity-25" delay={0.3}>🟡</FloatingShape>
      <FloatingShape className="top-[28%] left-[18%] text-xl opacity-20" delay={2.5}>▲</FloatingShape>
      <FloatingShape className="bottom-[28%] left-[25%] text-xl opacity-20" delay={1.0}>●</FloatingShape>

      {/* Geometric bg circles */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-10" style={{ background: '#38d9a9' }} />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full opacity-10" style={{ background: '#4dabf7' }} />
      <div className="absolute top-[30%] right-[-40px] w-40 h-40 rounded-full opacity-10" style={{ background: '#74c0fc' }} />

      {/* Logo */}
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-center mb-3">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl border border-white/30"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)', boxShadow: '0 12px 36px rgba(13,148,136,0.35)' }}
          >
            <AppLogoMark size={52} />
          </div>
        </div>
        <h1 className="text-4xl text-slate-700" style={{ fontWeight: 900, letterSpacing: '-0.5px' }}>
          小小聚焦家
        </h1>
        <p className="text-slate-500 mt-1" style={{ fontWeight: 600, fontSize: '16px' }}>FocusQuest — 視覺專注訓練</p>
      </motion.div>

      {/* Role cards */}
      <div className="flex flex-col sm:flex-row gap-6 px-6 w-full max-w-3xl">
        {/* Child card */}
        <motion.button
          className="flex-1 rounded-3xl p-7 text-center cursor-pointer shadow-2xl border-4 border-white/60"
          style={{ background: 'linear-gradient(135deg, #ffd43b, #ff922b)' }}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(255,146,43,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleChildEntry}
        >
          <div className="text-6xl mb-3">🚀</div>
          <div className="text-2xl text-white" style={{ fontWeight: 900 }}>我是小勇士</div>
          <div className="text-white/80 mt-1" style={{ fontWeight: 700, fontSize: '14px' }}>開始訓練</div>
          <div className="mt-4 bg-white/30 rounded-2xl py-2 px-4 inline-block text-white" style={{ fontWeight: 700, fontSize: '13px' }}>
            ▶ 進入
          </div>
        </motion.button>

        {/* Parent/OT card */}
        <motion.button
          className="flex-1 rounded-3xl p-7 text-center cursor-pointer shadow-2xl border-4 border-white/60"
          style={{ background: 'linear-gradient(135deg, #4dabf7, #5c7cfa)' }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(92,124,250,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleParentEntry}
        >
          <div className="text-6xl mb-3">📊</div>
          <div className="text-2xl text-white" style={{ fontWeight: 900 }}>家長 / 治療師</div>
          <div className="text-white/80 mt-1" style={{ fontWeight: 700, fontSize: '14px' }}>看數據</div>
          <div className="mt-4 bg-white/30 rounded-2xl py-2 px-4 inline-block text-white" style={{ fontWeight: 700, fontSize: '13px' }}>
            🔒 登入
          </div>
        </motion.button>

        {/* Developer card */}
        <motion.button
          className="flex-1 rounded-3xl p-7 text-center cursor-pointer shadow-2xl border-4 border-white/60"
          style={{ background: 'linear-gradient(135deg, #0f172a, #334155)' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(15,23,42,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDevEntry}
        >
          <div className="text-6xl mb-3">💻</div>
          <div className="text-2xl text-white" style={{ fontWeight: 900 }}>開發者</div>
          <div className="text-white/80 mt-1" style={{ fontWeight: 700, fontSize: '14px' }}>架構圖 / 變更紀錄</div>
          <div className="mt-4 bg-white/15 rounded-2xl py-2 px-4 inline-block text-white" style={{ fontWeight: 700, fontSize: '13px' }}>
            🔒 進入通道
          </div>
        </motion.button>
      </div>

      {/* Bottom info */}
      <motion.div
        className="absolute bottom-6 text-center text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontWeight: 600, fontSize: '12px' }}
      >
        <span>v1.0.3</span>
        <span className="mx-2">·</span>
        <a href="#" className="underline">隱私權政策</a>
      </motion.div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(15,23,42,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/20"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(40px)', fontFamily: 'Nunito, sans-serif' }}
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {faceIdStep ? (
                <div className="text-center py-6">
                  <motion.div
                    className="text-7xl mb-4"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    🔐
                  </motion.div>
                  <div className="text-white" style={{ fontWeight: 800, fontSize: '20px' }}>臉部識別中...</div>
                  <div className="text-white/60 mt-2" style={{ fontWeight: 600, fontSize: '14px' }}>請看向螢幕</div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔐</div>
                    <h2 className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>
                      {authMode === 'dev' ? '開發者驗證' : '身分驗證'}
                    </h2>
                    <p className="text-white/70 mt-1" style={{ fontWeight: 600, fontSize: '13px' }}>請輸入 4 位數密碼</p>
                  </div>

                  {/* Biometric button */}
                  <button
                    className="w-full mb-5 py-3 rounded-2xl flex items-center justify-center gap-2 border border-white/30 text-white transition-all hover:bg-white/20"
                    style={{ fontWeight: 700, fontSize: '14px', background: 'rgba(255,255,255,0.1)' }}
                    onClick={handleFaceId}
                  >
                    <span className="text-xl">👤</span> Face ID / Touch ID
                  </button>

                  <div className="text-center text-white/40 mb-5" style={{ fontWeight: 600, fontSize: '12px' }}>— 或 輸入密碼 —</div>

                  {/* PIN dots */}
                  <div className="flex justify-center gap-4 mb-6">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: pinError ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
                          background: i < pin.length ? (pinError ? '#ff6b6b' : '#fff') : 'transparent',
                        }}
                        animate={pinError ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <p className="text-center text-red-300 mb-4" style={{ fontWeight: 700, fontSize: '13px' }}>
                      密碼錯誤，請重試（提示：{authMode === 'dev' ? '0000' : '1234'}）
                    </p>
                  )}

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {['1','2','3','4','5','6','7','8','9','*','0','⌫'].map((key) => (
                      <button
                        key={key}
                        className="py-4 rounded-2xl text-white transition-all active:scale-95"
                        style={{
                          fontWeight: 800,
                          fontSize: key === '⌫' ? '20px' : '22px',
                          background: key === '⌫' ? 'rgba(255,100,100,0.25)' : 'rgba(255,255,255,0.15)',
                        }}
                        onClick={() => key === '⌫' ? handleBackspace() : key !== '*' ? handlePinDigit(key) : null}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <button
                    className="w-full py-3 rounded-2xl text-white/60 transition-all hover:text-white"
                    style={{ fontWeight: 700, fontSize: '14px' }}
                    onClick={() => setShowAuthModal(false)}
                  >
                    取消
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}