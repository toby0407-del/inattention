/**
 * 預存教練風評語（繁中），不依賴即時呼叫模型；與 Gemini 並用時可在失敗或未設金鑰時維持多樣性。
 * 佔位：`{title}` 關卡故事標題、`{emoji}` 收集物、`{modeCn}` 模式、`{score}` 分數、`{levelId}` 關卡編號
 */

export type EncourageCtx = {
  levelId: number;
  title: string;
  modeCn: string;
  emoji: string;
  score: number;
};

function fnv1aMix(seed: number, s: string) {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 同一關／模式／分數組合對應同一則評語（重玩可換分數來換句）；請避免每局完全隨機 */
export function pickStoredEncouragement(ctx: EncourageCtx): string {
  const tier = ctx.score >= 92 ? HIGH : ctx.score >= 80 ? MID : LOW;
  const salt = fnv1aMix(ctx.levelId * 73856093, ctx.modeCn) ^ fnv1aMix(Math.round(ctx.score) * 19349663, ctx.title);
  const idx = salt % tier.length;
  let tpl = tier[idx]!;
  tpl = tpl.replace(/\{title\}/g, ctx.title);
  tpl = tpl.replace(/\{emoji\}/g, ctx.emoji);
  tpl = tpl.replace(/\{modeCn\}/g, ctx.modeCn);
  tpl = tpl.replace(/\{score\}/g, String(Math.round(ctx.score)));
  tpl = tpl.replace(/\{levelId\}/g, String(ctx.levelId));
  return tpl.replace(/\s+/g, ' ').trim();
}

/** 約 92+：穩健高分 */
const HIGH: readonly string[] = [
  '太強了！{title}{emoji} 這段你像小探險家一樣鎖得好，{score}分超亮眼！',
  '哇——{score}！你在「{title}」把心收得好集中，繼續保持這種節奏！',
  '高分收下！「{title}」的{modeCn}你做得很俐落，{emoji}準備收下你的榮耀～',
  '真穩。「{title}」這題你眼神跟手都對上了，下一次也可以試著再放松肩頸試試。',
  '{score}分漂亮！謝謝你在「{title}」這麼專心地陪自己進步。',
  '你剛剛像在「細心放大鏡」模式！{title}完成得又快又準，{emoji}也為你開心。',
  '好厲害的專注力充電。「{title}」一路跟上，很值得給你一個大大的讚。',
  '這種表現像在練「心裡的小小雷達」，{title}抓重點抓得很準呢。',
  '超棒協調。「{title}」裡你一直回到目標上，這是很珍貴的能力。',
  '今天這局像順風順水的小船。「{title}」你照顧細節，也守住大方向。',
  '穩中求好！你在「{title}」把注意力放在該停留的地方，{score}分當之無愧。',
  '像小運動員一樣專業。「{title}」這趟你沒走神，很值得延續到下一題。',
  '你的耐心有聲音。「{title}」這樣細膩地完成，對大腦是很溫柔的鍛鍊。',
  '做得像節奏大師。「{title}」的{modeCn}步步到位，請記得誇一下自己。',
  '高分不是偶然，是你剛剛選擇專心的結果。「{title}」，做得好。',
  '{emoji}幫你鼓掌！你在「{title}」把注意力聚成一束光，清清楚楚。',
  '今天像開了「專注護盾」。「{title}」干擾沒騙過你太多，非常棒。',
  '你讓這關變得像故事高潮。「{title}」順利收尾，準備迎接更多冒險！',
  '{score}，扎實！「{title}」這段你的眼睛像停在小錨點上，很棒。',
  '像溫和的火焰，穩又不散。「{title}」做得很好，請延續這份安心感。',
  '你剛剛的專注像在走鋼索卻很穩。「{title}」請把這種「收心」帶到日常也很棒。',
  '{modeCn}對你來說已是舒適圈邊緣的挑戰。「{title}」你站住了，{score}很好。',
  '像把雜音轉小聲。「{title}」你讓重要的事浮上來，這是超能力。',
];

/** 約 80–91：可圈可點、微修正 */
const MID: readonly string[] = [
  '完成啦！「{title}」{emoji}你已經把大部分細節顧好了，只差一咪咪就更完美。',
  '很可以！{score}分的「{title}」可圈可點，下次試著把視線在目標多停半拍。',
  '做得好，還可以更酷。「{title}」你已經找到節奏了，只差把失誤變成小火花。',
  '這局像慢跑：穩但有加速空間。「{title}」請記得你已經在進步線上。',
  '讚喔。「{title}」的{modeCn}你已經懂玩法了，再練會更順。',
  '{score}不差！謝謝你在「{title}」把心留下來陪我們一起走。',
  '小英雄，這關你走過來了。「{title}」下一趟我們把「慢一点、准一点」當魔咒。',
  '你的努力很明顯。「{title}」差一點點就上高分，非常值得再玩一次試手感。',
  '像剛睡醒的晨光，柔柔的但很真。「{title}」再集中注意力就會更好。',
  '完成就是加分。「{title}」你已經有結構感了，接下來細修就好。',
  '給你一個拍手。「{title}」這種分數代表你在學會「拉回來」，超重要。',
  '很棒的練習局。「{title}」把注意力當成小皮球，接住、再輕輕放回桌面。',
  '今天的故事有轉折！「{title}」你已經通過主線，接下來可以更勇敢。',
  '像溫和的風。「{title}」還可以更穩；記得眨眼、深呼吸，再開始下一題。',
  '做到這裡很厲害。「{title}」的{modeCn}你在熟悉感裡進步。',
  '{emoji}也說不錯！「{title}」你已經觸到技巧的邊緣。',
  '{score}，像爬坡一半：視野已經不同。「{title}」請相信自己正在變強。',
  '把注意力當成小寵物養。「{title}」剛才它偶有跑掉，你已經學會叫回來了。',
  '很棒的中繼站。「{title}」離「超穩高分」只差一點細節，慢慢來就很好。',
  '{modeCn}這次有亮點。「{title}」你抓到幾個關鍵節拍，把它們養大吧。',
  '不是滿分也很好。「{title}」{score}代表你在真實練習，而不是假裝完美。',
  '像把拼圖對上邊。「{title}」形狀對了，接下來只要補縫就好。',
];

/** &lt;78：完成即成就、強調嘗試與拉回 */
const LOW: readonly string[] = [
  '你完成了。「{title}」能走到這裡，本身就是勇氣與耐心的證明，{emoji}陪你一起下一站。',
  '了不起，沒逃跑。「{title}」分心很正常，你已經在練最重要的「拉回來」。',
  '這關像陡坡，但你沒撒手。「{title}」請喝口水，下一趟我們用更慢的節奏。',
  '做得很好：你願意試。「{title}」大腦剛開始排線，請給它多幾次機會。',
  '完成就代表你沒放弃。「{title}」把注意力想成肌肉，這局已經在伸展了。',
  '辛苦啦。「{title}」這個{modeCn}對很多人都不簡單；再玩一次會更親切。',
  '像小種子發芽前要休息。「{title}」你已經把土鬆過了。',
  '{score}又如何？你敢挑戰就值得誇。「{title}」，我們慢慢把路走寬。',
  '今天的故事還會續。「{title}」你剛寫下一個「未完待續」，很好。',
  '給你一個安全的擁抱感。「{title}」卡住沒關係，卡住也是訓練的一部分。',
  '像學騎車，晃幾次就會順。「{title}」你已經在感受平衡了。',
  '注意力跑掉不是失敗。「{title}」重點是：你有回來。',
  '{emoji}在等你。「{title}」下一局只要多一次深呼吸，就是大進步。',
  '慢一點，比較像高手。「{title}」請把「看清再動」放在心上。',
  '你很勇敢。「{title}」不完美也漂亮，不完美代表還有可玩的空間。',
  '像你喜歡的遊戲一樣，可以重來。「{title}」請把下一次當bonus關。',
  '耳朵聽見你的努力。「{title}」即使分數矮一點，你的堅持很響。',
  '{levelId}關你已經點亮了足跡。「{title}」下一趟我們只比昨天多一個小專注就好。',
  '分心像雲，來了會走。「{title}」你只要在雲縫裡找陽光就很好。',
  '{modeCn}還在熟悉中，沒關係。「{title}」你願意試，已經領先很多。',
  '{score}提醒你：今天的大腦很努力。「{title}」休息也是訓練的一環。',
];
