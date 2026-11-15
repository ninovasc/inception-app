import { WORLD_SYNTH, DEFAULT_WORLD_TRIGGERS, POMODORO_DEFAULTS, SLEEP_DEFAULTS, DEFAULT_MODE, POMODORO_WORLD_COUNT, SLEEP_WORLD_COUNT, WORLD_NAMES, POMODORO_WORLD_NAMES, SLEEP_WORLD_NAMES } from './config.js';

const N = 13; // mundos narrativo (v3.0.0)
const MODE_WORLD_COUNTS = {
  narrative: 13,
  pomodoro: 2,
  sleep: 8,
  free: 13
};

function createModeArrays(fillValue) {
  return {
    narrative: Array(13).fill(fillValue),
    pomodoro: Array(2).fill(fillValue),
    sleep: Array(8).fill(fillValue),
    free: Array(13).fill(fillValue)
  };
}

function getModeArray(modeObj, mode) {
  return modeObj[mode] || modeObj.narrative;
}

function getModeArrayAt(modeObj, mode, idx) {
  const arr = modeObj[mode] || modeObj.narrative;
  return arr[idx];
}

function setModeArrayAt(modeObj, mode, idx, value) {
  const arr = modeObj[mode] || modeObj.narrative;
  if (arr) arr[idx] = value;
}

export const state = {
  audioCtx: null,
  isPlaying: false,
  wakeLock: null,
  sourceMode: 'synth', // 'synth' | 'mp3'
  currentSynthType: WORLD_SYNTH[0],
  autoMode: true,
  // Modo atual: 'narrative' | 'pomodoro' | 'sleep' | 'free'
  currentMode: '', // vazio até usuário escolher
  // Gatilhos de mundo: cada regra de sensor aponta para um mundo
  // (ou -1 = desativada). A avaliação é exclusiva: só a primeira
  // regra verdadeira (ordem curada) escolhe o mundo.
  worldTriggers: { ...DEFAULT_WORLD_TRIGGERS },
  triggerMotion: 0.6,
  triggerSilenceSec: 30,
  worldSourceType: createModeArrays('synth'),
  worldSynth: [...WORLD_SYNTH],
  worldVolume: createModeArrays(0.5),
  worldSources: { 
    mp3: createModeArrays(''),
    youtube: createModeArrays('')
  },
  gpsRain: false,
  gpsNight: false,
  gpsSpeedMps: 0,
  motionIntensity: 0,
  currentLevel: 0,
  xyState: { x: 0.65, y: 0.0 },
  // Initialize masterFilter - use global mock in test environment, null in production (set by initAudio)
  masterFilter: (typeof globalThis !== 'undefined' && globalThis.mockStateMasterFilter) 
    ? globalThis.mockStateMasterFilter 
    : null,
  delayLeft: null,
  delayRight: null,
  delayWet: null,
  feedbackLeft: null,
  feedbackRight: null,
  convolverNode: null,
  reverbGain: null,
  dryGain: null,
  stereoPanner: null,
  compressor: null,
  synthMasterGain: null,
  stemBuffers: [null, null, null],
  stemSources: [null, null, null],
  stemGains: [null, null, null],
  worldMp3Buffers: createModeArrays(null),
  worldMp3Sources: createModeArrays(null),
  worldMp3Gains: createModeArrays(null),
  synthNodes: [],
  chordIndex: 0,
  chordInterval: null,
  micStream: null,
  micSource: null,
  micGain: null,
  micAnalyser: null,
  isMicOn: false,
  micFilter: null,
  micDelay: null,
  micFeedback: null,
  micReverbSend: null,
  micDry: null,
  micWet: null,
  micGainNode: null,
  micPreset: 'limpo',
  micGateThreshold: -30,
  micLedOn: false,
  crossfadeGain: null,
  masterOut: null,
  breathLfo: null,
  breathLfoGain: null,
  breathVolLfo: null,
  breathVolGain: null,
  isMotionOn: false,
  isGpsOn: false,
  gpsWatchId: null,
  isMemCatcherOn: true,
  memCatcherTimer: null,
  isAutoKickOn: true,
  freefallTimestamp: 0,
  lastKickTime: 0,
  isSpatial3DOn: true,
  isGyroSlidersOn: false,
  baseCompassAlpha: null,
  lucidModeIdx: 0,
  lucidRemainingSec: 0,
  lucidTotalSec: 0,
  lucidInterval: null,
  isDeprivationWatchOn: true,
  isDeprivationActive: false,
  isPhoneFaceDown: false,
  silenceSeconds: 0,
  micSilenceSec: 0,
  // Gatilhos novos (v3): chuva intensa (mic), palmas (mic), orientação
  // invertida/apoiada (giro) e velocidade de veículo (GPS).
  micRainIntenseSec: 0,
  lastClapTime: 0,
  invertedSince: null,
  isInvertedHold: false,
  flatSince: null,
  isFlatHold: false,
  deprivationCheckInterval: null,
  heartbeatInterval: null,
  isDragging: false,
  impulseBuffer: null,
  defaultsActivated: false,
  // Modo Pomodoro
  pomodoro: {
    enabled: false,
    phase: 'activity',        // 'activity' | 'shortBreak' | 'longBreak'
    timeRemaining: POMODORO_DEFAULTS.activityDuration,
    totalTime: POMODORO_DEFAULTS.activityDuration,
    cyclesCompleted: 0,
    cyclesUntilLongBreak: POMODORO_DEFAULTS.cyclesUntilLongBreak,
    isRunning: false,
    timerInterval: null,
    // Config
    activityDuration: POMODORO_DEFAULTS.activityDuration,
    shortBreakDuration: POMODORO_DEFAULTS.shortBreakDuration,
    longBreakDuration: POMODORO_DEFAULTS.longBreakDuration,
    // MP3 por fase
    activityMp3: '',
    breakMp3: ''
  },
  // Modo Sono
  sleep: {
    enabled: false,
    currentWorld: 0,          // índice em SLEEP_WORLD_NAMES
    alarmTime: SLEEP_DEFAULTS.alarmTime,     // 'HH:MM'
    wakeWindowMinutes: SLEEP_DEFAULTS.wakeWindowMinutes,
    wakeWorldIndex: SLEEP_DEFAULTS.wakeWorldIndex,
    alarmTimer: null,
    isWaking: false
  }
};

