// ============================================================
// PASIV Engine — Configuração dos 13 Mundos (v3.0.0)
// A ordem dos mundos segue as faixas da OST. A prioridade dos
// gatilhos é CURADA (TRIGGER_DEFS) e independente desta ordem.
// ============================================================

export const LEVELS = [
  { name: 'Half Remembered Dream', speed: 1.00, filter: 18000, delay: 0.12, reverb: 0.30, bgColor: '#0d0d12' },
  { name: 'We Built Our Own World', speed: 1.18, filter: 16000, delay: 0.28, reverb: 0.30, bgColor: '#0a161a' },
  { name: 'Dream Is Collapsing',   speed: 0.46, filter: 680,   delay: 0.70, reverb: 0.85, bgColor: '#1a0a0a' },
  { name: 'Radical Notion',        speed: 0.92, filter: 9000,  delay: 0.45, reverb: 0.55, bgColor: '#0d1218' },
  { name: 'Old Souls',             speed: 0.80, filter: 2400,  delay: 0.35, reverb: 0.45, bgColor: '#120a12' },
  { name: '528491',                speed: 1.06, filter: 12000, delay: 0.18, reverb: 0.35, bgColor: '#0f0f1a' },
  { name: 'Mombasa',               speed: 1.15, filter: 14000, delay: 0.20, reverb: 0.25, bgColor: '#1a0f08' },
  { name: 'One Simple Idea',       speed: 0.98, filter: 8000,  delay: 0.30, reverb: 0.50, bgColor: '#0e1416' },
  { name: 'Dream Within a Dream',  speed: 0.62, filter: 1100,  delay: 0.55, reverb: 0.70, bgColor: '#0a1014' },
  { name: 'Waiting for a Train',   speed: 0.30, filter: 340,   delay: 0.84, reverb: 0.95, bgColor: '#080810' },
  { name: 'Paradox',               speed: 1.10, filter: 7000,  delay: 0.50, reverb: 0.40, bgColor: '#140a14' },
  { name: 'Time',                  speed: 0.72, filter: 5000,  delay: 0.60, reverb: 0.80, bgColor: '#100a18' },
  { name: 'Bonus Track',           speed: 0.78, filter: 1800,  delay: 0.38, reverb: 0.50, bgColor: '#120810' }
];

export const WORLD_NAMES = LEVELS.map(l => l.name);
export const WORLD_COUNT = WORLD_NAMES.length; // 13

// ============================================================
// SYNTH PRESETS — Organizados em duas categorias
// ============================================================

// Presets legados (v2.x) — índices 0–4. Mantidos para compatibilidade de seeds antigas.
// NÃO são atribuídos a mundos por padrão (WORLD_SYNTH usa 5–17).
export const LEGACY_SYNTH_PRESETS = [
  { name: 'Zimmer Ambient', freqs: [36.71, 73.42, 110.0, 146.83], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.22, 0.14, 0.08, 0.06], lfo: 0 },
  { name: 'Brass Drone',    freqs: [55.0, 110.0, 164.81, 220.0],  types: ['triangle', 'sawtooth', 'triangle', 'sine'], gains: [0.18, 0.06, 0.09, 0.05], lfo: 0.15 },
  { name: 'Sub Limbo',      freqs: [32.70, 49.00, 65.41, 98.00],  types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.28, 0.15, 0.10, 0.05], lfo: 0.08 },
  { name: 'Glass Choir',    freqs: [220.0, 329.63, 440.0, 659.25], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.10, 0.08, 0.06, 0.04], lfo: 0.25 },
  { name: 'Binaural Pulse', freqs: [110.0, 114.5, 220.0, 226.0],  types: ['sine', 'sine', 'sine', 'sine'], gains: [0.16, 0.16, 0.07, 0.07], lfo: 0 }
];

