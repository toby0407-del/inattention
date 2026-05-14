import { getLevelMeta, type LevelMode } from '../data/levels';
import { pickStoredEncouragement } from '../data/storedCoachEncouragements';

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

function encouragementFromStore(levelId: number, mode: LevelMode, score: number, title: string, collectibleEmoji: string) {
  return pickStoredEncouragement({
    levelId,
    title,
    modeCn: modeLabelCn(mode),
    emoji: collectibleEmoji,
    score,
  });
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
  if (!apiKey) {
    return encouragementFromStore(levelId, mode, score, level.story.title, level.collectible.emoji);
  }

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
    if (!res.ok) {
      return encouragementFromStore(levelId, mode, score, level.story.title, level.collectible.emoji);
    }
    const data: any = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('') ??
      '';
    const cleaned = String(text).replace(/\s+/g, ' ').trim();
    return cleaned.length
      ? cleaned
      : encouragementFromStore(levelId, mode, score, level.story.title, level.collectible.emoji);
  } catch {
    return encouragementFromStore(levelId, mode, score, level.story.title, level.collectible.emoji);
  }
}