// Export helpers for backward compatibility and mode-specific access
export function getModeWorldCount(mode) {
  return MODE_WORLD_COUNTS[mode] || 13;
}

export function getWorldSourceType(mode, idx) {
  const arr = state.worldSourceType[mode] || state.worldSourceType.narrative;
  return arr[idx];
}

export function setWorldSourceType(mode, idx, value) {
  const arr = state.worldSourceType[mode] || state.worldSourceType.narrative;
  if (arr) arr[idx] = value;
}

export function getWorldVolume(mode, idx) {
  const arr = state.worldVolume[mode] || state.worldVolume.narrative;
  return arr[idx];
}

export function setWorldVolume(mode, idx, value) {
  const arr = state.worldVolume[mode] || state.worldVolume.narrative;
  if (arr) arr[idx] = value;
}

export function getWorldMp3Name(mode, idx) {
  const arr = state.worldSources.mp3[mode] || state.worldSources.mp3.narrative;
  return arr[idx];
}

export function setWorldMp3Name(mode, idx, value) {
  const arr = state.worldSources.mp3[mode] || state.worldSources.mp3.narrative;
  if (arr) arr[idx] = value;
}

export function getWorldMp3Buffer(mode, idx) {
  const arr = state.worldMp3Buffers[mode] || state.worldMp3Buffers.narrative;
  return arr[idx];
}

export function setWorldMp3Buffer(mode, idx, value) {
  const arr = state.worldMp3Buffers[mode] || state.worldMp3Buffers.narrative;
  if (arr) arr[idx] = value;
}

export function getWorldMp3Source(mode, idx) {
  const arr = state.worldMp3Sources[mode] || state.worldMp3Sources.narrative;
  return arr[idx];
}

export function setWorldMp3Source(mode, idx, value) {
  const arr = state.worldMp3Sources[mode] || state.worldMp3Sources.narrative;
  if (arr) arr[idx] = value;
}

export function getWorldMp3Gain(mode, idx) {
  const arr = state.worldMp3Gains[mode] || state.worldMp3Gains.narrative;
  return arr[idx];
}

export function setWorldMp3Gain(mode, idx, value) {
  const arr = state.worldMp3Gains[mode] || state.worldMp3Gains.narrative;
  if (arr) arr[idx] = value;
}