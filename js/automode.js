import { state } from './state.js';
import { WORLD_NAMES, DEFAULT_WORLD_TRIGGERS, DEFAULT_TRIGGER_MOTION, DEFAULT_TRIGGER_SILENCE_SEC } from './config.js';

const AUTO_INTERVAL_MS = 10000;
const FREEFALL_WINDOW_MS = 15000;

let autoInterval = null;

// Avaliação exclusiva: percorre os gatilhos em ordem fixa de prioridade e
// devolve o primeiro mundo correspondente. Nunca combina dois mundos.
export function decideWorld(now = Date.now()) {
  const t = state.worldTriggers || DEFAULT_WORLD_TRIGGERS;
  const motionLimit = (state.triggerMotion != null) ? state.triggerMotion : DEFAULT_TRIGGER_MOTION;
  const silenceLimit = (state.triggerSilenceSec != null) ? state.triggerSilenceSec : DEFAULT_TRIGGER_SILENCE_SEC;

  const kicked = (state.lastKickTime > 0 && now - state.lastKickTime < FREEFALL_WINDOW_MS) ||
    (state.freefallTimestamp > 0 && now - state.freefallTimestamp < 2000);
  if (t.freefall >= 0 && state.isAutoKickOn && kicked) return t.freefall;
  if (t.rain >= 0 && state.gpsRain) return t.rain;
  if (t.night >= 0 && state.gpsNight) return t.night;
  if (t.silence >= 0) {
    const silenceValue = Math.max(state.silenceSeconds || 0, state.micSilenceSec || 0);
    if (silenceValue >= silenceLimit) return t.silence;
  }
  if (t.motion >= 0 && state.motionIntensity >= motionLimit) return t.motion;
  return (t.fallback >= 0) ? t.fallback : 0;
}

// Aplica o mundo escolhido e a voz homônima. Retorna o índice do mundo.
export function evaluateAutoMode() {
  if (!state.autoMode) return null;
  const w = decideWorld();
  if (w < 0 || w >= WORLD_NAMES.length) return null;

  if (w !== state.currentLevel && typeof window.selectLevel === 'function') {
    window.selectLevel(w);
  }
  // Mantém a voz sincronizada com o mundo, mesmo que o usuário tenha
  // trocado o preset manualmente.
  if (state.micPreset !== WORLD_NAMES[w] && typeof window.applyMicPreset === 'function') {
    window.applyMicPreset(WORLD_NAMES[w]);
  }
  return w;
}

function syncAutoUI() {
  const btn = document.getElementById('btnAutoMode');
  const sub = document.getElementById('autoSub');
  if (btn) {
    btn.classList.toggle('active', state.autoMode);
    btn.setAttribute('aria-pressed', state.autoMode ? 'true' : 'false');
  }
  if (sub) sub.textContent = state.autoMode ? 'ON' : 'OFF';
}

export function startAutoMode() {
  state.autoMode = true;
  if (!autoInterval) {
    autoInterval = setInterval(() => {
      if (!state.isPlaying || !state.autoMode) return;
      evaluateAutoMode();
    }, AUTO_INTERVAL_MS);
  }
  syncAutoUI();
  if (state.isPlaying) evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function stopAutoMode() {
  state.autoMode = false;
  if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
  syncAutoUI();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setAutoModeEnabled(enabled) {
  if (enabled) startAutoMode();
  else stopAutoMode();
}

export function toggleAutoMode() {
  if (state.autoMode) stopAutoMode();
  else startAutoMode();
}

export function isAutoMode() {
  return state.autoMode;
}
