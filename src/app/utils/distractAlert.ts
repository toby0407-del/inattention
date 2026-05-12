/**
 * 視線偏離提示音（Web Audio API 合成「叮咚」雙音）。
 * 不用音檔，零 asset 依賴。
 *
 * iOS WebView 的 AudioContext 需要 user gesture 才能啟動，
 * 因此呼叫端應在進入遊戲時（按鈕點擊）先 primeDistractAlert() 一次。
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  } catch {
    return null;
  }
}

/** 在 user gesture 時呼叫，喚醒 audio context（iOS WebView 必要） */
export function primeDistractAlert(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => { /* swallow */ });
  }
  // 播一個極短靜音，確保 iOS 不會再次 block
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.01);
  } catch { /* swallow */ }
}

/** 播放兩個音的提示（高 → 低，類似「叮 咚」），約 0.6 秒 */
export function playDistractAlert(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => { /* swallow */ });
  }

  const now = ctx.currentTime;
  const playTone = (freq: number, startOffset: number, dur: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t0 = now + startOffset;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.03);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  playTone(987.77, 0, 0.22, 0.12);   // 高音 B5
  playTone(659.25, 0.24, 0.34, 0.12); // 低音 E5
}
