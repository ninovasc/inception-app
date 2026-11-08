// Tests for PASIV File Module
// Run with: node --test tests/pasivFile.test.mjs

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import { DEFAULTS } from '../js/config.js';

// Mock browser globals
global.window = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
  navigator: { serviceWorker: { getRegistrations: () => Promise.resolve([]) } },
  AudioContext: class {},
  webkitAudioContext: class {},
  document: {
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, appendChild: () => {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, addEventListener: () => {}, body: { appendChild: () => {} } }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
    body: { appendChild: () => {} }
  },
  getComputedStyle: () => ({ display: 'none' }),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  location: { href: '' },
  showSaveFilePicker: undefined
};

global.localStorage = window.localStorage;
global.sessionStorage = window.sessionStorage;
global.navigator = window.navigator;
global.document = window.document;
global.AudioContext = window.AudioContext;
global.webkitAudioContext = window.webkitAudioContext;

// Mock state for testing
const mockState = {
  sourceMode: 'synth',
  currentSynthType: 0,
  autoMode: true,
  worldTriggers: { bonusRain: 12, clap: 5, inverted: 10, freefall: 2, motion: 6, vehicle: 3, sessionStart: 7, silence: 8, rain: 4, flat: 1, night: 9, sessionLong: 11, fallback: 0 },
  triggerMotion: 0.6,
  triggerSilenceSec: 30,
  worldSourceType: Array(13).fill('synth'),
  worldSynth: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  worldVolume: Array(13).fill(0.2),
  worldSources: { mp3: Array(13).fill('') },
  gpsRain: false, gpsNight: false, gpsSpeedMps: 0, motionIntensity: 0,
  currentLevel: 0, xyState: { x: 0.65, y: 0.0 },
  micPreset: 'limpo', micGateThreshold: -30,
  isMemCatcherOn: true, isAutoKickOn: true, isSpatial3DOn: true, isGyroSlidersOn: false,
  lucidModeIdx: 0, isDeprivationWatchOn: true, micGateThreshold: -30,
  pomodoro: { enabled: false, phase: 'activity', timeRemaining: 1500, totalTime: 1500, cyclesCompleted: 0, cyclesUntilLongBreak: 4, isRunning: false, activityDuration: 1500, shortBreakDuration: 300, longBreakDuration: 900, activityMp3: '', breakMp3: '' },
  sleep: { enabled: false, currentWorld: 0, alarmTime: '07:00', wakeWindowMinutes: 15, wakeWorldIndex: 7, isWaking: false }
};

describe('PASIV File Module', () => {
  test('DEFAULTS exported from config.js', () => {
    assert.ok(DEFAULTS);
    assert.ok(typeof DEFAULTS === 'object');
  });

  test('DEFAULTS has required top-level fields', () => {
    const required = ['sourceMode', 'currentSynthType', 'autoMode', 'worldTriggers', 'pomodoro', 'sleep'];
    for (const field of required) {
      assert.ok(field in DEFAULTS, `DEFAULTS should have ${field}`);
    }
  });

  test('DEFAULTS pomodoro has correct structure', () => {
    assert.ok(DEFAULTS.pomodoro);
    assert.ok('enabled' in DEFAULTS.pomodoro);
    assert.ok('phase' in DEFAULTS.pomodoro);
    assert.ok('activityDuration' in DEFAULTS.pomodoro);
  });

  test('DEFAULTS sleep has correct structure', () => {
    assert.ok(DEFAULTS.sleep);
    assert.ok('enabled' in DEFAULTS.sleep);
    assert.ok('alarmTime' in DEFAULTS.sleep);
    assert.ok('wakeWindowMinutes' in DEFAULTS.sleep);
  });

  test('DEFAULTS worldTriggers has all trigger keys', () => {
    const expectedKeys = ['bonusRain', 'clap', 'inverted', 'freefall', 'motion', 'vehicle', 'sessionStart', 'silence', 'rain', 'flat', 'night', 'sessionLong', 'fallback'];
    for (const key of expectedKeys) {
      assert.ok(key in DEFAULTS.worldTriggers, `worldTriggers should have ${key}`);
    }
  });
});

console.log('\n✅ PASIV File module tests defined!');