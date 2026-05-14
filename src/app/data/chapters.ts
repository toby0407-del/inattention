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
  { nameZh: '牡羊座', glyph: '♈', latin: 'Aries', meaning: '開創、勇氣', myth: '象徵金羊毛傳說中的神羊，提醒人們面對未知時先踏出第一步。', approxSunDates: '約 3/21–4/19' },
  { nameZh: '金牛座', glyph: '♉', latin: 'Taurus', meaning: '穩健、耐性', myth: '常見典故連到宙斯化身白牛，象徵穩定力量與持續守護。', approxSunDates: '約 4/20–5/20' },
  { nameZh: '雙子座', glyph: '♊', latin: 'Gemini', meaning: '好奇、彈性', myth: '源自雙子兄弟卡斯托爾與波魯克斯，象徵互助與同伴精神。', approxSunDates: '約 5/21–6/21' },
  { nameZh: '巨蟹座', glyph: '♋', latin: 'Cancer', meaning: '守護、直覺', myth: '在神話裡是守護戰場的小蟹，雖然渺小仍努力完成使命。', approxSunDates: '約 6/22–7/22' },
  { nameZh: '獅子座', glyph: '♌', latin: 'Leo', meaning: '自信、創造', myth: '對應尼米亞獅的故事，象徵在挑戰中鍛鍊勇氣與領導感。', approxSunDates: '約 7/23–8/22' },
  { nameZh: '處女座', glyph: '♍', latin: 'Virgo', meaning: '細緻、條理', myth: '常被連結為穀物女神，寓意照顧、秩序與把事情做好。', approxSunDates: '約 8/23–9/22' },
  { nameZh: '天秤座', glyph: '♎', latin: 'Libra', meaning: '平衡、合作', myth: '象徵正義女神手中的天秤，提醒我們在選擇時兼顧公平。', approxSunDates: '約 9/23–10/23' },
  { nameZh: '天蠍座', glyph: '♏', latin: 'Scorpius', meaning: '專注、探究', myth: '神話中的巨蠍代表專注與警覺，教人看清目標再出手。', approxSunDates: '約 10/24–11/22' },
  { nameZh: '射手座', glyph: '♐', latin: 'Sagittarius', meaning: '探索、冒險', myth: '多與半人馬賢者喀戎連結，象徵知識、遠見與持續學習。', approxSunDates: '約 11/23–12/21' },
  { nameZh: '摩羯座', glyph: '♑', latin: 'Capricornus', meaning: '紀律、爬坡', myth: '山羊魚的形象代表一步步向上，即使慢也能登上高處。', approxSunDates: '約 12/22–1/19' },
  { nameZh: '水瓶座', glyph: '♒', latin: 'Aquarius', meaning: '創新、獨立', myth: '常見為捧水使者，象徵把新點子與資源分享給大家。', approxSunDates: '約 1/20–2/18' },
  { nameZh: '雙魚座', glyph: '♓', latin: 'Pisces', meaning: '同理、想像', myth: '兩魚同游的典故象徵互相守望，也象徵感受力與想像力。', approxSunDates: '約 2/19–3/20' },
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

