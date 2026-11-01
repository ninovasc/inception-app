export const LEVELS = [
  { name: 'Realidade', speed: 1.00, filter: 18000, delay: 0.12, reverb: 0.30 },
  { name: 'Chuva', speed: 0.80, filter: 2400, delay: 0.35, reverb: 0.45 },
  { name: 'Hotel', speed: 0.62, filter: 1100, delay: 0.55, reverb: 0.70 },
  { name: 'Fortaleza', speed: 0.46, filter: 680, delay: 0.70, reverb: 0.85 },
  { name: 'Limbo', speed: 0.30, filter: 340, delay: 0.84, reverb: 0.95 },
  { name: 'Lúcido', speed: 1.18, filter: 16000, delay: 0.28, reverb: 0.30 }
];

export const SYNTH_PRESETS = [
  { name: 'Zimmer Ambient', freqs: [36.71, 73.42, 110.0, 146.83], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.22, 0.14, 0.08, 0.06], lfo: 0 },
  { name: 'Brass Drone', freqs: [55.0, 110.0, 164.81, 220.0], types: ['triangle', 'sawtooth', 'triangle', 'sine'], gains: [0.18, 0.06, 0.09, 0.05], lfo: 0.15 },
  { name: 'Sub Limbo', freqs: [32.70, 49.00, 65.41, 98.00], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.28, 0.15, 0.10, 0.05], lfo: 0.08 },
  { name: 'Glass Choir', freqs: [220.0, 329.63, 440.0, 659.25], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.10, 0.08, 0.06, 0.04], lfo: 0.25 },
  { name: 'Binaural Pulse', freqs: [110.0, 114.5, 220.0, 226.0], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.16, 0.16, 0.07, 0.07], lfo: 0 }
];

export const LUCID_MODES = [0, 15, 30, 60]; // minutos

// Progressões de acordes por nível (em semitons relativos à tônica)
export const CHORD_PROGRESSIONS = [
  [0, 5, 7, 5],     // 0 Realidade: I-IV-V-IV (alegre)
  [0, 3, 7, 5],     // 1 Chuva: I-III-V-IV (melancólico)
  [0, 5, 3, 7],     // 2 Hotel: I-IV-III-V
  [0, 3, 5, 7],     // 3 Fortaleza: I-III-IV-V
  [0, 3, 6, 5],     // 4 Limbo: I-III-tritone-IV (dissonante)
  [0, 7, 5, 3]      // 5 Lúcido: I-V-IV-III (etéreo)
];
