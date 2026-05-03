import type { LevelMeta, LevelMode, LevelTheme } from './levels';

export interface ChapterDef {
  id: number;
  title: string;
  subtitle: string;
  mapEmoji: string;
  /** 大地圖背景 gradient（與 themeBackground 一致） */
  mapTheme: LevelTheme;
  /** 集滿本章全部關卡碎片後，可視為合成的終極收藏 */
  assembledReward: { emoji: string; name: string; description: string };
  levels: LevelMeta[];
}

const TYPE_LABEL: Record<LevelMode, string> = {
  spot: '找不同',
  jigsaw: '拼圖關',
  order: '順序排列',
  memory: '記憶配對',
};

function mkLevel(args: {
  id: number;
  chapterId: number;
  indexInChapter: number;
  mode: LevelMode;
  theme: LevelTheme;
  icon: string;
  collectible: { emoji: string; name: string };
  storyTitle: string;
  storyText: string;
  target?: { x: number; y: number };
}): LevelMeta {
  return {
    id: args.id,
    chapterId: args.chapterId,
    indexInChapter: args.indexInChapter,
    icon: args.icon,
    type: TYPE_LABEL[args.mode],
    mode: args.mode,
    theme: args.theme,
    story: { title: args.storyTitle, text: args.storyText },
    collectible: args.collectible,
    target: args.target ?? { x: 0.5, y: 0.42 },
  };
}

/** 第一章：8 關 — 天空／星空意象碎片 → 合成「星空警覺儀」 */
const CH1_PARTS: { emoji: string; name: string }[] = [
  { emoji: '⭐', name: '星屑碎片·一' },
  { emoji: '🌙', name: '星屑碎片·二' },
  { emoji: '☄️', name: '星屑碎片·三' },
  { emoji: '✨', name: '星屑碎片·四' },
  { emoji: '🔭', name: '星屑碎片·五' },
  { emoji: '🛸', name: '星屑碎片·六' },
  { emoji: '🌠', name: '星屑碎片·七' },
  { emoji: '💫', name: '星屑碎片·八' },
];

const CH1_MODES: LevelMode[] = ['spot', 'jigsaw', 'order', 'jigsaw', 'memory', 'spot', 'jigsaw', 'spot'];
const CH1_THEMES: LevelTheme[] = ['forest', 'ocean', 'space', 'castle', 'desert', 'ocean', 'space', 'finale'];

/** 第二章：8 關 — 深海意象碎片 → 合成「海心羅盤」 */
const CH2_PARTS: { emoji: string; name: string }[] = [
  { emoji: '🐚', name: '浪核碎片·一' },
  { emoji: '🔷', name: '浪核碎片·二' },
  { emoji: '🫧', name: '浪核碎片·三' },
  { emoji: '⚓', name: '浪核碎片·四' },
  { emoji: '🐠', name: '浪核碎片·五' },
  { emoji: '🦑', name: '浪核碎片·六' },
  { emoji: '💠', name: '浪核碎片·七' },
  { emoji: '🌊', name: '浪核碎片·八' },
];

const CH2_MODES: LevelMode[] = ['jigsaw', 'spot', 'memory', 'order', 'jigsaw', 'spot', 'jigsaw', 'memory'];
const CH2_THEMES: LevelTheme[] = ['ocean', 'forest', 'desert', 'space', 'castle', 'ocean', 'finale', 'ocean'];

/** 第三章：7 關 — 終幕試煉碎片 → 合成「專注冠冕」 */
const CH3_PARTS: { emoji: string; name: string }[] = [
  { emoji: '🔥', name: '試煉徽記·一' },
  { emoji: '⚡', name: '試煉徽記·二' },
  { emoji: '🛡️', name: '試煉徽記·三' },
  { emoji: '👁️', name: '試煉徽記·四' },
  { emoji: '🎯', name: '試煉徽記·五' },
  { emoji: '💎', name: '試煉徽記·六' },
  { emoji: '🏅', name: '試煉徽記·七' },
];

const CH3_MODES: LevelMode[] = ['spot', 'order', 'jigsaw', 'memory', 'spot', 'jigsaw', 'spot'];
const CH3_THEMES: LevelTheme[] = ['finale', 'space', 'castle', 'desert', 'forest', 'ocean', 'finale'];

