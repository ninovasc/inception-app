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

// Sintetizador associado a cada mundo (índice em SYNTH_PRESETS)
export const WORLD_SYNTH = [0, 1, 2, 3, 4, 0]; // Realidade→Zimmer, Chuva→Brass, Hotel→Sub Limbo, Fortaleza→Glass, Limbo→Binaural, Lúcido→Zimmer

// Presets de Voz por mundo (mesmos nomes)
export const WORLD_VOICE_PRESETS = {
  'Realidade': { gate: -25, delay: 0.06, feedback: 0.03, reverb: 0.08, dry: 0.92, wet: 0.08, pitch: 0 },
  'Chuva':     { gate: -35, delay: 0.15, feedback: 0.12, reverb: 0.25, dry: 0.80, wet: 0.20, pitch: 0 },
  'Hotel':     { gate: -40, delay: 0.30, feedback: 0.25, reverb: 0.40, dry: 0.70, wet: 0.30, pitch: 1 },
  'Fortaleza': { gate: -30, delay: 0.10, feedback: 0.08, reverb: 0.15, dry: 0.85, wet: 0.15, pitch: 0 },
  'Limbo':     { gate: -50, delay: 0.60, feedback: 0.45, reverb: 0.65, dry: 0.55, wet: 0.45, pitch: 3 },
  'Lúcido':    { gate: -35, delay: 0.20, feedback: 0.15, reverb: 0.35, dry: 0.75, wet: 0.25, pitch: 1 }
};

export const WORLD_NAMES = ['Realidade', 'Chuva', 'Hotel', 'Fortaleza', 'Limbo', 'Lúcido'];

// YouTube está temporariamente indisponível para o usuário.
// Todo o código do player permanece em js/youtube.js — basta mudar para true
// para reativar o botão "YT" na Fonte Sonora.
export const YOUTUBE_ENABLED = false;

// Normaliza o tipo de fonte salvo em seeds antigas/estados legados.
// 'upload' era o nome antigo de MP3; YouTube cai para Synth enquanto desativado.
export function normalizeSourceType(type) {
  const t = (type === 'upload') ? 'mp3' : type;
  if (t === 'youtube' && !YOUTUBE_ENABLED) return 'synth';
  return ['synth', 'mp3', 'youtube'].includes(t) ? t : 'synth';
}

// Progressões de acordes por nível (em semitons relativos à tônica)
export const CHORD_PROGRESSIONS = [
  [0, 5, 7, 5],     // 0 Realidade: I-IV-V-IV (alegre)
  [0, 3, 7, 5],     // 1 Chuva: I-III-V-IV (melancólico)
  [0, 5, 3, 7],     // 2 Hotel: I-IV-III-V
  [0, 3, 5, 7],     // 3 Fortaleza: I-III-IV-V
  [0, 3, 6, 5],     // 4 Limbo: I-III-tritone-IV (dissonante)
  [0, 7, 5, 3]      // 5 Lúcido: I-V-IV-III (etéreo)
];
