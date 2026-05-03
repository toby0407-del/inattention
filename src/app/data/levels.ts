export type LevelMode = 'spot' | 'jigsaw' | 'order' | 'memory';

export type LevelTheme = 'forest' | 'ocean' | 'space' | 'castle' | 'desert' | 'finale';

export interface StoryBeat {
  title: string;
  text: string;
}

/** 黃道星座（教育向文案，占星娛樂用途） */
export interface ZodiacInfo {
  /** 中文名，例：牡羊座 */
  nameZh: string;
  /** Unicode 星座符號 */
  glyph: string;
  latin: string;
  /** 一句寓意／學習重點 */
  meaning: string;
  /** 常見「太陽星座」對應的西曆約略區間（坊間習俗，跨年處仍以習俗寫法呈現） */
  approxSunDates: string;
}

export interface LevelMeta {
  id: number;
  /** 所屬章節（大地圖分章用） */
  chapterId?: number;
  /** 章內第幾關（顯示用） */
  indexInChapter?: number;
  icon: string;
  type: string;
  mode: LevelMode;
  theme: LevelTheme;
  story: StoryBeat;
  collectible: { emoji: string; name: string };
  target: { x: number; y: number };
  /** 對應黃道星座（地圖與收藏標示） */
  zodiac?: ZodiacInfo;
}

export {
  CHAPTERS,
  LEVELS_META,
  getChapterForLevel,
  isChapterComplete,
  layoutPathForCount,
  mapLayoutCoords,
  constellationEdgesFor,
} from './chapters';

export type { ChapterDef, ConstellationGeometry } from './chapters';
import { LEVELS_META } from './chapters';

export function getLevelMeta(id: number): LevelMeta {
  return LEVELS_META.find(l => l.id === id) ?? LEVELS_META[0];
}

export function themeBackground(theme: LevelTheme, mode: LevelMode) {
  switch (theme) {
    case 'forest':
      return 'linear-gradient(180deg, #1a1060 0%, #2d1b69 30%, #1e4d1a 70%, #2a6b21 100%)';
    case 'ocean':
      return 'linear-gradient(180deg, #071b4a 0%, #2d1b69 35%, #0b4a6b 70%, #0a6a88 100%)';
    case 'space':
      return 'linear-gradient(180deg, #050316 0%, #1e1060 40%, #0a2040 75%, #04111f 100%)';
    case 'castle':
      return 'linear-gradient(180deg, #1a1060 0%, #2b103a 35%, #1e3a5f 75%, #0b2a3a 100%)';
    case 'desert':
      return 'linear-gradient(180deg, #3b1d06 0%, #5b2b0d 35%, #b45309 70%, #f59e0b 100%)';
    case 'finale':
      return 'linear-gradient(180deg, #1a0a3c 0%, #2d1060 35%, #0a2040 75%, #05122b 100%)';
    default:
      return 'linear-gradient(180deg, #1a1060 0%, #2d1b69 30%, #1e4d1a 70%, #2a6b21 100%)';
  }
}