// 13 presets novos (um por mundo, índices 5–17). Campos opcionais consumidos pelo motor:
// pluck {gain,bpm} | pulse {gain,bpm,offbeat} | noise {gain,freq} |
// drift (profundidade do wobble) | binaural (ΔHz) | bpm (tempo do mundo)
export const WORLD_SYNTH_PRESETS = [
  { name: 'Half Dream Pad',    freqs: [55.0, 110.0, 164.81, 220.0],  types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.20, 0.12, 0.08, 0.05], lfo: 0.05, noise: { gain: 0.015, freq: 400 }, drift: 0.0010 },
  { name: 'Architect Pluck',   freqs: [65.41, 130.81, 196.0, 261.63], types: ['sine', 'triangle', 'sine', 'triangle'], gains: [0.18, 0.10, 0.07, 0.05], lfo: 0.10, pluck: { gain: 0.10, bpm: 72 }, bpm: 72 },
  { name: 'Collapse Drone',    freqs: [36.71, 73.42, 92.50, 110.0],  types: ['sine', 'sine', 'sawtooth', 'triangle'], gains: [0.26, 0.14, 0.05, 0.07], lfo: 0.06, pulse: { gain: 0.10, bpm: 60 }, noise: { gain: 0.020, freq: 150 }, drift: 0.0040, bpm: 60 },
  { name: 'Radical Strings',   freqs: [82.41, 110.0, 164.81, 207.65], types: ['sawtooth', 'sawtooth', 'triangle', 'sine'], gains: [0.08, 0.07, 0.06, 0.05], lfo: 0.20, pulse: { gain: 0.07, bpm: 96 }, drift: 0.0020, bpm: 96 },
  { name: 'Old Souls Piano',   freqs: [110.0, 164.81, 220.0, 329.63], types: ['triangle', 'sine', 'sine', 'sine'], gains: [0.14, 0.09, 0.07, 0.05], lfo: 0.08, pluck: { gain: 0.12, bpm: 68 }, bpm: 68 },
  { name: 'Combination Blips', freqs: [130.81, 261.63, 392.0, 523.25], types: ['square', 'sine', 'sine', 'sine'], gains: [0.06, 0.05, 0.04, 0.03], lfo: 0, pulse: { gain: 0.09, bpm: 84 }, bpm: 84 },
  { name: 'Mombasa Pulse',     freqs: [82.41, 164.81, 196.0, 246.94], types: ['square', 'triangle', 'sine', 'triangle'], gains: [0.09, 0.08, 0.06, 0.05], lfo: 0.15, pulse: { gain: 0.12, bpm: 120 }, pluck: { gain: 0.08, bpm: 120 }, bpm: 120 },
  { name: 'Pure Idea',         freqs: [130.81, 196.0, 261.63, 392.0], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.12, 0.07, 0.05, 0.03], lfo: 0, binaural: 4, drift: 0.0004 },
  { name: 'Nested Pads',       freqs: [98.0, 146.83, 196.0, 293.66], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.16, 0.10, 0.08, 0.05], lfo: 0.12, drift: 0.0060, pulse: { gain: 0.04, bpm: 56 }, bpm: 56 },
  { name: 'Station Drone',     freqs: [55.0, 82.41, 110.0, 164.81],  types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.20, 0.10, 0.08, 0.05], lfo: 0.04, noise: { gain: 0.025, freq: 800 }, pulse: { gain: 0.05, bpm: 100 }, bpm: 100 },
  { name: 'Paradox Loop',      freqs: [61.74, 65.41, 123.47, 130.81], types: ['triangle', 'triangle', 'sine', 'sine'], gains: [0.12, 0.12, 0.06, 0.06], lfo: 0.09, drift: 0.0080, pulse: { gain: 0.05, bpm: 90 }, bpm: 90 },
  { name: 'Time Bell',         freqs: [46.25, 92.5, 185.0, 233.08],  types: ['sine', 'sine', 'triangle', 'sine'], gains: [0.22, 0.14, 0.06, 0.05], lfo: 0.03, pluck: { gain: 0.09, bpm: 48 }, drift: 0.0015, bpm: 48 },
  { name: 'Old Souls Bonus',   freqs: [98.0, 146.83, 196.0, 293.66], types: ['triangle', 'sine', 'sine', 'sine'], gains: [0.15, 0.10, 0.07, 0.05], lfo: 0.06, drift: 0.0120, noise: { gain: 0.012, freq: 600 }, pulse: { gain: 0.04, bpm: 68, offbeat: true }, bpm: 68 }
];

// SYNTH_PRESETS combinado (legados + novos) — mantido para compatibilidade de código existente
// Índices 0–4 = legados, 5–17 = novos (um por mundo na ordem de WORLD_NAMES)
export const SYNTH_PRESETS = [...LEGACY_SYNTH_PRESETS, ...WORLD_SYNTH_PRESETS];

export const LUCID_MODES = [0, 15, 30, 60]; // minutos

