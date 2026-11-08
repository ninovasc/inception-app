// ============================================================
// PASIV Engine — Configuração dos 13 Mundos (v4.0.3)
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

// NÃO são atribuídos a mundos por padrão (WORLD_SYNTH usa 5–17).
const LEGACY_SYNTH_PRESETS = [
  { name: 'Zimmer Ambient', freqs: [36.71, 73.42, 110.0, 146.83], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.22, 0.14, 0.08, 0.06], lfo: 0 },
  { name: 'Brass Drone',    freqs: [55.0, 110.0, 164.81, 220.0],  types: ['triangle', 'sawtooth', 'triangle', 'sine'], gains: [0.18, 0.06, 0.09, 0.05], lfo: 0.15 },
  { name: 'Sub Limbo',      freqs: [32.70, 49.00, 65.41, 98.00],  types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.28, 0.15, 0.10, 0.05], lfo: 0.08 },
  { name: 'Glass Choir',    freqs: [220.0, 329.63, 440.0, 659.25], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.10, 0.08, 0.06, 0.04], lfo: 0.25 },
  { name: 'Binaural Pulse', freqs: [110.0, 114.5, 220.0, 226.0],  types: ['sine', 'sine', 'sine', 'sine'], gains: [0.16, 0.16, 0.07, 0.07], lfo: 0 }
];

