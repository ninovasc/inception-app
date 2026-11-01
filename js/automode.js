import { state } from './state.js';
import { WORLD_NAMES } from './config.js';

let autoInterval = null;
let lastAutoWorld = -1;

function decideWorld() {
  if (state.isAutoKickOn && state.freefallTimestamp > 0 && (Date.now() - state.freefallTimestamp < 2000)) {
    return 4;
  }
  if (state.gpsRain) return 1;
  if (state.gpsNight) return 2;
  if (state.silenceSeconds > 30) return 5;
  if (state.motionIntensity > 0.6) return 3;
  return 0;
}

export function startAutoMode() {
  if (autoInterval) return;
  state.autoMode = true;
  autoInterval = setInterval(() => {
    if (!state.isPlaying || !state.autoMode) return;
    const w = decideWorld();
    if (w !== state.currentLevel && w !== lastAutoWorld) {
      lastAutoWorld = w;
      if (window.selectLevel) window.selectLevel(w);
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