// Sintetizador padrão de cada mundo (índice em SYNTH_PRESETS).
// 0 HRD→Half Dream Pad, 1 WBOW→Architect Pluck, 2 DIC→Collapse Drone,
// 3 RN→Radical Strings, 4 OS→Old Souls Piano, 5 528491→Combination Blips,
// 6 Mombasa→Mombasa Pulse, 7 OSI→Pure Idea, 8 DWaD→Nested Pads,
// 9 WFaT→Station Drone, 10 Paradox→Paradox Loop, 11 Time→Time Bell,
// 12 Bonus→Old Souls Bonus
export const WORLD_SYNTH = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

// Presets de Voz por mundo (microfone).
export const WORLD_VOICE_PRESETS = {
  'Half Remembered Dream': { gate: -25, delay: 0.06, feedback: 0.03, reverb: 0.08, dry: 0.92, wet: 0.08, pitch: 0 },
  'We Built Our Own World': { gate: -35, delay: 0.20, feedback: 0.15, reverb: 0.35, dry: 0.75, wet: 0.25, pitch: 1 },
  'Dream Is Collapsing':   { gate: -30, delay: 0.10, feedback: 0.08, reverb: 0.15, dry: 0.85, wet: 0.15, pitch: 0 },
  'Radical Notion':        { gate: -28, delay: 0.12, feedback: 0.10, reverb: 0.20, dry: 0.82, wet: 0.18, pitch: 0 },
  'Old Souls':             { gate: -35, delay: 0.15, feedback: 0.12, reverb: 0.25, dry: 0.80, wet: 0.20, pitch: 0 },
  '528491':                { gate: -30, delay: 0.08, feedback: 0.06, reverb: 0.12, dry: 0.88, wet: 0.12, pitch: 0 },
  'Mombasa':               { gate: -22, delay: 0.05, feedback: 0.02, reverb: 0.06, dry: 0.95, wet: 0.05, pitch: 0 },
  'One Simple Idea':       { gate: -38, delay: 0.25, feedback: 0.18, reverb: 0.30, dry: 0.75, wet: 0.25, pitch: 0 },
  'Dream Within a Dream':  { gate: -40, delay: 0.30, feedback: 0.25, reverb: 0.40, dry: 0.70, wet: 0.30, pitch: 1 },
  'Waiting for a Train':   { gate: -50, delay: 0.60, feedback: 0.45, reverb: 0.65, dry: 0.55, wet: 0.45, pitch: 3 },
  'Paradox':               { gate: -45, delay: 0.40, feedback: 0.30, reverb: 0.45, dry: 0.62, wet: 0.38, pitch: -1 },
  'Time':                  { gate: -32, delay: 0.35, feedback: 0.22, reverb: 0.55, dry: 0.65, wet: 0.35, pitch: 0 },
  'Bonus Track':           { gate: -38, delay: 0.18, feedback: 0.15, reverb: 0.35, dry: 0.72, wet: 0.28, pitch: 0 }
};

// Gatilhos de mundo (Modo Automático) — 13 regras, uma por mundo.
// A ORDEM deste array é a prioridade curada: raro/específico primeiro,
// repouso (fallback) por último. A avaliação é exclusiva: a primeira
// regra verdadeira escolhe o mundo. Destino remapeável pela UI.
// -1 desativa a regra. 'fallback' nunca fica desativado.
export const TRIGGER_DEFS = [
  { key: 'bonusRain',    label: 'Chuva intensa (Mic)',       sensor: 'Mic' },
  { key: 'clap',         label: 'Duas palmas (Mic)',         sensor: 'Mic' },
  { key: 'inverted',     label: 'Aparelho invertido (Giro)', sensor: 'Giro' },
  { key: 'freefall',     label: 'Queda livre (O Chute)',     sensor: 'Giro' },
  { key: 'motion',       label: 'Movimento (Giro)',          sensor: 'Giro' },
  { key: 'vehicle',      label: 'Veículo (GPS)',             sensor: 'GPS' },
  { key: 'sessionStart', label: 'Início da sessão',          sensor: 'Sessão' },
  { key: 'silence',      label: 'Silêncio (Mic)',            sensor: 'Mic' },
  { key: 'rain',         label: 'Chuva (GPS)',               sensor: 'GPS' },
  { key: 'flat',         label: 'Aparelho apoiado (Giro)',   sensor: 'Giro' },
  { key: 'night',        label: 'Noite (GPS)',               sensor: 'GPS' },
  { key: 'sessionLong',  label: 'Sessão longa (recompensa)', sensor: 'Sessão' },
  { key: 'fallback',     label: 'Sem gatilho',               sensor: 'Repouso' }
];

