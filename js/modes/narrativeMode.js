// @ts-nocheck
import { state } from '../state.js';
import {
  WORLD_NAMES, DEFAULT_WORLD_TRIGGERS, DEFAULT_TRIGGER_MOTION, DEFAULT_TRIGGER_SILENCE_SEC,
  TRIGGER_DEFS, TRIGGER_CLAP_WINDOW_SEC, GPS_VEHICLE_SPEED_MPS,
  SESSION_START_WINDOW_SEC, SESSION_LONG_SEC, TIME_REWARD_SEC,
  MIC_RAIN_INTENSE_HOLD_SEC
} from '../config.js';

const AUTO_INTERVAL_MS = 10000;
const FREEFALL_WINDOW_MS = 15000;
const CLAP_HOLD_MS = 15000;

let autoInterval = null;
let sessionStartTs = 0;
let timeRewardFired = false;
let timeRewardUntil = 0;
let lastDecision = { key: null, world: null };

export function getActiveTrigger() {
  return lastDecision;
}

export function resetSession() {
  sessionStartTs = 0;
  timeRewardFired = false;
  timeRewardUntil = 0;
}

function ruleActive(key, now) {
  const motionLimit = (state.triggerMotion != null) ? state.triggerMotion : DEFAULT_TRIGGER_MOTION;
  const silenceLimit = (state.triggerSilenceSec != null) ? state.triggerSilenceSec : DEFAULT_TRIGGER_SILENCE_SEC;
  switch (key) {
    case 'bonusRain':
      return (state.micRainIntenseSec || 0) >= MIC_RAIN_INTENSE_HOLD_SEC;
    case 'clap':
      return state.lastClapTime > 0 && (now - state.lastClapTime) < CLAP_HOLD_MS;
    case 'inverted':
      return !!state.isInvertedHold;
    case 'freefall':
      return (state.lastKickTime > 0 && now - state.lastKickTime < FREEFALL_WINDOW_MS) ||
        (state.freefallTimestamp > 0 && now - state.freefallTimestamp < 2000);
    case 'motion':
      return state.motionIntensity >= motionLimit;
    case 'vehicle':
      return (state.gpsSpeedMps || 0) > GPS_VEHICLE_SPEED_MPS;
    case 'sessionStart':
      return sessionStartTs > 0 && (now - sessionStartTs) <= SESSION_START_WINDOW_SEC * 1000;
    case 'silence': {
      const silenceValue = Math.max(state.silenceSeconds || 0, state.micSilenceSec || 0);
      return silenceValue >= silenceLimit;
    }
    case 'rain':
      return !!state.gpsRain;
    case 'flat':
      return !!state.isFlatHold;
    case 'night':
      return !!state.gpsNight;
    case 'sessionLong':
      return now < timeRewardUntil;
    case 'fallback':
      return true;
    default:
      return false;
  }
}

export function decideWorld(now = Date.now()) {
  const t = state.worldTriggers || DEFAULT_WORLD_TRIGGERS;
  if (sessionStartTs > 0 && !timeRewardFired && (now - sessionStartTs) >= SESSION_LONG_SEC * 1000) {
    timeRewardFired = true;
    timeRewardUntil = now + TIME_REWARD_SEC * 1000;
  }
  for (const def of TRIGGER_DEFS) {
    const dest = t[def.key];
    if (dest === undefined || dest < 0) continue;
    if (ruleActive(def.key, now)) {
      lastDecision = { key: def.key, world: dest };
      return dest;
    }
  }
  const fb = t.fallback;
  const world = (fb !== undefined && fb >= 0) ? fb : 0;
  lastDecision = { key: 'fallback', world };
  return world;
}

export function evaluateAutoMode() {
  if (!state.autoMode) return null;
  if (state.isPlaying && sessionStartTs === 0) sessionStartTs = Date.now();
  const w = decideWorld();
  if (!(w >= 0 && w < WORLD_NAMES.length)) return null;

  if (w !== state.currentLevel && typeof window.selectLevel === 'function') {
    window.selectLevel(w);
  }
  if (state.micPreset !== WORLD_NAMES[w] && typeof window.applyMicPreset === 'function') {
    window.applyMicPreset(WORLD_NAMES[w]);
  }
  if (typeof window.updateTriggerIndicator === 'function') window.updateTriggerIndicator();
  return w;
}

export function startAutoMode() {
  state.autoMode = true;
  if (!autoInterval) {
    autoInterval = setInterval(() => {
      if (!state.isPlaying) { resetSession(); return; }
      if (!state.autoMode) return;
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

export function getSessionStartTime() {
  return sessionStartTs;
}

export function setSessionStartTime(ts) {
  sessionStartTs = ts;
}