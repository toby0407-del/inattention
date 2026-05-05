import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CHAPTERS,
  themeBackground,
  getChapterForLevel,
  mapLayoutCoords,
  constellationEdgesFor,
  isChapterComplete,
  type LevelMeta,
} from '../data/levels';
import { ensureBlueBgm } from '../utils/blueBgm';
import { ChevronLeft, Settings } from 'lucide-react';
import ConstellationGlobe from '../components/ConstellationGlobe';
import ZodiacRingChart from '../components/ZodiacRingChart';
import StarfieldCanvas from '../components/StarfieldCanvas';

type MapLevel = LevelMeta & { x: number; y: number; stars: number };

/** 將星點％座標群平移到畫布正中（bounding box 中心對齊 50%,50%，並略為收邊避免裁切） */
function centerPercentCoords(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length === 0) return points;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const dx = 50 - cx;
  const dy = 50 - cy;
  const clamp = (v: number) => Math.min(92, Math.max(8, v));
  return points.map(p => ({
    x: clamp(p.x + dx),
    y: clamp(p.y + dy),
  }));
}

function StarCount({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} style={{ fontSize: '14px', opacity: i < count ? 1 : 0.3 }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export default function QuestMap() {
  const navigate = useNavigate();
  const { totalStars, completedLevels, currentLevel, collectedLevelIds } = useApp();
  const [chapterIndex, setChapterIndex] = useState(0);
  const [showStickerBook, setShowStickerBook] = useState(false);
  /** 圖鑑全螢幕（含可選瀏覽器全螢幕 API） */
  const [stickerBookFullscreen, setStickerBookFullscreen] = useState(false);
  const stickerPanelRef = useRef<HTMLDivElement>(null);
  const [selectedLevel, setSelectedLevel] = useState<MapLevel | null>(null);
  /** null | meaning：僅「？」打開星座寓意（點星座名稱不會開彈窗） */
  const [chapterTipMode, setChapterTipMode] = useState<null | 'meaning'>(null);

  useEffect(() => {
    ensureBlueBgm();
  }, []);

  /** 進入地圖時，自動切到「目前主線關卡」所在章節 */
  useEffect(() => {
    const ch = getChapterForLevel(currentLevel);
    if (!ch) return;
    const idx = CHAPTERS.findIndex(c => c.id === ch.id);
    if (idx >= 0) setChapterIndex(idx);
  }, [currentLevel]);

  const chapter = CHAPTERS[chapterIndex] ?? CHAPTERS[0];
  const chapterComplete = isChapterComplete(chapter, completedLevels);

  const LEVELS: MapLevel[] = useMemo(() => {
    const raw = mapLayoutCoords(chapter);
    const base = chapter.levels.map((l, i) => ({
      x: raw[i]?.x ?? 50,
      y: raw[i]?.y ?? 50,
    }));
    const centered = centerPercentCoords(base);
    return chapter.levels.map((l, i) => ({
      ...l,
      x: centered[i]?.x ?? 50,
      y: centered[i]?.y ?? 50,
      stars: 3,
    }));
  }, [chapter]);

  /** 星象示意連線（去重）；與「主線關卡順序」無關—只為畫出星座形狀 */
  const asterismEdges = useMemo(() => {
    const raw = constellationEdgesFor(chapter);
    const seen = new Set<string>();
    return raw.filter(([a, b]) => {
      const i = Math.min(a, b);
      const j = Math.max(a, b);
      const key = `${i}-${j}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [chapter]);

  const bg = useMemo(() => {
    const mode = chapter.levels[0]?.mode ?? 'spot';
    return themeBackground(chapter.mapTheme, mode);
  }, [chapter]);

  function handleLevelClick(level: MapLevel) {
    if (level.id > currentLevel) return;
    setSelectedLevel(level);
  }

  function handleStart() {
    if (!selectedLevel) return;
    navigate(`/child/play?mode=${selectedLevel.mode}&level=${selectedLevel.id}`);
    setSelectedLevel(null);
  }

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setStickerBookFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  function closeStickerBook() {
    setShowStickerBook(false);
    setStickerBookFullscreen(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }

  async function toggleStickerFullscreen() {
    if (!stickerBookFullscreen) {
      setStickerBookFullscreen(true);
      requestAnimationFrame(() => {
        stickerPanelRef.current?.requestFullscreen().catch(() => {});
      });
    } else {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          /* ignore */
        }
      }
      setStickerBookFullscreen(false);
    }
  }

  const canPrevChapter = chapterIndex > 0;
  const canNextChapter = chapterIndex < CHAPTERS.length - 1;

  const chapterDoneCount = chapter.levels.filter(
    l => collectedLevelIds.includes(l.id) || completedLevels.includes(l.id),
  ).length;

  const headerZodiac = chapter.levels[0]?.zodiac;

  /** 問號／星座卡：共通說明用「星座寓意」（任取本章有填之關卡） */
  const constellationMeaning = useMemo(() => {
    const direct = chapter.levels[0]?.zodiac?.meaning?.trim();
    if (direct) return direct;
    const fromLevel = chapter.levels.map(l => l.zodiac?.meaning?.trim()).find(Boolean);
    return fromLevel ?? '';
  }, [chapter]);

  const MEANING_FALLBACKS = useMemo(
    () => [
      '這一章的星座寓意我們正在整理中。你可以先觀察星座符號、主星連線與故事線索，完成後再回來看看更新。',
      '星座寓意會在後續補上；先試著用「像什麼」來描述星圖，再把你的想法帶進遊戲故事裡。',
      '暫時沒有寓意文字，但你的想像力很重要：這個星座讓你想到什麼情緒、什麼顏色、什麼場景呢？',
      '寓意文字準備中。先用一個詞形容它：勇敢、溫柔、好奇、堅持、冷靜、熱情……都可以。',
      '我們正在把寓意寫得更好讀、更適合孩子。先跟著主線關卡玩，結束後再回來讀會更有感。',
      '星座寓意還沒上線。先看看星圖的形狀：像動物？像工具？像一個動作？把它說出來就很棒。',
      '寓意將在教學內容更新。你也可以先幫它取一個小名字，讓這個星座變成「你的版本」。',
      '此星座的寓意正在校對中；先留意每關的小任務，它們其實已經在暗示這個星座的特質。',
      '我們想把寓意寫得更有故事感，所以先暫缺。你可以先完成主星收集，之後會更完整。',
      '寓意待補。試著想像：如果它是一位朋友，它會怎麼安慰你、怎麼鼓勵你？',
      '星座寓意正在補充；先用一句話描述它給你的感覺，例如「像夜空裡的守護」或「像勇氣的指路燈」。',
      '寓意文字還在準備。你可以先把它當作一個「線索」，等完成這章再來解鎖更完整的解釋。',
      '暫無寓意。先觀察主星的排列：有沒有「往前走」「聚在一起」「左右對稱」的感覺？',
      '寓意稍後補上。你可以先做一件小事：深呼吸，選一顆星當作今天的幸運星。',
      '我們正在把寓意寫得更精準。先完成關卡，等你回來時它會更清楚、更好理解。',
      '寓意準備中。先用「它像什麼」開始，然後用「它提醒我」結束，寫成你自己的寓意句。',
      '星座寓意稍後更新。先跟著關卡節奏走，很多提示會在遊戲裡慢慢出現。',
      '這章的寓意文字正在整理。你可以先用三個字形容：例如「不放棄」「很溫暖」「很機智」。',
      '寓意內容待補。先把注意力放在星星連線上：每一次完成都是在把故事拼完整。',
      '暫時沒有寓意，但這不影響遊玩。你可以先把它當作「今天的天空任務」。',
      '寓意將於後續補上。先選一個你喜歡的詞，讓它成為這個星座的代表：例如「守護」「自信」「耐心」。',
      '星座寓意正在更新中。你也可以先猜猜看：這個章節的故事想教你什麼？',
      '寓意文字稍後提供。先看看星座符號，跟著它做一次「專注練習」：看著它 3 秒，然後開始挑戰。',
      '寓意待補。你可以先把這個星座想成一個超能力：它會幫你在困難時做什麼？',
      '我們正在補上更完整的寓意（會包含簡短版與故事版）。現在先玩關卡，之後再回來閱讀。',
      '暫缺寓意。你可以先用一個「顏色」形容它：金色、藍色、紫色、白色……',
      '寓意尚未上線。先記住一件事：你完成的每一顆主星，都會讓這張星圖更亮。',
      '寓意內容準備中。先跟著任務做，你會發現這個星座其實在提醒你一種能力。',
      '此處的寓意我們會更新成更貼近孩子的版本；先玩完再回來看，會更有共鳴。',
      '暫無寓意。你可以先用「我覺得它很……」開頭，說出你的感覺，就是最好的寓意。',
      '寓意正在補齊。你也可以先把它當作一個小謎題：完成關卡後，你就更接近答案。',
      '星座寓意稍後更新。先把星圖看成一條路：每個主星都是一個小目標。',
      '我們正在把文字寫得更簡潔、更有畫面感。現在先開始挑戰吧。',
      '寓意待補。先為自己加油：你願意嘗試，就已經很勇敢了。',
      '暫缺寓意文字。先完成這章節的收集，之後會解鎖更完整的故事與說明。',
      '寓意準備中。你可以先想一個「提醒」：當你看到這個星座，就提醒自己要做一件好事。',
      '寓意稍後補上。先把這個星座當作「心情符號」，看看它今天跟你的心情像不像。',
      '星座寓意更新中。先玩關卡，你會從任務裡找到它的性格。',
      '暫無寓意。你可以先說出：它像什麼、它在哪裡、它想告訴你什麼——三句就完成一個寓意。',
    ],
    [],
  );

  const meaningFallback = useMemo(() => {
    const i = Math.abs((chapter.id * 7 + chapterIndex * 3) % MEANING_FALLBACKS.length);
    return MEANING_FALLBACKS[i] ?? '星座寓意準備中。';
  }, [MEANING_FALLBACKS, chapter.id, chapterIndex]);

  const constellationLabel = headerZodiac ? `${headerZodiac.glyph} ${headerZodiac.nameZh}` : chapter.title;

  function openChapterMeaningTip() {
    setChapterTipMode('meaning');
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ fontFamily: 'Nunito, sans-serif', background: bg }}
    >
      {/* 黃道星區：星座名＋日期框（章節切換鈕在螢幕左下／右下） */}
      <div className="absolute left-0 right-0 z-20 flex flex-col items-center px-4 pt-[5.25rem] pb-2 max-w-lg mx-auto w-full gap-2.5">
        <div className="flex items-start justify-center gap-2 w-full px-1">
          <div
            className="flex-1 min-w-0 rounded-2xl px-3.5 py-2.5 text-center"
            style={{
              background: 'rgba(15,23,42,0.45)',
              backdropFilter: 'blur(12px)',
              border: '2px solid rgba(255,255,255,0.42)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
            title="星座名稱與太陽星座日期（僅顯示）"
            aria-label={`${constellationLabel}：名稱與日期（僅顯示）`}
          >
            <div
              className="text-white leading-snug"
              style={{ fontWeight: 900, fontSize: '20px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <span className="min-w-0 truncate">{constellationLabel}</span>
                <button
                  type="button"
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white/95 active:scale-[0.96] transition-transform"
                  style={{
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.32)',
                    boxShadow: '0 6px 14px rgba(15,23,42,0.28)',
                    pointerEvents: 'auto',
                    fontWeight: 950,
                    fontSize: '14px',
                    lineHeight: 1,
                  }}
                  title="查看星座寓意"
                  aria-label="查看星座寓意"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    openChapterMeaningTip();
                  }}
                >
                  ?
                </button>
              </span>
            </div>
            {headerZodiac?.approxSunDates ? (
              <div
                className="mt-1 text-amber-100/95 tabular-nums"
                style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
              >
                太陽星座約 {headerZodiac.approxSunDates.replace(/^約\s*/, '')}
              </div>
            ) : null}
            <div className="mt-1.5 text-white/65" style={{ fontWeight: 700, fontSize: '11px' }}>
              名稱與日期如下 · 點「？」可看寓意
            </div>
          </div>
        </div>
        <div className="text-white/80 text-center w-full pointer-events-none px-1" style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.35 }}>
          {chapter.subtitle}
        </div>
      </div>

      <button
        type="button"
        disabled={!canPrevChapter}
        onClick={() => canPrevChapter && setChapterIndex(chapterIndex - 1)}
        className="absolute z-40 left-4 bottom-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: '2px solid rgba(255,255,255,0.3)',
          fontSize: '26px',
          fontWeight: 900,
        }}
        aria-label="上一星座星圖"
        title="上一星座星圖"
      >
        ◀
      </button>
      <button
        type="button"
        disabled={!canNextChapter}
        onClick={() => canNextChapter && setChapterIndex(chapterIndex + 1)}
        className="absolute z-40 right-4 bottom-6 w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.18)',
          border: '2px solid rgba(255,255,255,0.3)',
          fontSize: '26px',
          fontWeight: 900,
        }}
        aria-label="下一星座星圖"
        title="下一星座星圖"
      >
        ▶
      </button>

      {/* 全頁星海（背景層，滿版散布；canvas 一次性繪製，避免卡頓） */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <StarfieldCanvas seed={chapter.id} opacity={1} uniform={1} />
      </div>

      {chapter.id <= 4 && (
        <div className="absolute top-[7.25rem] right-[5.75rem] w-10 h-10 rounded-full z-[6] opacity-80" style={{ background: '#fef3c7', boxShadow: '0 0 22px rgba(254,243,199,0.45)' }} />
      )}
      {(chapter.id >= 9 || chapter.mapTheme === 'finale') && (
        <div className="absolute top-[8rem] right-20 text-4xl opacity-20 z-[6] select-none pointer-events-none">✨</div>
      )}

      {(chapter.id < 5 || chapter.id > 8) &&
        [{ x: 8, y: 15 }, { x: 40, y: 10 }, { x: 72, y: 18 }].map((c, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute text-5xl opacity-35 select-none z-[6]"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            animate={{ x: [0, 20, 0] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ☁️
          </motion.div>
        ))}

      <div
        className="absolute top-0 left-0 right-0 z-[45] flex items-start justify-between px-4 pt-3 pb-3 sm:px-6 sm:pt-4 gap-3"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 70%, transparent 100%)' }}
      >
        <motion.button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 pl-1.5 pr-3 sm:pr-4 py-2 rounded-full text-white shadow-lg active:scale-[0.97] transition-transform border-2 shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))',
            borderColor: 'rgba(255,255,255,0.38)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
          whileTap={{ x: -2 }}
          title="回到上一頁"
          aria-label="返回上一頁"
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            <ChevronLeft strokeWidth={3} className="w-6 h-6 text-white shrink-0 -ml-0.5" aria-hidden />
          </span>
          <span style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '0.04em' }}>返回</span>
        </motion.button>

        <div className="flex items-start gap-2 shrink-0">
        <motion.button
          type="button"
          onClick={() => navigate('/child/settings')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-white shadow-md active:scale-[0.97] transition-transform border"
          style={{
            background: 'linear-gradient(135deg, rgba(13,148,136,0.55), rgba(8,145,178,0.45))',
            borderColor: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(10px)',
          }}
          title="兒童端設定：背景聲與試聽"
          aria-label="開啟兒童端設定"
        >
          <Settings className="w-5 h-5 text-white shrink-0" strokeWidth={2.2} aria-hidden />
          <span className="hidden sm:inline" style={{ fontWeight: 900, fontSize: '13px' }}>設定</span>
        </motion.button>

        <div className="flex flex-col items-end gap-2 shrink-0 min-w-[7.5rem]">
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <span className="text-2xl leading-none">⭐</span>
            <span className="text-white tabular-nums leading-none pt-0.5" style={{ fontWeight: 900, fontSize: '22px' }}>
              {totalStars}
            </span>
          </motion.div>

          <button
            type="button"
            onClick={() => {
              setStickerBookFullscreen(false);
              setShowStickerBook(true);
            }}
            className="flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-2xl w-full justify-center max-w-[10.5rem] transition-transform active:scale-[0.98]"
            style={{
              background:
                chapterComplete
                  ? 'linear-gradient(135deg, rgba(52,211,153,0.45), rgba(56,189,248,0.35))'
                  : 'linear-gradient(135deg, rgba(251,146,60,0.35), rgba(244,114,182,0.28))',
              backdropFilter: 'blur(14px)',
              border: chapterComplete ? '1px solid rgba(52,211,153,0.55)' : '1px solid rgba(255,255,255,0.38)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            }}
            title={`${chapter.assembledReward.name} ${chapterDoneCount}/${chapter.levels.length} — 仰望星空圖鑑`}
            aria-label="開啟星空圖鑑：第一視角旋轉仰望檢視十二星座完成度"
          >
            <span className="text-xl leading-none">{chapterComplete ? '🏅' : '📖'}</span>
            <div className="text-right min-w-0 flex-1">
              <div className="text-white/95 leading-tight" style={{ fontWeight: 900, fontSize: '13px', letterSpacing: '0.02em' }}>
                圖鑑
              </div>
              <div className="text-white tabular-nums leading-tight" style={{ fontWeight: 800, fontSize: '12px' }}>
                {chapter.mapEmoji}{chapterDoneCount}/{chapter.levels.length}
                {chapterComplete ? ' ✓' : ''}
              </div>
            </div>
          </button>
        </div>
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }} preserveAspectRatio="none">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* 此星座示意星網（形狀底圖），與天文館星圖一樣用連線標出群星相對關係 */}
        {asterismEdges.map(([ai, bi], idx) => {
          const pa = LEVELS[ai];
          const pb = LEVELS[bi];
          if (!pa || !pb) return null;
          return (
            <line
              key={`ast-${chapter.id}-${idx}`}
              x1={`${pa.x}%`}
              y1={`${pa.y}%`}
              x2={`${pb.x}%`}
              y2={`${pb.y}%`}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth={2.25}
              strokeLinecap="round"
            />
          );
        })}
        {/* 訓練主線進度：依主星順序第 1→2→⋯ 顆 */}
        {LEVELS.slice(0, -1).map((level, i) => {
          const next = LEVELS[i + 1];
          const unlocked = level.id < currentLevel;
          return (
            <line
              key={`path-${chapter.id}-${i}`}
              x1={`${level.x}%`}
              y1={`${level.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke={unlocked ? '#ffd43b' : 'rgba(255,255,255,0.12)'}
              strokeWidth={unlocked ? 4.25 : 2.5}
              strokeDasharray={unlocked ? 'none' : '7,8'}
              filter={unlocked ? 'url(#glow)' : 'none'}
              strokeLinecap="round"
              opacity={0.92}
            />
          );
        })}
      </svg>

      {LEVELS.map(level => {
        const isCompleted = completedLevels.includes(level.id);
        const isCurrent = level.id === currentLevel;
        const isLocked = level.id > currentLevel;

        return (
          <div
            key={level.id}
            className="absolute z-[30]"
            style={{
              left: `${level.x}%`,
              top: `${level.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {isCurrent && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  width: 80,
                  height: 80,
                  left: -20,
                  top: -20,
                  background: 'rgba(255, 212, 59, 0.4)',
                }}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}

            <motion.button
              className="relative w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-xl border-3"
              style={{
                background: isLocked
                  ? 'rgba(100,116,139,0.7)'
                  : isCompleted
                  ? 'linear-gradient(135deg, #ffd43b, #ff922b)'
                  : 'linear-gradient(135deg, #a855f7, #6366f1)',
                borderColor: isCurrent ? '#fff' : isCompleted ? '#ff922b' : 'transparent',
                border: isCurrent ? '3px solid white' : isCompleted ? '3px solid #ff922b' : '3px solid transparent',
                cursor: isLocked ? 'not-allowed' : 'pointer',
              }}
              whileHover={!isLocked ? { scale: 1.15 } : {}}
              whileTap={!isLocked ? { scale: 0.95 } : {}}
              animate={isCurrent ? { scale: [1, 1.08, 1] } : {}}
              transition={isCurrent ? { duration: 1, repeat: Infinity } : {}}
              onClick={() => handleLevelClick(level)}
            >
              <span style={{ fontSize: '22px' }}>{isLocked ? '🔒' : level.icon}</span>
            </motion.button>

            <div className="absolute -bottom-11 left-1/2 transform -translate-x-1/2 text-center max-w-[5rem]">
              <div className="text-white" style={{ fontWeight: 800, fontSize: '12px', textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                {level.zodiac?.glyph ?? '✦'}
                {level.indexInChapter ?? '·'}
              </div>
              {isCompleted && (
                <div className="flex justify-center">
                  <StarCount count={level.stars} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      <AnimatePresence>
        {chapterTipMode && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setChapterTipMode(null)}
          >
            <motion.div
              className="rounded-3xl p-6 max-w-sm w-full text-left"
              style={{ background: 'linear-gradient(145deg, #1e1b4b, #0f172a)', border: '1px solid rgba(255,255,255,0.18)' }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-white/90 mb-3" style={{ fontWeight: 900, fontSize: '15px' }}>
                {headerZodiac ? `${headerZodiac.glyph} ${headerZodiac.nameZh}` : chapter.title}
                <span className="block text-white/50 mt-1" style={{ fontWeight: 700, fontSize: '12px' }}>
                  星座寓意
                </span>
              </div>
              <div
                className="rounded-2xl px-4 py-3.5 mb-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.16), rgba(167,139,250,0.12))',
                  border: '1px solid rgba(253,224,71,0.42)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-amber-50" style={{ fontWeight: 800, fontSize: '17px', lineHeight: 1.65 }}>
                  {constellationMeaning || meaningFallback}
                </p>
              </div>
              <p className="text-white/55" style={{ fontWeight: 600, fontSize: '12px', lineHeight: 1.5 }}>
                名稱與日期在畫面上方區塊；請點圓形外框 <strong className="text-white">？</strong> 開啟本視窗。
              </p>
              <button
                type="button"
                className="mt-5 w-full py-3 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #2563eb)', fontWeight: 900, fontSize: '16px' }}
                onClick={() => setChapterTipMode(null)}
              >
                知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLevel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLevel(null)}
          >
            <motion.div
              className="rounded-3xl p-8 text-center max-w-xs w-full"
              style={{ background: 'linear-gradient(135deg, #2d1b69, #1e3a5f)', border: '2px solid rgba(255,255,255,0.2)' }}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', damping: 18 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">{selectedLevel.icon}</div>
              <div className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>
                {selectedLevel.zodiac && selectedLevel.indexInChapter != null
                  ? `${selectedLevel.zodiac.glyph}　主星${selectedLevel.indexInChapter}`
                  : `第 ${selectedLevel.chapterId}-${selectedLevel.indexInChapter} 關`}
              </div>
              <div className="text-white/75 mt-2 mb-6" style={{ fontWeight: 700, fontSize: '15px' }}>
                {selectedLevel.type}
              </div>
              <button
                onClick={handleStart}
                className="w-full py-4 rounded-2xl text-white"
                style={{ background: 'linear-gradient(135deg, #ffd43b, #ff922b)', fontWeight: 900, fontSize: '18px' }}
              >
                ▶ 開始
              </button>
              <button
                onClick={() => setSelectedLevel(null)}
                className="mt-3 w-full py-3 text-white/50"
                style={{ fontWeight: 700, fontSize: '14px' }}
              >
                等等
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStickerBook && (
          <motion.div
            className={`fixed inset-0 z-50 flex relative ${stickerBookFullscreen ? 'items-stretch justify-stretch' : 'items-end justify-center sm:items-center sm:p-4'}`}
            style={{ background: 'rgba(0,0,0,0.76)', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              // fullscreen 時避免誤觸背景導致跳出；僅按右上 ✕ 才會關閉
              if (!stickerBookFullscreen) closeStickerBook();
            }}
          >
            {/* 圖鑑遮罩層也要滿版星海（canvas 版，避免進入卡頓） */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <StarfieldCanvas seed={chapter.id + 999} opacity={0.85} uniform={1} />
            </div>

            <motion.div
              ref={stickerPanelRef}
              className={
                stickerBookFullscreen
                  ? 'w-full min-h-[100svh] h-[100svh] max-h-[100svh] overflow-hidden rounded-none px-3 py-3 sm:px-5 sm:py-4 flex flex-col min-h-0'
                  : 'w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[78vh] overflow-y-auto overflow-x-hidden flex flex-col'
              }
              style={{
                background: stickerBookFullscreen ? 'linear-gradient(180deg,#020617 0%,#0f172a 45%,#020617 100%)' : 'linear-gradient(135deg, #fef3c7, #fff7ed)',
                boxShadow: stickerBookFullscreen ? 'none' : '0 -8px 40px rgba(0,0,0,0.2)',
                paddingBottom: stickerBookFullscreen ? 'max(12px, env(safe-area-inset-bottom))' : undefined,
              }}
              initial={stickerBookFullscreen ? { opacity: 0, scale: 0.98 } : { y: '100%' }}
              animate={stickerBookFullscreen ? { opacity: 1, scale: 1 } : { y: 0 }}
              exit={stickerBookFullscreen ? { opacity: 0 } : { y: '100%' }}
              transition={{ type: 'spring', damping: 26 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={`flex items-start justify-between gap-3 shrink-0 ${stickerBookFullscreen ? 'mb-2' : 'mb-4'}`}>
                <div className="min-w-0" style={stickerBookFullscreen ? { fontWeight: 900, fontSize: '17px', color: '#e2e8f0', lineHeight: 1.35 } : { fontWeight: 900, fontSize: '19px', color: '#92400e', lineHeight: 1.3 }}>
                  <span className="block">仰望星空 · 收藏庫</span>
                  <span className="block opacity-90 mt-0.5" style={{ fontSize: '13px', fontWeight: 800 }}>
                    背景有隨機星海；十二星座只顯示主星與連線。
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      closeStickerBook();
                    }}
                    className={
                      stickerBookFullscreen
                        ? 'p-2.5 rounded-2xl text-slate-300 hover:bg-white/10 text-2xl leading-none'
                        : 'p-2.5 rounded-2xl text-amber-900/70 hover:bg-white/60 text-2xl leading-none'
                    }
                    aria-label="關閉圖鑑"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* 十二星座環狀總覽（2D SVG） */}
              <div
                className={`overflow-hidden shrink-0 ${stickerBookFullscreen ? 'flex-1 flex flex-col min-h-0 -mx-1 mb-0' : 'rounded-2xl mb-6 -mx-1'}`}
              >
                <ZodiacRingChart
                  chapters={CHAPTERS}
                  completedLevels={completedLevels}
                  collectedLevelIds={collectedLevelIds}
                />
              </div>

              {!stickerBookFullscreen && (
                <>
              <div className="mb-3" style={{ fontWeight: 900, fontSize: '15px', color: '#78350f' }}>
                詳細紀錄
              </div>

              {CHAPTERS.map(ch => {
                const done = ch.levels.filter(l => collectedLevelIds.includes(l.id) || completedLevels.includes(l.id)).length;
                const assembled = isChapterComplete(ch, completedLevels);
                return (
                  <div key={ch.id} className="mb-6 pb-5 border-b border-amber-200/80 last:border-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="shrink-0 flex items-center justify-center rounded-2xl"
                        style={{
                          width: 48,
                          height: 48,
                          fontSize: '26px',
                          lineHeight: 1,
                          background: 'linear-gradient(145deg,rgba(255,255,255,0.95),rgba(254,243,199,0.9))',
                          border: '2px solid rgba(180,83,9,0.25)',
                          boxShadow: '0 6px 16px rgba(120,53,15,0.12)',
                        }}
                        title={`${ch.levels[0]?.zodiac?.nameZh ?? ch.title}`}
                      >
                        {ch.levels[0]?.zodiac?.glyph ?? ch.mapEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#78350f' }}>
                          {ch.title}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#b45309' }}>
                          此星座主星：{done}/{ch.levels.length}{assembled ? ' · 典藏已完成' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                      {ch.levels.map(lvl => {
                        const unlocked = collectedLevelIds.includes(lvl.id) || completedLevels.includes(lvl.id);
                        const starN = lvl.indexInChapter ?? lvl.id;
                        return (
                          <div
                            key={lvl.id}
                            className="aspect-square rounded-xl flex flex-col items-center justify-center text-xl"
                            style={{
                              background: unlocked ? 'linear-gradient(135deg, #fcd34d, #fb923c)' : 'rgba(0,0,0,0.06)',
                              border: unlocked ? '2px solid rgba(251,146,60,0.4)' : '2px dashed rgba(0,0,0,0.12)',
                            }}
                          >
                            <span style={{ opacity: unlocked ? 1 : 0.25 }}>{unlocked ? lvl.collectible.emoji : '🔒'}</span>
                            <span style={{ fontSize: '9px', fontWeight: 900, color: unlocked ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.38)', marginTop: 4, textAlign: 'center', lineHeight: 1.2 }}>
                              主星{starN}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className="rounded-full px-4 py-3 flex items-center gap-3 min-h-[4.75rem]"
                      style={{
                        background: assembled ? 'linear-gradient(135deg, #34d399, #38bdf8)' : 'rgba(255,255,255,0.7)',
                        border: `2px solid ${assembled ? 'rgba(16,185,129,0.5)' : 'rgba(167,139,250,0.35)'}`,
                        boxShadow: assembled ? '0 8px 24px rgba(16,185,129,0.25)' : '0 8px 20px rgba(15,23,42,0.08)',
                      }}
                    >
                      <div
                        className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-[1.85rem]"
                        style={{
                          background: 'linear-gradient(145deg, rgba(124,58,237,0.92), rgba(79,70,229,0.88))',
                          border: '1px solid rgba(255,255,255,0.45)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                        }}
                        aria-hidden
                      >
                        {ch.assembledReward.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: '15px',
                            color: assembled ? '#fff' : '#78350f',
                            lineHeight: 1.3,
                          }}
                        >
                          {ch.assembledReward.name}
                        </div>
                        <div
                          className="tabular-nums mt-1"
                          style={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: assembled ? 'rgba(255,251,235,0.95)' : '#b45309',
                          }}
                        >
                          {done}/{ch.levels.length}
                          {assembled ? ' ✓' : ''}
                        </div>
                      </div>
                      <div
                        className="shrink-0 pl-4 ml-auto text-right flex flex-col justify-center border-l"
                        style={{
                          borderColor: assembled ? 'rgba(255,255,255,0.35)' : 'rgba(251,146,60,0.35)',
                          minHeight: '3rem',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '11px', color: assembled ? 'rgba(255,255,255,0.8)' : '#92400e' }}>
                          太陽星座約
                        </div>
                        <div
                          className="whitespace-nowrap tabular-nums"
                          style={{ fontWeight: 900, fontSize: '15px', color: assembled ? '#fff' : '#3d2b0f' }}
                        >
                          {ch.levels[0]?.zodiac?.approxSunDates ?? ''}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-2 text-center" style={{ fontWeight: 700, fontSize: '13px', color: '#d97706' }}>
                十二張星座示意：共{' '}{CHAPTERS.reduce((n, c) => n + c.levels.length, 0)} 關 · 你已點亮 {collectedLevelIds.length} ✨（每張星網的主星皆可獨立遊玩）
              </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
