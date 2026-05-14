import { useNavigate } from 'react-router';
import { Settings } from 'lucide-react';

type Props = {
  className?: string;
  title?: string;
  /** 只顯示圖示；false 時顯示「設定」文字 */
  iconOnly?: boolean;
};

/** 兒童端各頁共用的「我的小設定」捷徑 */
export default function ChildSettingsButton({
  className = '',
  title = '開啟我的小設定（音量與環境音）',
  iconOnly = true,
}: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      aria-label={title}
      title={title}
      onClick={() => navigate('/child/settings')}
      className={`inline-flex items-center justify-center gap-1.5 rounded-2xl text-white shadow-lg transition-transform active:scale-95 shrink-0 border border-white/25 ${iconOnly ? 'w-11 h-11 sm:w-12 sm:h-12' : 'px-4 py-2.5'} ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Settings className={iconOnly ? 'w-[22px] h-[22px] sm:w-6 sm:h-6' : 'w-5 h-5'} strokeWidth={2.25} aria-hidden />
      {!iconOnly ? <span style={{ fontWeight: 900, fontSize: '14px' }}>設定</span> : null}
    </button>
  );
}
