export interface VisualCard {
  id: number;
  order?: number;
  caption: string;
  emoji: string;
  /** card accent colour (CSS colour string) */
  bg?: string;
}

export interface OrderStorySet {
  id: string;
  title: string;
  /** accent gradient for this story */
  color: string;
  cards: VisualCard[];
}

export interface MemoryThemeSet {
  id: string;
  label: string;
  /** accent gradient for this theme */
  color: string;
  items: VisualCard[];
}

// ── Order Sort story sets (8 themes) ────────────────────────────────────────

export const ORDER_STORY_SETS: OrderStorySet[] = [
  {
    id: 'butterfly',
    title: '蝴蝶的一生',
    color: 'linear-gradient(135deg,#a3e635,#34d399)',
    cards: [
      { id: 0, order: 0, caption: '蟲卵', emoji: '🥚', bg: '#fef9c3' },
      { id: 1, order: 1, caption: '毛毛蟲', emoji: '🐛', bg: '#d1fae5' },
      { id: 2, order: 2, caption: '蛹', emoji: '🫘', bg: '#e0e7ff' },
      { id: 3, order: 3, caption: '蝴蝶', emoji: '🦋', bg: '#fce7f3' },
    ],
  },
  {
    id: 'plant-growth',
    title: '植物成長',
    color: 'linear-gradient(135deg,#86efac,#6ee7b7)',
    cards: [
      { id: 0, order: 0, caption: '播種', emoji: '🌱', bg: '#f0fdf4' },
      { id: 1, order: 1, caption: '發芽', emoji: '🌿', bg: '#d1fae5' },
      { id: 2, order: 2, caption: '開花', emoji: '🌸', bg: '#fce7f3' },
      { id: 3, order: 3, caption: '結果', emoji: '🍎', bg: '#fee2e2' },
    ],
  },
  {
    id: 'space-mission',
    title: '太空任務',
    color: 'linear-gradient(135deg,#818cf8,#38bdf8)',
    cards: [
      { id: 0, order: 0, caption: '穿太空衣', emoji: '👨‍🚀', bg: '#e0e7ff' },
      { id: 1, order: 1, caption: '火箭升空', emoji: '🚀', bg: '#dbeafe' },
      { id: 2, order: 2, caption: '太空漫步', emoji: '🌌', bg: '#1e1b4b' },
      { id: 3, order: 3, caption: '平安返航', emoji: '🛸', bg: '#ede9fe' },
    ],
  },
  {
    id: 'cooking',
    title: '親手做蛋糕',
    color: 'linear-gradient(135deg,#fbbf24,#f87171)',
    cards: [
      { id: 0, order: 0, caption: '準備材料', emoji: '🥚', bg: '#fefce8' },
      { id: 1, order: 1, caption: '攪拌麵糊', emoji: '🥣', bg: '#fef3c7' },
      { id: 2, order: 2, caption: '烤箱烘烤', emoji: '🔥', bg: '#fee2e2' },
      { id: 3, order: 3, caption: '裝飾完成', emoji: '🎂', bg: '#fce7f3' },
    ],
  },
  {
    id: 'weather',
    title: '天氣變化',
    color: 'linear-gradient(135deg,#38bdf8,#818cf8)',
    cards: [
      { id: 0, order: 0, caption: '晴天', emoji: '☀️', bg: '#fefce8' },
      { id: 1, order: 1, caption: '起烏雲', emoji: '⛅', bg: '#f1f5f9' },
      { id: 2, order: 2, caption: '下大雨', emoji: '🌧️', bg: '#dbeafe' },
      { id: 3, order: 3, caption: '彩虹出現', emoji: '🌈', bg: '#fce7f3' },
    ],
  },
  {
    id: 'morning-routine',
    title: '早晨的作息',
    color: 'linear-gradient(135deg,#fde68a,#fdba74)',
    cards: [
      { id: 0, order: 0, caption: '起床', emoji: '🌅', bg: '#fefce8' },
      { id: 1, order: 1, caption: '刷牙洗臉', emoji: '🦷', bg: '#e0f2fe' },
      { id: 2, order: 2, caption: '吃早餐', emoji: '🍳', bg: '#fef3c7' },
      { id: 3, order: 3, caption: '出門上學', emoji: '🎒', bg: '#d1fae5' },
    ],
  },
  {
    id: 'ocean-journey',
    title: '海洋探險',
    color: 'linear-gradient(135deg,#22d3ee,#3b82f6)',
    cards: [
      { id: 0, order: 0, caption: '出海', emoji: '⛵', bg: '#e0f2fe' },
      { id: 1, order: 1, caption: '潛入深海', emoji: '🤿', bg: '#dbeafe' },
      { id: 2, order: 2, caption: '遇到鯨魚', emoji: '🐋', bg: '#cffafe' },
      { id: 3, order: 3, caption: '找到寶藏', emoji: '🏆', bg: '#fef3c7' },
    ],
  },
  {
    id: 'fire-safety',
    title: '遇到火災怎麼辦',
    color: 'linear-gradient(135deg,#f97316,#ef4444)',
    cards: [
      { id: 0, order: 0, caption: '發現火災', emoji: '🔥', bg: '#fee2e2' },
      { id: 1, order: 1, caption: '大聲呼救', emoji: '📢', bg: '#fef3c7' },
      { id: 2, order: 2, caption: '低身逃生', emoji: '🏃', bg: '#fce7f3' },
      { id: 3, order: 3, caption: '打119', emoji: '🚒', bg: '#e0f2fe' },
    ],
  },
];

