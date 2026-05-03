import type { LevelMeta, LevelMode, LevelTheme, ZodiacInfo } from './levels';

/** 單一星座的星象：節點 = 關卡位置，edges = 星圖連線（可多邊，不必只沿關卡順序） */
export interface ConstellationGeometry {
  stars: { x: number; y: number }[];
  edges: [number, number][];
}

export interface ChapterDef {
  id: number;
  title: string;
  subtitle: string;
  mapEmoji: string;
  mapTheme: LevelTheme;
  assembledReward: { emoji: string; name: string; description: string };
  levels: LevelMeta[];
  /** 本星座專用星象（與 levels.length 一致，一顆主星 = 一關） */
  constellation: ConstellationGeometry;
}

const TYPE_LABEL: Record<LevelMode, string> = {
  spot: '找不同',
  jigsaw: '拼圖關',
  order: '順序排列',
  memory: '記憶配對',
};

/** 依關卡數量產生蜿蜒路徑（後備，幾何缺失時） */
export function layoutPathForCount(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = 10 + t * 78;
    const wave = Math.sin(t * Math.PI) * 48;
    const y = 84 - wave * 0.78;
    out.push({ x, y: Math.min(90, Math.max(28, y)) });
  }
  return out;
}

export function mapLayoutCoords(chapter: ChapterDef): { x: number; y: number }[] {
  const s = chapter.constellation?.stars;
  if (s && s.length === chapter.levels.length) return s;
  return layoutPathForCount(chapter.levels.length);
}

export function constellationEdgesFor(chapter: ChapterDef): [number, number][] {
  return chapter.constellation?.edges ?? [];
}

const ZODIAC12: ZodiacInfo[] = [
  { nameZh: '牡羊座', glyph: '♈', latin: 'Aries', meaning: '開創、勇氣', approxSunDates: '約 3/21–4/19' },
  { nameZh: '金牛座', glyph: '♉', latin: 'Taurus', meaning: '穩健、耐性', approxSunDates: '約 4/20–5/20' },
  { nameZh: '雙子座', glyph: '♊', latin: 'Gemini', meaning: '好奇、彈性', approxSunDates: '約 5/21–6/21' },
  { nameZh: '巨蟹座', glyph: '♋', latin: 'Cancer', meaning: '守護、直覺', approxSunDates: '約 6/22–7/22' },
  { nameZh: '獅子座', glyph: '♌', latin: 'Leo', meaning: '自信、創造', approxSunDates: '約 7/23–8/22' },
  { nameZh: '處女座', glyph: '♍', latin: 'Virgo', meaning: '細緻、條理', approxSunDates: '約 8/23–9/22' },
  { nameZh: '天秤座', glyph: '♎', latin: 'Libra', meaning: '平衡、合作', approxSunDates: '約 9/23–10/23' },
  { nameZh: '天蠍座', glyph: '♏', latin: 'Scorpius', meaning: '專注、探究', approxSunDates: '約 10/24–11/22' },
  { nameZh: '射手座', glyph: '♐', latin: 'Sagittarius', meaning: '探索、冒險', approxSunDates: '約 11/23–12/21' },
  { nameZh: '摩羯座', glyph: '♑', latin: 'Capricornus', meaning: '紀律、爬坡', approxSunDates: '約 12/22–1/19' },
  { nameZh: '水瓶座', glyph: '♒', latin: 'Aquarius', meaning: '創新、獨立', approxSunDates: '約 1/20–2/18' },
  { nameZh: '雙魚座', glyph: '♓', latin: 'Pisces', meaning: '同理、想像', approxSunDates: '約 2/19–3/20' },
];

