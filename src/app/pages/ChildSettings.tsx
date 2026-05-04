import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Volume2 } from 'lucide-react';
import PatientAmbientSettingsPanel from '../components/PatientAmbientSettingsPanel';
import { loadPatientAmbient, type PatientAmbientConfig } from '../utils/blueBgm';
import { useState, useEffect } from 'react';

/** 僅在進入兒童端（星圖大廳）後可達；含音量／環境低音等 */
export default function ChildSettings() {
  const navigate = useNavigate();
  const [ambientPreview, setAmbientPreview] = useState<PatientAmbientConfig>(() => loadPatientAmbient());

  useEffect(() => {
    setAmbientPreview(loadPatientAmbient());
  }, []);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        fontFamily: 'Nunito, sans-serif',
        background: 'linear-gradient(165deg, #0f172a 0%, #1e293b 45%, #0c4a6e 100%)',
      }}
    >
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10"
        style={{ backdropFilter: 'blur(12px)', background: 'rgba(15,23,42,0.75)' }}
      >
        <motion.button
          type="button"
          onClick={() => navigate('/child/lobby')}
          className="flex items-center gap-2 pl-1 pr-3 py-2 rounded-full text-white shadow-lg active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))',
            border: '2px solid rgba(255,255,255,0.28)',
            fontWeight: 900,
            fontSize: '15px',
          }}
        >
          <span className="flex items-center justify-center rounded-full w-9 h-9 bg-white/10 border border-white/25">
            <ChevronLeft className="w-6 h-6 text-white -ml-0.5" strokeWidth={3} aria-hidden />
          </span>
          回星圖
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="text-white flex items-center gap-2" style={{ fontWeight: 900, fontSize: '18px' }}>
            <Volume2 className="w-5 h-5 text-cyan-300 shrink-0" strokeWidth={2.2} aria-hidden />
            兒童端設定
          </div>
          <p className="text-sky-200/80 mt-0.5" style={{ fontWeight: 600, fontSize: '12px' }}>
            背景聲與試聽：僅影響星圖與遊玩時的環境音
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-12">
        <PatientAmbientSettingsPanel onConfigChange={setAmbientPreview} />
        <p className="mt-6 text-center text-sky-200/70" style={{ fontWeight: 600, fontSize: '12px' }}>
          {ambientPreview.enabled ? `主音量約 ${Math.round(ambientPreview.volume)}%` : '背景音未啟用'}
        </p>
      </main>
    </div>
  );
}
