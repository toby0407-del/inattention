let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let nodes: AudioNode[] = [];
let started = false;

function safeDisconnect(n: any) {
  try { n.disconnect?.(); } catch {}
}

export async function ensureBlueBgm() {
  if (started) return;

  const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
  if (!Ctx) return;

  audioCtx = audioCtx ?? new Ctx();
  if (audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch {}
  }

  master = audioCtx.createGain();
  master.gain.value = 0.06; // subtle
  master.connect(audioCtx.destination);

  // Two detuned sine pads + gentle noise through lowpass = "blue" ambient.
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 196; // G3
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 196.6;

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.55;

  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(padGain.gain);

  // Brown-ish noise (simple filtered white noise)
  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.08;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 650;
  noiseFilter.Q.value = 0.7;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.35;

  const outFilter = audioCtx.createBiquadFilter();
  outFilter.type = 'lowpass';
  outFilter.frequency.value = 1200;
  outFilter.Q.value = 0.6;

  osc1.connect(padGain);
  osc2.connect(padGain);
  padGain.connect(outFilter);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(outFilter);

  outFilter.connect(master);

  // Soft fade in
  const now = audioCtx.currentTime;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.06, now + 2.5);

  osc1.start();
  osc2.start();
  lfo.start();
  noise.start();

  nodes = [osc1, osc2, lfo, noise, noiseFilter, noiseGain, padGain, outFilter, master];
  started = true;
}

export function stopBlueBgm() {
  started = false;
  nodes.forEach(safeDisconnect);
  nodes = [];
  if (audioCtx) {
    try { audioCtx.close(); } catch {}
  }
  audioCtx = null;
  master = null;
}