// 13 presets novos (um por mundo, índices 5–17). Campos opcionais consumidos pelo motor:
// pluck {gain,bpm} | pulse {gain,bpm,offbeat} | noise {gain,freq} |
// drift (profundidade do wobble) | binaural (ΔHz) | bpm (tempo do mundo)
const WORLD_SYNTH_PRESETS = [
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
const CURATED_PRIORITY = [12, 5, 10, 2, 6, 3, 7, 8, 4, 1, 9, 11, 0];

// Migração v2 → v3: mundo antigo (índice 0–5) → mundo novo (0–12).
// Realidade→HRD, Chuva→Old Souls, Hotel→DWaD, Fortaleza→DIC,
// Limbo→WFaT, Lúcido→WBOW
export const OLD6_TO_NEW13 = [0, 4, 8, 2, 9, 1];

export const LEGACY_TRIGGER_KEYS = ['freefall', 'rain', 'night', 'silence', 'motion', 'fallback'];

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

// 'upload' era o nome antigo de MP3.
export function normalizeSourceType(type) {
  const t = (type === 'upload') ? 'mp3' : type;
  return ['synth', 'mp3'].includes(t) ? t : 'synth';
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

// ============================================================
// MODO POMODORO — 2 Mundos: Atividade (Foco) + Descanso
// ============================================================

// Sínteses específicas para Pomodoro
const POMODORO_SYNTH_PRESETS = [
  // 0 — Atividade (Focus): Beta/Gamma, pulse ritmado, binaural 40Hz
  { name: 'Focus Pulse', freqs: [180, 200, 400, 800], types: ['square', 'sawtooth', 'square', 'sine'], gains: [0.08, 0.06, 0.04, 0.03], pulse: { gain: 0.12, bpm: 60, offbeat: false }, binaural: 40, drift: 0.0005, bpm: 60 },
  // 1 — Descanso (Break): Alpha/Theta, drift lento, pads suaves
  { name: 'Break Drift', freqs: [85, 110, 170, 220], types: ['sine', 'triangle', 'sine', 'sine'], gains: [0.15, 0.10, 0.07, 0.05], drift: 0.008, noise: { gain: 0.015, freq: 200 }, pulse: { gain: 0.04, bpm: 10, offbeat: true }, bpm: 10 }
];

// Mundos do Pomodoro (2 mundos)
export const POMODORO_LEVELS = [
  { name: 'Atividade', speed: 1.00, filter: 18000, delay: 0.12, reverb: 0.30, bgColor: '#0a1418' },
  { name: 'Descanso', speed: 0.95, filter: 8000, delay: 0.30, reverb: 0.50, bgColor: '#0a1210' }
];

export const POMODORO_WORLD_NAMES = POMODORO_LEVELS.map(l => l.name);
export const POMODORO_WORLD_COUNT = POMODORO_LEVELS.length; // 2

// Sintetizador padrão para cada mundo Pomodoro (índice em POMODORO_SYNTH_PRESETS)
export const POMODORO_WORLD_SYNTH = [0, 1];

// Progressões de acordes Pomodoro
export const POMODORO_CHORD_PROGRESSIONS = [
  [0, 7, 3, 7],    // Atividade: pedal maior (foco)
  [0, 5, 3, 5]     // Descanso: flutuante (relax)
];

// Configurações padrão do timer Pomodoro
export const POMODORO_DEFAULTS = {
  activityDuration: 25 * 60,      // 25 min
  shortBreakDuration: 5 * 60,     // 5 min
  longBreakDuration: 15 * 60,     // 15 min
  cyclesUntilLongBreak: 4
};

// ============================================================
// MODO SONO — 8 Mundos = 8 Batidas Binaurais/Isocrônicas
// ============================================================

// Sínteses para Sono (binaural/isocrônico puro)
export const SLEEP_SYNTH_PRESETS = [
  // 0 — Delta Profundo (0.5-2 Hz) — Binaural
  { name: 'Delta Profundo', freqs: [100, 100.5, 200, 201], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.20, 0.20, 0.10, 0.10], binaural: 1.0, drift: 0.0002, bpm: 0 },
  // 1 — Delta Sono (1-3 Hz) — Binaural
  { name: 'Delta Sono', freqs: [100, 102, 200, 204], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.18, 0.18, 0.09, 0.09], binaural: 2.0, drift: 0.0003, bpm: 0 },
  // 2 — Theta Meditação (4-7 Hz) — Binaural
  { name: 'Theta Meditação', freqs: [100, 105, 200, 210], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.16, 0.16, 0.08, 0.08], binaural: 5.0, drift: 0.0005, bpm: 0 },
  // 3 — Theta Sono (5-6 Hz) — Isocrônico
  { name: 'Theta Sono', freqs: [100, 200, 300, 400], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.15, 0.10, 0.06, 0.04], pulse: { gain: 0.10, bpm: 5.5 }, drift: 0.001, bpm: 5.5 },
  // 4 — Alpha Relax (8-12 Hz) — Binaural
  { name: 'Alpha Relax', freqs: [100, 110, 200, 220], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.14, 0.14, 0.07, 0.07], binaural: 10.0, drift: 0.0004, bpm: 0 },
  // 5 — Alpha Isocrônico (10 Hz) — Isocrônico
  { name: 'Alpha Isocrônico', freqs: [100, 200, 300, 400], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.12, 0.08, 0.05, 0.03], pulse: { gain: 0.08, bpm: 10 }, drift: 0.0005, bpm: 10 },
  // 6 — SMR 12-15 Hz — Binaural
  { name: 'SMR 13Hz', freqs: [100, 113, 200, 226], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.12, 0.12, 0.06, 0.06], binaural: 13.0, drift: 0.0003, bpm: 0 },
  // 7 — Despertar Suave (Beta baixo 14-18 Hz) — Binaural
  { name: 'Despertar Suave', freqs: [100, 116, 200, 232], types: ['sine', 'sine', 'sine', 'sine'], gains: [0.10, 0.10, 0.05, 0.05], binaural: 16.0, drift: 0.0002, bpm: 0 }
];

// Mundos do Sono (8 mundos = 8 batidas)
export const SLEEP_LEVELS = [
  { name: 'Delta Profundo', speed: 0.50, filter: 200, delay: 0.80, reverb: 0.90, bgColor: '#040408' },
  { name: 'Delta Sono', speed: 0.55, filter: 300, delay: 0.75, reverb: 0.85, bgColor: '#05050a' },
  { name: 'Theta Meditação', speed: 0.60, filter: 500, delay: 0.70, reverb: 0.80, bgColor: '#06060c' },
  { name: 'Theta Sono', speed: 0.65, filter: 800, delay: 0.65, reverb: 0.75, bgColor: '#07070e' },
  { name: 'Alpha Relax', speed: 0.70, filter: 1200, delay: 0.60, reverb: 0.70, bgColor: '#080810' },
  { name: 'Alpha Isocrônico', speed: 0.75, filter: 1500, delay: 0.55, reverb: 0.65, bgColor: '#090912' },
  { name: 'SMR 13Hz', speed: 0.80, filter: 2000, delay: 0.50, reverb: 0.60, bgColor: '#0a0a14' },
  { name: 'Despertar Suave', speed: 0.90, filter: 3000, delay: 0.40, reverb: 0.50, bgColor: '#0c0c18' }
];