export const DEFAULT_WORLD_TRIGGERS = {
  bonusRain: 12, clap: 5, inverted: 10, freefall: 2, motion: 6,
  vehicle: 3, sessionStart: 7, silence: 8, rain: 4, flat: 1,
  night: 9, sessionLong: 11, fallback: 0
};

export const DEFAULT_TRIGGER_MOTION = 0.6;
export const DEFAULT_TRIGGER_SILENCE_SEC = 30;

// Constantes dos sensores novos (valores internos; motion e silêncio
// continuam configuráveis pela UI e vão para a seed).
export const TRIGGER_CLAP_WINDOW_SEC = 2.5;   // janela entre duas palmas
export const TRIGGER_INVERTED_HOLD_SEC = 2;   // |beta| > 135° sustentado
export const TRIGGER_FLAT_HOLD_SEC = 30;      // aparelho apoiado (|beta|,|gamma| <= 15°)
export const TRIGGER_INVERTED_DEG = 135;
export const TRIGGER_FLAT_DEG = 15;
export const MIC_RAIN_INTENSE_DB = -14;       // chuva intensa: nível do mic acima deste dB
export const MIC_RAIN_INTENSE_HOLD_SEC = 6;
export const GPS_VEHICLE_SPEED_MPS = 5.5;     // velocidade de veículo (Radical Notion)
export const SESSION_START_WINDOW_SEC = 25;   // janela inicial (One Simple Idea)
export const SESSION_LONG_SEC = 1200;         // 20 min (recompensa Time)
export const TIME_REWARD_SEC = 75;            // duração da passagem por Time

// Ordem curada em índices de mundo (referência/documentação; a avaliação
// real usa a ordem de TRIGGER_DEFS, pois os destinos são remapeáveis).
export const CURATED_PRIORITY = [12, 5, 10, 2, 6, 3, 7, 8, 4, 1, 9, 11, 0];

// Migração v2 → v3: mundo antigo (índice 0–5) → mundo novo (0–12).
// Realidade→HRD, Chuva→Old Souls, Hotel→DWaD, Fortaleza→DIC,
// Limbo→WFaT, Lúcido→WBOW
export const OLD6_TO_NEW13 = [0, 4, 8, 2, 9, 1];

// Chaves dos 6 gatilhos legados (para migração de seeds).
export const LEGACY_TRIGGER_KEYS = ['freefall', 'rain', 'night', 'silence', 'motion', 'fallback'];

// Garante um mapeamento válido vindo de seeds antigas/edições manuais.
export function normalizeWorldTriggers(raw) {
  const out = { ...DEFAULT_WORLD_TRIGGERS };
  if (!raw || typeof raw !== 'object') return out;
  for (const { key } of TRIGGER_DEFS) {
    const v = raw[key];
    if (Number.isInteger(v) && v >= 0 && v < WORLD_COUNT) out[key] = v;
    else if (v === -1 && key !== 'fallback') out[key] = -1;
  }
  return out;
}

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

// Progressões de acordes por mundo (em semitons relativos à tônica)
export const CHORD_PROGRESSIONS = [
  [0, 5, 3, 5],    // 0 Half Remembered Dream: flutuante (Am–Fmaj7)
  [0, 9, 5, 7],    // 1 We Built Our Own World: luminoso (Cmaj7–Am7–Fmaj7–G)
  [0, 8, 3, 10],   // 2 Dream Is Collapsing: colapso descendente (Dm–Bb–Gm–A)
  [0, 1, 0, 1],    // 3 Radical Notion: tensão cromática (Em–F)
  [0, 7, 8, 3],    // 4 Old Souls: melancolia (Am–Em–F–C)
  [0, 8, 0, 8],    // 5 528491: combinação (Cm–Ab)
  [0, 3, 5, 7],    // 6 Mombasa: riff energético (Em)
  [0, 7, 4, 7],    // 7 One Simple Idea: pedal (C)
  [0, 8, 10, 5],   // 8 Dream Within a Dream: camadas (Gm–Eb–Bb–F)
  [0, 10, 8, 7],   // 9 Waiting for a Train: espera descendente (Am–G–F–Em)
  [0, 1, 7, 1],    // 10 Paradox: loop que não resolve (B–C)
  [0, 7, 2, 8],    // 11 Time: hino (Bb–F–Gm–Eb)
  [0, 5, 8, 10]    // 12 Bonus Track: Old Souls reharmonizada (Gm–C–Eb–Bb)
];
