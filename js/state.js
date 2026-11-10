import { WORLD_SYNTH, DEFAULT_WORLD_TRIGGERS, POMODORO_DEFAULTS, SLEEP_DEFAULTS, DEFAULT_MODE, POMODORO_WORLD_COUNT, SLEEP_WORLD_COUNT } from './config.js';

const N = 13; // mundos narrativo (v3.0.0)

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
  worldSourceType: Array(N).fill('synth'),
  worldSynth: [...WORLD_SYNTH],
  worldVolume: Array(N).fill(0.2),
  worldSources: { mp3: Array(N).fill('') },
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
  worldMp3Buffers: Array(N).fill(null),
  worldMp3Sources: Array(N).fill(null),
  worldMp3Gains: Array(N).fill(null),
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