// ── Memory Match theme sets (8 themes) ───────────────────────────────────────

export const MEMORY_THEME_SETS: MemoryThemeSet[] = [
  {
    id: 'deep-sea',
    label: '深海探險',
    color: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    items: [
      { id: 0, caption: '章魚', emoji: '🐙', bg: '#e0f2fe' },
      { id: 1, caption: '熱帶魚', emoji: '🐠', bg: '#fef3c7' },
      { id: 2, caption: '海豚', emoji: '🐬', bg: '#dbeafe' },
      { id: 3, caption: '螃蟹', emoji: '🦀', bg: '#fee2e2' },
    ],
  },
  {
    id: 'safari',
    label: '非洲大草原',
    color: 'linear-gradient(135deg,#f59e0b,#84cc16)',
    items: [
      { id: 0, caption: '獅子', emoji: '🦁', bg: '#fef3c7' },
      { id: 1, caption: '大象', emoji: '🐘', bg: '#f1f5f9' },
      { id: 2, caption: '長頸鹿', emoji: '🦒', bg: '#fefce8' },
      { id: 3, caption: '斑馬', emoji: '🦓', bg: '#f8fafc' },
    ],
  },
  {
    id: 'space',
    label: '宇宙大冒險',
    color: 'linear-gradient(135deg,#6366f1,#a855f7)',
    items: [
      { id: 0, caption: '火箭', emoji: '🚀', bg: '#ede9fe' },
      { id: 1, caption: '土星', emoji: '🪐', bg: '#e0e7ff' },
      { id: 2, caption: '外星人', emoji: '👽', bg: '#d1fae5' },
      { id: 3, caption: '彗星', emoji: '☄️', bg: '#fee2e2' },
    ],
  },
  {
    id: 'yummy-food',
    label: '美食大集合',
    color: 'linear-gradient(135deg,#f97316,#fbbf24)',
    items: [
      { id: 0, caption: '壽司', emoji: '🍣', bg: '#fef3c7' },
      { id: 1, caption: '披薩', emoji: '🍕', bg: '#fee2e2' },
      { id: 2, caption: '拉麵', emoji: '🍜', bg: '#fefce8' },
      { id: 3, caption: '甜甜圈', emoji: '🍩', bg: '#fce7f3' },
    ],
  },
  {
    id: 'fairy-tale',
    label: '童話王國',
    color: 'linear-gradient(135deg,#ec4899,#a855f7)',
    items: [
      { id: 0, caption: '城堡', emoji: '🏰', bg: '#fce7f3' },
      { id: 1, caption: '獨角獸', emoji: '🦄', bg: '#ede9fe' },
      { id: 2, caption: '魔法棒', emoji: '🪄', bg: '#fef3c7' },
      { id: 3, caption: '龍', emoji: '🐉', bg: '#d1fae5' },
    ],
  },
  {
    id: 'sports',
    label: '運動競技',
    color: 'linear-gradient(135deg,#22c55e,#3b82f6)',
    items: [
      { id: 0, caption: '足球', emoji: '⚽', bg: '#f0fdf4' },
      { id: 1, caption: '籃球', emoji: '🏀', bg: '#fff7ed' },
      { id: 2, caption: '游泳', emoji: '🏊', bg: '#e0f2fe' },
      { id: 3, caption: '跑步', emoji: '🏃', bg: '#fefce8' },
    ],
  },
  {
    id: 'weather-friends',
    label: '天氣朋友',
    color: 'linear-gradient(135deg,#38bdf8,#fbbf24)',
    items: [
      { id: 0, caption: '太陽', emoji: '☀️', bg: '#fefce8' },
      { id: 1, caption: '彩虹', emoji: '🌈', bg: '#fce7f3' },
      { id: 2, caption: '閃電', emoji: '⚡', bg: '#fef3c7' },
      { id: 3, caption: '雪花', emoji: '❄️', bg: '#e0f2fe' },
    ],
  },
  {
    id: 'forest-life',
    label: '森林生態',
    color: 'linear-gradient(135deg,#86efac,#34d399)',
    items: [
      { id: 0, caption: '松鼠', emoji: '🐿️', bg: '#fef3c7' },
      { id: 1, caption: '蘑菇', emoji: '🍄', bg: '#fce7f3' },
      { id: 2, caption: '狐狸', emoji: '🦊', bg: '#fee2e2' },
      { id: 3, caption: '貓頭鷹', emoji: '🦉', bg: '#fefce8' },
    ],
  },
];

export function pickOrderStory(levelId: number): OrderStorySet {
  const idx = Math.abs(levelId) % ORDER_STORY_SETS.length;
  return ORDER_STORY_SETS[idx] ?? ORDER_STORY_SETS[0]!;
}

export function pickMemoryTheme(levelId: number): MemoryThemeSet {
  const idx = Math.abs(levelId) % MEMORY_THEME_SETS.length;
  return MEMORY_THEME_SETS[idx] ?? MEMORY_THEME_SETS[0]!;
}
