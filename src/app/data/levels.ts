export type LevelMode = 'spot' | 'jigsaw';

export type LevelTheme = 'forest' | 'ocean' | 'space' | 'castle' | 'desert' | 'finale';

export interface StoryBeat {
  title: string;
  text: string;
}

export interface LevelMeta {
  id: number;
  icon: string;
  type: string;
  mode: LevelMode;
  theme: LevelTheme;
  story: StoryBeat;
  collectible: { emoji: string; name: string };
  target: { x: number; y: number }; // 0..1 normalized (for "target deviation" views)
}

export const LEVELS_META: LevelMeta[] = [
  {
    id: 1,
    icon: '🥕',
    type: '找不同',
    mode: 'spot',
    theme: 'forest',
    story: { title: '森林的迷路小兔', text: '小兔走散了！用你的火眼金睛找出不同，帶它回家。' },
    collectible: { emoji: '🥕', name: '胡蘿蔔徽章' },
    target: { x: 0.55, y: 0.35 },
  },
  {
    id: 2,
    icon: '🦪',
    type: '拼圖關',
    mode: 'jigsaw',
    theme: 'ocean',
    story: { title: '海底的珍珠碎片', text: '珍珠裂成碎片了！把拼圖拼回去，喚醒海底光芒。' },
    collectible: { emoji: '🦪', name: '珍珠貝' },
    target: { x: 0.50, y: 0.50 },
  },
  {
    id: 3,
    icon: '🛰️',
    type: '找不同',
    mode: 'spot',
    theme: 'space',
    story: { title: '星際的訊號干擾', text: '太空站訊號怪怪的！找出差異，修好通訊。' },
    collectible: { emoji: '🛰️', name: '小衛星' },
    target: { x: 0.70, y: 0.20 },
  },
  {
    id: 4,
    icon: '🏳️‍🌈',
    type: '拼圖關',
    mode: 'jigsaw',
    theme: 'castle',
    story: { title: '城堡的破損旗幟', text: '旗幟被風吹散了！把圖塊放回正確位置。' },
    collectible: { emoji: '🏳️‍🌈', name: '彩色旗幟' },
    target: { x: 0.45, y: 0.55 },
  },
  {
    id: 5,
    icon: '💧',
    type: '找不同',
    mode: 'spot',
    theme: 'desert',
    story: { title: '沙漠的水滴線索', text: '綠洲在哪裡？找出差異，跟著線索前進！' },
    collectible: { emoji: '💧', name: '綠洲水滴' },
    target: { x: 0.25, y: 0.25 },
  },
  {
    id: 6,
    icon: '🏆',
    type: '終極關',
    mode: 'spot',
    theme: 'finale',
    story: { title: '勇士的最終試煉', text: '最後一關！保持專注，把所有差異一口氣找出來。' },
    collectible: { emoji: '🏆', name: '勇士獎盃' },
    target: { x: 0.50, y: 0.38 },
  },
];

export function getLevelMeta(id: number): LevelMeta {
  return LEVELS_META.find(l => l.id === id) ?? LEVELS_META[0];
}

export function themeBackground(theme: LevelTheme, mode: LevelMode) {
  // Match the QuestMap "storybook night sky" style:
  // top = deep theme color, mid = purple transition, bottom = ground tint.
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