/** 各星座星象圖：六顆主星 + 典型連線（簡化示意，非天體測量尺度） */
const ZODIAC_GEOM: ConstellationGeometry[] = [
  {
    stars: [
      { x: 72, y: 50 },
      { x: 62, y: 54 },
      { x: 52, y: 58 },
      { x: 44, y: 54 },
      { x: 36, y: 48 },
      { x: 28, y: 44 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [1, 3],
    ],
  },
  {
    stars: [
      { x: 50, y: 38 },
      { x: 62, y: 46 },
      { x: 72, y: 56 },
      { x: 62, y: 66 },
      { x: 48, y: 68 },
      { x: 38, y: 56 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [0, 2],
    ],
  },
  {
    stars: [
      { x: 38, y: 42 },
      { x: 38, y: 54 },
      { x: 38, y: 66 },
      { x: 74, y: 42 },
      { x: 74, y: 54 },
      { x: 74, y: 66 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [3, 4],
      [4, 5],
      [0, 3],
      [1, 4],
      [2, 5],
    ],
  },
  {
    stars: [
      { x: 48, y: 46 },
      { x: 62, y: 44 },
      { x: 70, y: 54 },
      { x: 62, y: 66 },
      { x: 46, y: 68 },
      { x: 38, y: 56 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  {
    stars: [
      { x: 68, y: 42 },
      { x: 58, y: 46 },
      { x: 48, y: 52 },
      { x: 42, y: 58 },
      { x: 52, y: 66 },
      { x: 62, y: 62 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 5],
    ],
  },
  {
    stars: [
      { x: 36, y: 44 },
      { x: 48, y: 48 },
      { x: 58, y: 54 },
      { x: 62, y: 66 },
      { x: 52, y: 72 },
      { x: 42, y: 62 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  {
    stars: [
      { x: 42, y: 48 },
      { x: 54, y: 42 },
      { x: 66, y: 48 },
      { x: 54, y: 54 },
      { x: 44, y: 66 },
      { x: 62, y: 66 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [1, 3],
      [3, 4],
      [3, 5],
    ],
  },
  {
    stars: [
      { x: 28, y: 70 },
      { x: 40, y: 60 },
      { x: 52, y: 50 },
      { x: 64, y: 44 },
      { x: 76, y: 50 },
      { x: 86, y: 60 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  {
    stars: [
      { x: 40, y: 58 },
      { x: 52, y: 50 },
      { x: 66, y: 44 },
      { x: 76, y: 52 },
      { x: 64, y: 62 },
      { x: 48, y: 66 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [2, 4],
    ],
  },
  {
    stars: [
      { x: 58, y: 36 },
      { x: 72, y: 46 },
      { x: 70, y: 60 },
      { x: 54, y: 68 },
      { x: 38, y: 58 },
      { x: 44, y: 44 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  {
    stars: [
      { x: 34, y: 44 },
      { x: 50, y: 40 },
      { x: 68, y: 46 },
      { x: 74, y: 58 },
      { x: 58, y: 66 },
      { x: 40, y: 60 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
  {
    stars: [
      { x: 32, y: 50 },
      { x: 46, y: 56 },
      { x: 58, y: 60 },
      { x: 72, y: 52 },
      { x: 64, y: 44 },
      { x: 48, y: 40 },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
];

function astronomyBlurb(sign: ZodiacInfo, starOrdinal: number, totalStars: number): string {
  return `${sign.nameZh}示意星網｜節點 ${starOrdinal}/${totalStars}`;
}

function mkLevel(args: {
  id: number;
  chapterId: number;
  indexInChapter: number;
  mode: LevelMode;
  theme: LevelTheme;
  collectible: { emoji: string; name: string };
  storyTitle: string;
  storyText: string;
  zodiacIndex: number;
  target?: { x: number; y: number };
}): LevelMeta {
  const z = ZODIAC12[args.zodiacIndex]!;
  return {
    id: args.id,
    chapterId: args.chapterId,
    indexInChapter: args.indexInChapter,
    icon: z.glyph,
    type: TYPE_LABEL[args.mode],
    mode: args.mode,
    theme: args.theme,
    story: { title: args.storyTitle, text: args.storyText },
    collectible: args.collectible,
    zodiac: z,
    target: args.target ?? { x: 0.5, y: 0.42 },
  };
}

function buildOneZodiacChapter(chapterIndex: number, startGlobalId: number): { chapter: ChapterDef; nextId: number } {
  const zodiacIndex = chapterIndex - 1;
  const sign = ZODIAC12[zodiacIndex]!;
  const geo = ZODIAC_GEOM[zodiacIndex]!;
  const n = geo.stars.length;
  const modes: LevelMode[] = ['spot', 'jigsaw', 'order', 'memory', 'spot', 'jigsaw'];
  const themes: LevelTheme[] = ['space', 'castle', 'ocean', 'finale', 'desert', 'forest'];

  const levels = geo.stars.map((_, si) => {
    const i = si + 1;
    return mkLevel({
      id: startGlobalId + si,
      chapterId: chapterIndex,
      indexInChapter: i,
      mode: modes[si % modes.length]!,
      theme: themes[si % themes.length]!,
      collectible: {
        emoji: '✦',
        name: `主星${i}`,
      },
      storyTitle: `${sign.glyph} ${sign.nameZh}　${i}/${n}`,
      storyText: astronomyBlurb(sign, i, n),
      zodiacIndex,
    });
  });

  const chapter: ChapterDef = {
    id: chapterIndex,
    title: `${sign.glyph} ${sign.nameZh}`,
    subtitle: `${n} 個節點`,
    mapEmoji: sign.glyph,
    mapTheme: zodiacIndex === 11 ? 'finale' : 'space',
    assembledReward: {
      emoji: sign.glyph,
      name: `${sign.nameZh}典藏`,
      description: `${n}/${n} 主星達成`,
    },
    levels,
    constellation: geo,
  };

  return { chapter, nextId: startGlobalId + n };
}

let gid = 1;
export const CHAPTERS: ChapterDef[] = [];

for (let c = 1; c <= 12; c++) {
  const built = buildOneZodiacChapter(c, gid);
  gid = built.nextId;
  CHAPTERS.push(built.chapter);
}

export const LEVELS_META: LevelMeta[] = CHAPTERS.flatMap(c => c.levels);

export function getChapterForLevel(levelId: number): ChapterDef | undefined {
  return CHAPTERS.find(c => c.levels.some(l => l.id === levelId));
}

export function isChapterComplete(chapter: ChapterDef, completedLevelIds: number[]): boolean {
  return chapter.levels.every(l => completedLevelIds.includes(l.id));
}
