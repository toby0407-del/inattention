import { getLevelMeta, type LevelMode } from '../data/levels';

function modeLabelCn(mode: LevelMode): string {
  switch (mode) {
    case 'spot':
      return '找不同';
    case 'jigsaw':
      return '拼圖';
    case 'order':
      return '順序排列';
    case 'memory':
      return '記憶配對';
    default:
      return '挑戰';
  }
}

function fallback(score: number, mode: LevelMode, title: string) {
  if (score >= 92) return `超棒！你在「${title}」表現很穩，專注力像滿格能量一樣。下一關也一起加油！`;
  if (score >= 80) return `很不錯！「${title}」這關完成得很漂亮，再多一點點就更接近滿分專注了。`;
  return `完成就很厲害了！「${title}」這關先穩穩過，下一次我們一起把專注拉得更久。`;
}

export async function generateEncouragement({
  levelId,
  mode,
  score,
}: {
  levelId: number;
  mode: LevelMode;
  score: number;
}) {
  const level = getLevelMeta(levelId);
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return fallback(score, mode, level.story.title);

  const prompt = [
    '你是一個兒童復健/專注訓練遊戲的溫暖教練。',
    '請用繁體中文，產生 1~2 句、總長不超過 50 字的鼓勵評語。',
    '避免使用「AI」「模型」等字眼；避免誇大療效；語氣親切、具體、正向。',
    `關卡：第${level.id}關`,
    `故事：${level.story.title}`,
    `模式：${modeLabelCn(mode)}`,
    `專注分數：${score}/100`,
    `收集物：${level.collectible.emoji} ${level.collectible.name}`,
  ].join('\n');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 80,
          },
        }),
      },
    );
    if (!res.ok) return fallback(score, mode, level.story.title);
    const data: any = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ??
      '';
    const cleaned = String(text).replace(/\s+/g, ' ').trim();
    return cleaned.length ? cleaned : fallback(score, mode, level.story.title);
  } catch {
    return fallback(score, mode, level.story.title);
  }
}