/** 每個星座、每顆主星各自的故事短文（共 12 × 6 = 72 條） */
const ZODIAC_BLURBS: Record<string, string[]> = {
  牡羊座: [
    '傳說中，一頭金毛神羊飛越天際，為迷途的孩子指引方向。第一顆主星，是你踏上旅途的第一步。',
    '牡羊座的守護者從不等待——它選擇先行動，再思考。點亮這顆星，感受那份無懼的衝勁。',
    '當困難擋住去路，牡羊選擇低頭衝破。這顆星提醒你：勇氣不是沒有恐懼，而是帶著恐懼前進。',
    '金羊毛不是終點，而是起點。這顆主星藏著一個秘密：真正的寶藏在於旅途本身。',
    '牡羊座教我們：有時候，只要踏出一步，世界就會為你讓路。繼續點亮星座吧。',
    '最後一顆主星閃耀著牡羊的精神——開創、熱情、永不放棄。你已走完這段旅程，了不起！',
  ],
  金牛座: [
    '金牛座的第一顆星，穩穩地鑲在夜空裡，就像牠守護大地的姿態——沉著而有力。',
    '宙斯曾化身白牛，以溫柔的力量守護所愛。這顆星象徵：真正的強大，是溫柔地堅持。',
    '金牛不急不躁，一步一步向前。這顆主星告訴你：耐心是最珍貴的禮物之一。',
    '大地的香氣、花朵的芬芳——金牛座懂得感受生活之美。點亮這顆星，慢下來看看身邊的美好。',
    '牛的力氣不是用來爭鬥，而是用來耕耘。這顆星提醒你：用心付出，終會開花結果。',
    '金牛座的星座故事在你手中完成。穩健、耐性、愛——這是你從這段旅程帶走的禮物。',
  ],
  雙子座: [
    '卡斯托爾與波魯克斯，一對神話兄弟，共享同一道星光。第一顆星，象徵著陪伴的開始。',
    '雙子兄弟一人是凡人，一人是神明，卻彼此不離不棄。這顆星說：友誼超越所有界限。',
    '雙子座的眼睛看見世界的兩面——光與影、問題與可能。這顆主星獻給每個好奇的心。',
    '波魯克斯願意分享永生給兄弟。這顆星提醒我們：最好的禮物，是把好東西與人分享。',
    '雙子座善於溝通，懂得傾聽也懂得表達。點亮這顆星，試著今天多聽別人說一句話。',
    '雙星閃耀！你完成了雙子座的所有主星。帶著好奇與彈性，繼續探索下一個星座吧！',
  ],
  巨蟹座: [
    '在一場神話大戰中，一隻小小的螃蟹夾住了英雄的腳。雖然渺小，卻勇敢完成了使命。',
    '巨蟹座守護家與親人，就像螃蟹的硬殼保護柔軟的內心。這顆星是溫暖的守護之光。',
    '螃蟹走路看似迂迴，但牠知道自己的方向。這顆主星說：用自己的方式前進，沒有關係。',
    '月亮是巨蟹座的守護星，潮起潮落，情感深厚。這顆星提醒你：感受自己的情緒，是一種力量。',
    '家是最安心的地方。這顆星獻給那些用心照顧他人的你——謝謝你的溫柔與付出。',
    '巨蟹座完成！你已學會守護、感受與直覺。帶著這份溫柔，繼續前往下一個星座。',
  ],
  獅子座: [
    '尼米亞獅是無敵的怪獸，直到遇見真正勇敢的心。第一顆星，是你找到勇氣的時刻。',
    '獅子不因別人的眼光而改變自己。這顆主星說：做最真實的自己，就是最大的勇氣。',
    '獅子是草原的守護者，用力量保護群體。這顆星提醒你：真正的領袖，是為他人挺身而出。',
    '創造力是獅子座的禮物——用一雙眼睛看見別人看不見的可能。這顆星為你的想像力喝彩。',
    '挑戰讓獅子更強壯。這顆主星說：不要害怕困難，每一次嘗試都讓你成長一點點。',
    '獅子座點亮完成！自信、創造、勇氣——你在這段旅程中已展現了獅子的精神！',
  ],
  處女座: [
    '穀物女神德墨忒爾把秩序帶進混亂的世界。這顆第一主星，是細心與條理的起點。',
    '處女座看見別人忽略的細節。這顆星說：仔細觀察，往往能找到最好的答案。',
    '把事情做好，不是為了炫耀，而是因為值得。這顆主星是每一個認真努力的你的縮影。',
    '女神照料土地，讓萬物生長。這顆星提醒你：每一個小小的照顧，都能讓世界更美好。',
    '處女座的智慧在於：知道什麼重要，什麼可以放下。這顆星幫你找到生活的優先順序。',
    '處女座完成！細緻、條理、照顧——帶著這份對細節的熱愛，出發前往下一個星座吧！',
  ],
  天秤座: [
    '正義女神手持天秤，衡量每一個決定。第一顆主星，代表你開始學習公平與選擇。',
    '天秤的兩端要保持平衡，人生也是如此。這顆星說：照顧自己，也照顧別人，才是真正的平衡。',
    '天秤座善於傾聽不同聲音，再做出決定。這顆主星提醒你：先聽，再說，是一種智慧。',
    '美麗與和諧是天秤座追求的目標。這顆星說：在衝突中找到共識，是最難也最值得的事。',
    '正義不是懲罰，而是讓每個人都被公平對待。這顆主星為每一個勇於說「這樣不公平」的你。',
    '天秤座閃耀！平衡、合作、公正——你已擁有這個星座最美好的品質！',
  ],
  天蠍座: [
    '神話中的巨蠍，在黑暗中耐心等待最佳時機。第一顆主星，是專注力的象徵。',
    '天蠍座的眼睛能看穿表面，找到真相。這顆星說：不被表象迷惑，用心感受更深的東西。',
    '轉化是天蠍的超能力——就像蠍子蛻殼，舊的結束，新的開始。這顆星陪你勇敢改變。',
    '天蠍座的專注令人敬佩。這顆主星提醒你：當你全心投入一件事，就沒有做不到的。',
    '黑暗中的星光最閃亮。這顆星說：即使在最艱難的時刻，你的光芒依然存在。',
    '天蠍座完成！專注、探究、轉化——你已探索了這個深邃而有力的星座。繼續前行！',
  ],
  射手座: [
    '半人馬賢者喀戎，以知識與智慧指引英雄們。第一顆主星，是你探索之旅的第一支箭。',
    '射手的弓箭永遠指向遠方。這顆星說：眼光放遠，夢想要大一點，再大一點。',
    '喀戎雖身受傷，仍不停教導學生。這顆主星提醒你：真正的勇敢，是帶著傷口繼續前行。',
    '射手座熱愛自由，渴望探索未知。這顆星為每一個充滿好奇、想去看看世界的你而亮。',
    '每一次冒險都是一次成長。這顆主星說：不要等到準備好了才出發——出發，就是準備好了。',
    '射手座閃耀！探索、冒險、智慧——你的旅程還沒有終點，繼續朝著夢想飛翔吧！',
  ],
  摩羯座: [
    '山羊魚一步步攀登最險峻的山峰。第一顆主星，是你向上攀爬旅程的起點。',
    '摩羯座懂得「慢慢來，比較快」的道理。這顆星說：紀律不是限制，而是到達目標的翅膀。',
    '山羊在懸崖上穩步前行，從不慌亂。這顆主星提醒你：保持冷靜，一次解決一個問題。',
    '摩羯座的堅持令人敬佩。這顆星說：即使今天只前進了一小步，也比原地不動好一萬步。',
    '登山的人知道，最美的風景在最高處。這顆主星是你接近頂端的見證——你快到了！',
    '摩羯座完成！紀律、耐心、登高——你已展現了山羊最珍貴的品質。山頂的風景，值得！',
  ],
  水瓶座: [
    '捧水使者把生命之水帶給乾渴的大地。第一顆主星，象徵把好東西分享給世界的開始。',
    '水瓶座用不同的方式看世界，創造別人想不到的解法。這顆星為每一個獨特的想法喝彩。',
    '創新需要勇氣——因為不同，所以被誤解；但也因為不同，才能改變世界。這顆主星支持你。',
    '水瓶座的心胸寬廣，接受每一個不同的聲音。這顆星說：多元讓我們更豐富、更強大。',
    '真正的獨立，是能夠做自己，又能與他人和諧共存。這顆主星是你獨特個性的印記。',
    '水瓶座閃耀！創新、獨立、分享——你已走過這個充滿未來感的星座，繼續改變世界！',
  ],
  雙魚座: [
    '兩條魚兒相互守望，永遠不分離。第一顆主星，是同理心與連結的起點。',
    '雙魚座能感受別人的心情，彷彿靈魂之間有一條看不見的線。這顆星獻給善解人意的你。',
    '想像力是雙魚座的翅膀，帶你飛越現實的邊界。這顆主星說：讓夢想自由翱翔。',
    '雙魚座懂得以柔克剛——不是軟弱，而是用溫柔的方式，慢慢滲透、慢慢改變。',
    '兩條魚一起游，彼此支撐。這顆主星提醒你：在你最需要的時候，身邊一定有人陪著你。',
    '雙魚座完成！同理、想像、守望——你已走完十二星座的最後一章，這是一段了不起的旅程！',
  ],
};

function astronomyBlurb(sign: ZodiacInfo, starOrdinal: number, _totalStars: number): string {
  const blurbs = ZODIAC_BLURBS[sign.nameZh];
  if (blurbs && blurbs[starOrdinal - 1]) return blurbs[starOrdinal - 1]!;
  return `${sign.nameZh}的第 ${starOrdinal} 顆主星正在閃耀，帶著「${sign.meaning}」的精神繼續前進！`;
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
