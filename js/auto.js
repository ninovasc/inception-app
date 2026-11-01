import { state } from './state.js';
import { WORLD_NAMES } from './config.js';

let autoInterval = null;
let lastAutoWorld = -1;

function decideWorld() {
  // 1. queda livre → Limbo
  if (state.isAutoKickOn && state.freefallTimestamp > 0 && (Date.now() - state.freefallTimestamp < 2000)) {
    return 4; // Limbo
  }
  // 2. chuva (GPS)
  // gps climate tracked via a flag; check state
  if (state.gpsRain) return 1; // Chuva
  // 3. noite (GPS)
  if (state.gpsNight) return 2; // Hotel
  // 4. silêncio prolongado (Mic)
  if (state.silenceSeconds > 30) return 5; // Lúcido
  // 5. movimento intenso (Giro)
  if (state.motionIntensity > 0.6) return 3; // Fortaleza
  // 6. default
  return 0; // Realidade
}

export function startAutoMode() {
  if (autoInterval) return;
  state.autoMode = true;
  autoInterval = setInterval(() => {
    if (!state.isPlaying || !state.autoMode) return;
    const w = decideWorld();
    if (w !== state.currentLevel && w !== lastAutoWorld) {
      lastAutoWorld = w;
      // selectLevel
      if (window.selectLevel) window.selectLevel(w);
      // voice preset
      if (window.applyMicPreset) window.applyMicPreset(WORLD_NAMES[w]);
    }
  }, 10000);
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function stopAutoMode() {
  state.autoMode = false;
  if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
  lastAutoWorld = -1;
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function isAutoMode() {
  return state.autoMode;
}
