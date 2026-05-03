const STORAGE_KEY = 'focusquest-patient-ambient-v1';

/** 患者端可調的背景白噪音／底噪設定（存入 localStorage，全兒童端共用同一裝置設定） */
export type PatientAmbientConfig = {
  /** 是否在訓練地圖等場景自動播放背景聲 */
  enabled: boolean;
  /** 主音量 0–100 */
  volume: number;
  /** 高通：削低頻（Hz），越低越厚重；越高越輕脆 */
  highpassHz: number;
  /** 低通：削高頻（Hz）；越高越接近「亮」的白噪音 */
  lowpassHz: number;
  /** 和聲底（正弦漂移層）與沙沙聲的比例 0–100 */
  padBlend: number;
};

export function defaultPatientAmbient(): PatientAmbientConfig {
  return {
    enabled: true,
    volume: 52,
    highpassHz: 85,
    lowpassHz: 1750,
    padBlend: 48,
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function coerceConfig(p: Partial<PatientAmbientConfig> | null | undefined): PatientAmbientConfig {
  const d = defaultPatientAmbient();
  if (!p || typeof p !== 'object') return d;
  return {
    enabled: typeof p.enabled === 'boolean' ? p.enabled : d.enabled,
    volume: clamp(Number(p.volume) || d.volume, 0, 100),
    highpassHz: clamp(Number(p.highpassHz) || d.highpassHz, 20, 900),
    lowpassHz: clamp(Number(p.lowpassHz) || d.lowpassHz, 350, 12000),
    padBlend: clamp(Number(p.padBlend) || d.padBlend, 0, 100),
  };
}

export function loadPatientAmbient(): PatientAmbientConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPatientAmbient();
    return coerceConfig(JSON.parse(raw));
  } catch {
    return defaultPatientAmbient();
  }
}

export function savePatientAmbient(c: PatientAmbientConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coerceConfig(c)));
  } catch {
    /* ignore quota */
  }
}

/** 試聽或調滑桿時即時套用並寫入儲存，已啟動的聲音圖會跟著更新 */
export function applyPatientAmbientLive(c: PatientAmbientConfig) {
  const cfg = coerceConfig(c);
  savePatientAmbient(cfg);
  if (!started || !audioCtx || !master || !noiseHighpass || !noiseLowpass || !padGainRef) return;
  const now = audioCtx.currentTime;
  const targetGain = cfg.enabled ? volumeToGain(cfg.volume) : 0.0001;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(targetGain, now, 0.05);
  noiseHighpass.frequency.setTargetAtTime(cfg.highpassHz, now, 0.05);
  noiseLowpass.frequency.setTargetAtTime(cfg.lowpassHz, now, 0.05);
  padGainRef.gain.setTargetAtTime((cfg.padBlend / 100) * 0.58, now, 0.05);
}

export const patientAmbientPresets: { id: string; label: string; desc: string; config: Omit<PatientAmbientConfig, 'enabled'> }[] = [
  {
    id: 'soft',
    label: '柔霧',
    desc: '較闷、適合敏感',
    config: { volume: 42, highpassHz: 140, lowpassHz: 950, padBlend: 62 },
  },
  {
    id: 'neutral',
    label: '標準',
    desc: '平衡底色',
    config: { volume: 52, highpassHz: 85, lowpassHz: 1750, padBlend: 48 },
  },
  {
    id: 'bright',
    label: '清亮',
    desc: '較像你印象中的白噪音',
    config: { volume: 48, highpassHz: 45, lowpassHz: 5200, padBlend: 28 },
  },
];

function volumeToGain(v: number) {
  const t = clamp(v, 0, 100) / 100;
  return 0.012 + t * 0.11;
}

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseHighpass: BiquadFilterNode | null = null;
let noiseLowpass: BiquadFilterNode | null = null;
let padGainRef: GainNode | null = null;
let nodes: AudioNode[] = [];
let started = false;

function safeDisconnect(n: AudioNode | null | undefined) {
  try {
    n?.disconnect?.();
  } catch {
    /* */
  }
}

/** 進入患者端／地圖時呼叫：依設定啟動或保持靜音 */
export async function ensureBlueBgm() {
  const config = loadPatientAmbient();
  if (!config.enabled) {
    if (started && audioCtx && master) {
      const now = audioCtx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(0.0001, now, 0.06);
    }
    return;
  }

  const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined;
  if (!Ctx) return;

  if (started && audioCtx && master) {
    applyPatientAmbientLive(config);
    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch {
        /* */
      }
    }
    return;
  }

  audioCtx = audioCtx ?? new Ctx();
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
    } catch {
      /* */
    }
  }

  master = audioCtx.createGain();
  master.gain.value = 0.0001;
  master.connect(audioCtx.destination);

  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = 196;
  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = 196.6;

  padGainRef = audioCtx.createGain();
  padGainRef.gain.value = (config.padBlend / 100) * 0.58;

  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.08;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain);
  lfoGain.connect(padGainRef.gain);

  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.09;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;

  noiseHighpass = audioCtx.createBiquadFilter();
  noiseHighpass.type = 'highpass';
  noiseHighpass.frequency.value = config.highpassHz;
  noiseHighpass.Q.value = 0.7;

  noiseLowpass = audioCtx.createBiquadFilter();
  noiseLowpass.type = 'lowpass';
  noiseLowpass.frequency.value = config.lowpassHz;
  noiseLowpass.Q.value = 0.7;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.38;

  const outFilter = audioCtx.createBiquadFilter();
  outFilter.type = 'lowpass';
  outFilter.frequency.value = 9000;
  outFilter.Q.value = 0.55;

  osc1.connect(padGainRef);
  osc2.connect(padGainRef);
  padGainRef.connect(outFilter);

  noise.connect(noiseHighpass);
  noiseHighpass.connect(noiseLowpass);
  noiseLowpass.connect(noiseGain);
  noiseGain.connect(outFilter);

  outFilter.connect(master);

  const now = audioCtx.currentTime;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(volumeToGain(config.volume), now + 2.2);

  osc1.start();
  osc2.start();
  lfo.start();
  noise.start();

  nodes = [osc1, osc2, lfo, noise, noiseHighpass, noiseLowpass, noiseGain, padGainRef, outFilter, master];
  started = true;
}

export function stopBlueBgm() {
  started = false;
  nodes.forEach(n => safeDisconnect(n));
  nodes = [];
  noiseHighpass = null;
  noiseLowpass = null;
  padGainRef = null;
  if (audioCtx) {
    try {
      void audioCtx.close();
    } catch {
      /* */
    }
  }
  audioCtx = null;
  master = null;
}