export const SLEEP_WORLD_NAMES = SLEEP_LEVELS.map(l => l.name);
export const SLEEP_WORLD_COUNT = SLEEP_LEVELS.length; // 8

// Sintetizador padrão para cada mundo Sono (índice em SLEEP_SYNTH_PRESETS)
export const SLEEP_WORLD_SYNTH = [0, 1, 2, 3, 4, 5, 6, 7];

// Progressões de acordes Sono (pedal simples)
export const SLEEP_CHORD_PROGRESSIONS = [
  [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
  [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]
];

// Configurações padrão do Alarme Sono
export const SLEEP_DEFAULTS = {
  alarmTime: '07:00',           // HH:MM
  wakeWindowMinutes: 15,        // janela de despertar antes do alarme
  wakeWorldIndex: 7             // Despertar Suave
};

// ============================================================
// DEFAULTS — Estado padrão para comparação isDirty (PASIV)
// ============================================================

export const DEFAULTS = {
  sourceMode: 'synth',
  currentSynthType: WORLD_SYNTH[0],
  autoMode: true,
  worldTriggers: { ...DEFAULT_WORLD_TRIGGERS },
  triggerMotion: DEFAULT_TRIGGER_MOTION,
  triggerSilenceSec: DEFAULT_TRIGGER_SILENCE_SEC,
  worldSourceType: Array(WORLD_COUNT).fill('synth'),
  worldSynth: [...WORLD_SYNTH],
  worldVolume: Array(WORLD_COUNT).fill(0.2),
  worldSources: { mp3: Array(WORLD_COUNT).fill('') },
  gpsRain: false,
  gpsNight: false,
  gpsSpeedMps: 0,
  motionIntensity: 0,
  currentLevel: 0,
  xyState: { x: 0.65, y: 0.0 },
  micPreset: 'limpo',
  micGateThreshold: -30,
  isMemCatcherOn: true,
  isAutoKickOn: true,
  isSpatial3DOn: true,
  isGyroSlidersOn: false,
  lucidModeIdx: 0,
  isDeprivationWatchOn: true,
  // Pomodoro
  pomodoro: {
    enabled: false,
    phase: 'activity',
    timeRemaining: POMODORO_DEFAULTS.activityDuration,
    totalTime: POMODORO_DEFAULTS.activityDuration,
    cyclesCompleted: 0,
    cyclesUntilLongBreak: POMODORO_DEFAULTS.cyclesUntilLongBreak,
    isRunning: false,
    activityDuration: POMODORO_DEFAULTS.activityDuration,
    shortBreakDuration: POMODORO_DEFAULTS.shortBreakDuration,
    longBreakDuration: POMODORO_DEFAULTS.longBreakDuration,
    activityMp3: '',
    breakMp3: ''
  },
  // Sleep
  sleep: {
    enabled: false,
    currentWorld: 0,
    alarmTime: SLEEP_DEFAULTS.alarmTime,
    wakeWindowMinutes: SLEEP_DEFAULTS.wakeWindowMinutes,
    wakeWorldIndex: SLEEP_DEFAULTS.wakeWorldIndex,
    isWaking: false
  }
};

// Modos disponíveis
export const MODES = [
  { id: 'narrative', name: 'Narrativo', icon: '📖', description: '13 mundos, gatilhos sensoriais, narrativa automática' },
  { id: 'pomodoro', name: 'Pomodoro', icon: '🍅', description: '2 mundos (Atividade/Descanso), timer, MP3 custom' },
  { id: 'sleep', name: 'Sono', icon: '🌙', description: '8 batidas binaurais, alarme inteligente, tela preta' },
  { id: 'free', name: 'Livre', icon: '✋', description: 'Controle manual total, sem automação' }
];

export const DEFAULT_MODE = 'narrative';

export const MODE_ORDER = ['narrative', 'pomodoro', 'sleep', 'free'];

// Retorna mundos disponíveis para o modo atual
export function getCurrentModeWorlds(currentMode) {
  switch (currentMode) {
    case 'narrative':
      return WORLD_NAMES;
    case 'pomodoro':
      return POMODORO_WORLD_NAMES;
    case 'sleep':
      return SLEEP_WORLD_NAMES;
    case 'free':
      return WORLD_NAMES;
    default:
      return [];
  }
}