function buildChapter(
  chapterId: number,
  startId: number,
  chapterTitle: string,
  parts: { emoji: string; name: string }[],
  modes: LevelMode[],
  themes: LevelTheme[],
  flavor: 'sky' | 'sea' | 'finale',
): LevelMeta[] {
  return parts.map((collectible, i) => {
    const indexInChapter = i + 1;
    const spot = `${chapterTitle} · 第 ${indexInChapter} 站`;
    let text = '';
    if (flavor === 'sky') {
      text =
        '天空路線需要你盯緊每一個小差異與順序；這片碎片會記下你的警覺度。集滿本章碎片，就能合成星空警覺儀。';
    } else if (flavor === 'sea') {
      text =
        '深海裡光影會騙眼睛：拼回去、記位置、找不同。每一片浪核碎片讓海心羅盤更完整。';
    } else {
      text =
        '終幕試煉把專注拉到最高——每一枚徽記都是對毅力的提醒，全數到手即可迎接冠冕。';
    }
    return mkLevel({
      id: startId + i,
      chapterId,
      indexInChapter,
      mode: modes[i]!,
      theme: themes[i]!,
      icon: collectible.emoji,
      collectible,
      storyTitle: spot,
      storyText: text,
    });
  });
}

const CH1_LEVELS = buildChapter(1, 1, '浮空星廊篇', CH1_PARTS, CH1_MODES, CH1_THEMES, 'sky');
const CH2_LEVELS = buildChapter(2, CH1_LEVELS.length + 1, '珊瑚深海篇', CH2_PARTS, CH2_MODES, CH2_THEMES, 'sea');
const CH3_LEVELS = buildChapter(
  3,
  CH1_LEVELS.length + CH2_LEVELS.length + 1,
  '終幕冠冕篇',
  CH3_PARTS,
  CH3_MODES,
  CH3_THEMES,
  'finale',
);

export const LEVELS_META: LevelMeta[] = [...CH1_LEVELS, ...CH2_LEVELS, ...CH3_LEVELS];

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: '浮空星廊篇',
    subtitle: '天空與星辰的警覺試煉',
    mapEmoji: '🌌',
    mapTheme: 'space',
    assembledReward: {
      emoji: '🌌',
      name: '星空警覺儀',
      description: '八枚星屑碎片拼合後浮現——提醒你抬頭看路，也要盯緊腳下細節。',
    },
    levels: CH1_LEVELS,
  },
  {
    id: 2,
    title: '珊瑚深海篇',
    subtitle: '傾聽洋流與專注的深度訓練',
    mapEmoji: '🔱',
    mapTheme: 'ocean',
    assembledReward: {
      emoji: '🔱',
      name: '海心羅盤',
      description: '浪核碎片全數歸位後，羅盤會在混亂波光裡為你指出專注的方向。',
    },
    levels: CH2_LEVELS,
  },
  {
    id: 3,
    title: '終幕冠冕篇',
    subtitle: '意志與收束的最終章',
    mapEmoji: '🏆',
    mapTheme: 'finale',
    assembledReward: {
      emoji: '🏆',
      name: '專注冠冕',
      description: '七枚試煉徽記齊聚，象徵你能長時間守護注意力直到最後一刻。',
    },
    levels: CH3_LEVELS,
  },
];

export function getChapterForLevel(levelId: number): ChapterDef | undefined {
  return CHAPTERS.find(c => c.levels.some(l => l.id === levelId));
}

export function isChapterComplete(chapter: ChapterDef, completedLevelIds: number[]): boolean {
  return chapter.levels.every(l => completedLevelIds.includes(l.id));
}

/** 依關卡數量產生蜿蜒路徑座標（百分比） */
export function layoutPathForCount(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = 10 + t * 78;
    const wave = Math.sin(t * Math.PI) * 48;
    /** 路徑整體偏下，避免與上方章節資訊卡重疊 */
    const y = 84 - wave * 0.78;
    out.push({ x, y: Math.min(90, Math.max(28, y)) });
  }
  return out;
}
