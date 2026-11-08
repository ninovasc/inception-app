// Functional Test Suite for PASIV Engine - Exercises actual code paths for coverage
// Run with: node --test tests/functional.test.mjs

import { test, describe, mock } from 'node:test';
import { strict as assert } from 'node:assert';

// Mock browser globals for modules that need them
const mockWindow = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
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
  location: { href: '' }
};

global.window = mockWindow;
global.localStorage = mockWindow.localStorage;
global.sessionStorage = mockWindow.sessionStorage;
// navigator is read-only in Node.js - modules should handle missing gracefully
global.document = mockWindow.document;
global.AudioContext = mockWindow.AudioContext;
global.webkitAudioContext = mockWindow.webkitAudioContext;

// Import the modules we want to test
import { 
  normalizeWorldTriggers, 
  normalizeSourceType, 
  getCurrentModeWorlds,
  TRIGGER_DEFS,
  DEFAULT_WORLD_TRIGGERS,
  WORLD_COUNT,
  WORLD_NAMES,
  POMODORO_WORLD_NAMES,
  SLEEP_WORLD_NAMES
} from '../js/config.js';

describe('Functional: Config Module', () => {
  
  describe('normalizeWorldTriggers', () => {
    test('returns default triggers when raw is null', () => {
      const result = normalizeWorldTriggers(null);
      assert.deepStrictEqual(result, DEFAULT_WORLD_TRIGGERS);
    });

    test('returns default triggers when raw is undefined', () => {
      const result = normalizeWorldTriggers(undefined);
      assert.deepStrictEqual(result, DEFAULT_WORLD_TRIGGERS);
    });

    test('returns default triggers when raw is not an object', () => {
      const result = normalizeWorldTriggers('string');
      assert.deepStrictEqual(result, DEFAULT_WORLD_TRIGGERS);
    });

    test('validates and accepts valid integer values in range', () => {
      const raw = { freefall: 0, rain: 1, night: 2, silence: 3, motion: 4, fallback: 5 };
      const result = normalizeWorldTriggers(raw);
      assert.strictEqual(result.freefall, 0);
      assert.strictEqual(result.rain, 1);
      assert.strictEqual(result.night, 2);
      assert.strictEqual(result.silence, 3);
      assert.strictEqual(result.motion, 4);
      assert.strictEqual(result.fallback, 5);
    });

    test('ignores out-of-range integer values', () => {
      const raw = { freefall: 999, rain: -2, night: WORLD_COUNT };
      const result = normalizeWorldTriggers(raw);
      // Should keep defaults for out-of-range
      assert.strictEqual(result.freefall, DEFAULT_WORLD_TRIGGERS.freefall);
      assert.strictEqual(result.rain, DEFAULT_WORLD_TRIGGERS.rain);
    });

    test('accepts -1 to disable trigger (except fallback)', () => {
      const raw = { freefall: -1, rain: -1, night: -1, silence: -1, motion: -1, fallback: -1 };
      const result = normalizeWorldTriggers(raw);
      assert.strictEqual(result.freefall, -1);
      assert.strictEqual(result.rain, -1);
      assert.strictEqual(result.night, -1);
      assert.strictEqual(result.silence, -1);
      assert.strictEqual(result.motion, -1);
      // fallback should NOT accept -1
      assert.strictEqual(result.fallback, DEFAULT_WORLD_TRIGGERS.fallback);
    });

    test('ignores non-integer values', () => {
      const raw = { freefall: '0', rain: 1.5, night: true };
      const result = normalizeWorldTriggers(raw);
      assert.strictEqual(result.freefall, DEFAULT_WORLD_TRIGGERS.freefall);
      assert.strictEqual(result.rain, DEFAULT_WORLD_TRIGGERS.rain);
      assert.strictEqual(result.night, DEFAULT_WORLD_TRIGGERS.night);
    });

    test('partial raw object merges with defaults', () => {
      const raw = { freefall: 2 };
      const result = normalizeWorldTriggers(raw);
      assert.strictEqual(result.freefall, 2);
      // Others should be defaults
      assert.strictEqual(result.rain, DEFAULT_WORLD_TRIGGERS.rain);
    });

    test('handles all TRIGGER_DEFS keys', () => {
      const raw = {};
      TRIGGER_DEFS.forEach(({ key }) => {
        raw[key] = 0;
      });
      const result = normalizeWorldTriggers(raw);
      TRIGGER_DEFS.forEach(({ key }) => {
        assert.strictEqual(result[key], 0);
      });
    });
  });

  describe('normalizeSourceType', () => {
    test('returns synth for valid synth', () => {
      assert.strictEqual(normalizeSourceType('synth'), 'synth');
    });

    test('returns mp3 for valid mp3', () => {
      assert.strictEqual(normalizeSourceType('mp3'), 'mp3');
    });

    test('converts legacy "upload" to mp3', () => {
      assert.strictEqual(normalizeSourceType('upload'), 'mp3');
    });

    test('defaults to synth for unknown type', () => {
      assert.strictEqual(normalizeSourceType('unknown'), 'synth');
      assert.strictEqual(normalizeSourceType(''), 'synth');
      assert.strictEqual(normalizeSourceType(null), 'synth');
      assert.strictEqual(normalizeSourceType(undefined), 'synth');
    });
  });

  describe('getCurrentModeWorlds', () => {
    test('returns WORLD_NAMES for narrative mode', () => {
      const result = getCurrentModeWorlds('narrative');
      assert.deepStrictEqual(result, WORLD_NAMES);
    });

    test('returns POMODORO_WORLD_NAMES for pomodoro mode', () => {
      const result = getCurrentModeWorlds('pomodoro');
      assert.deepStrictEqual(result, POMODORO_WORLD_NAMES);
    });

    test('returns SLEEP_WORLD_NAMES for sleep mode', () => {
      const result = getCurrentModeWorlds('sleep');
      assert.deepStrictEqual(result, SLEEP_WORLD_NAMES);
    });

    test('returns WORLD_NAMES for free mode', () => {
      const result = getCurrentModeWorlds('free');
      assert.deepStrictEqual(result, WORLD_NAMES);
    });

    test('returns empty array for unknown mode (default case)', () => {
      const result = getCurrentModeWorlds('unknown');
      assert.deepStrictEqual(result, []);
    });

    test('returns empty array for empty string', () => {
      const result = getCurrentModeWorlds('');
      assert.deepStrictEqual(result, []);
    });

    test('returns empty array for null', () => {
      const result = getCurrentModeWorlds(null);
      assert.deepStrictEqual(result, []);
    });
  });
});

describe('Functional: State Module', () => {
  test('state module exports state object', async () => {
    const { state } = await import('../js/state.js');
    assert.ok(state);
    assert.ok(typeof state === 'object');
  });

  test('state has required properties', async () => {
    const { state } = await import('../js/state.js');
    assert.ok('currentMode' in state);
    assert.ok('currentLevel' in state);
    assert.ok('isPlaying' in state);
    assert.ok('sourceMode' in state);
  });
});

describe('Functional: Audio Core Module', () => {
  test('audio core exports initAudio', async () => {
    const audioCore = await import('../js/audio/core.js');
    assert.ok(typeof audioCore.initAudio === 'function');
  });
});

describe('Functional: Audio Synth Module', () => {
  test('audio synth exports selectSynthType', async () => {
    const audioSynth = await import('../js/audio/synth.js');
    assert.ok(typeof audioSynth.selectSynthType === 'function');
  });

  test('audio synth exports setSynthVolume', async () => {
    const audioSynth = await import('../js/audio/synth.js');
    assert.ok(typeof audioSynth.setSynthVolume === 'function');
  });

  test('audio synth exports startSynth/stopSynth', async () => {
    const audioSynth = await import('../js/audio/synth.js');
    assert.ok(typeof audioSynth.startSynth === 'function');
    assert.ok(typeof audioSynth.stopSynth === 'function');
  });
});

describe('Functional: Audio MP3 Module', () => {
  test('audio mp3 exports computeAnchors', async () => {
    const audioMp3 = await import('../js/audio/mp3.js');
    assert.ok(typeof audioMp3.computeAnchors === 'function');
  });

  test('audio mp3 exports loadWorldMp3', async () => {
    const audioMp3 = await import('../js/audio/mp3.js');
    assert.ok(typeof audioMp3.loadWorldMp3 === 'function');
  });
});

describe('Functional: Sensors Module', () => {
  test('sensors exports toggle functions', async () => {
    const sensors = await import('../js/sensors.js');
    assert.ok(typeof sensors.toggleMic === 'function');
    assert.ok(typeof sensors.toggleMotion === 'function');
    assert.ok(typeof sensors.toggleGPS === 'function');
  });

  test('sensors exports setSensorStatus', async () => {
    const sensors = await import('../js/sensors.js');
    assert.ok(typeof sensors.setSensorStatus === 'function');
  });
});

describe('Functional: Mechanics Module', () => {
  test('mechanics exports toggle functions', async () => {
    const mechanics = await import('../js/mechanics.js');
    assert.ok(typeof mechanics.toggleMemoryCatcher === 'function');
    assert.ok(typeof mechanics.toggleAutoKick === 'function');
    assert.ok(typeof mechanics.toggleSpatial3D === 'function');
    assert.ok(typeof mechanics.cycleLucidTimer === 'function');
    assert.ok(typeof mechanics.toggleDeprivationWatch === 'function');
    assert.ok(typeof mechanics.syncMechanicsUI === 'function');
  });
});

describe('Functional: I18n Module', () => {
  test('i18n exports required functions', async () => {
    const i18n = await import('../js/i18n.js');
    assert.ok(typeof i18n.getLang === 'function');
    assert.ok(typeof i18n.setLang === 'function');
    assert.ok(typeof i18n.t === 'function');
    assert.ok(typeof i18n.initI18n === 'function');
  });

  test('i18n t function returns strings', async () => {
    const { t } = await import('../js/i18n.js');
    const result = t('app.title');
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });

  test('i18n supports 3 languages', async () => {
    const { setLang, getLang, t } = await import('../js/i18n.js');
    
    setLang('en-US');
    assert.strictEqual(getLang(), 'en-US');
    assert.ok(t('app.title').length > 0);
    
    setLang('es-ES');
    assert.strictEqual(getLang(), 'es-ES');
    assert.ok(t('app.title').length > 0);
    
    setLang('pt-BR');
    assert.strictEqual(getLang(), 'pt-BR');
    assert.ok(t('app.title').length > 0);
  });
});

describe('Functional: Mode Manager Module', () => {
  test('modeSwitcher exports switchMode', async () => {
    const { switchMode } = await import('../js/modes/modeSwitcher.js');
    assert.ok(typeof switchMode === 'function');
  });

  test('panelManager exports updatePanelVisibility', async () => {
    const { updatePanelVisibility } = await import('../js/modes/panelManager.js');
    assert.ok(typeof updatePanelVisibility === 'function');
  });

  test('uiUpdater exports updateModeUI', async () => {
    const { updateModeUI } = await import('../js/modes/uiUpdater.js');
    assert.ok(typeof updateModeUI === 'function');
  });
});

describe('Functional: Mode Implementations', () => {
  test('narrativeMode exports required functions', async () => {
    const narrativeMode = await import('../js/modes/narrativeMode.js');
    assert.ok(typeof narrativeMode.getActiveTrigger === 'function');
    assert.ok(typeof narrativeMode.startAutoMode === 'function');
    assert.ok(typeof narrativeMode.stopAutoMode === 'function');
    assert.ok(typeof narrativeMode.toggleAutoMode === 'function');
    assert.ok(typeof narrativeMode.evaluateAutoMode === 'function');
  });

  test('pomodoroMode exports activate/deactivate/start/stop', async () => {
    const pomodoroMode = await import('../js/modes/pomodoroMode.js');
    assert.ok(typeof pomodoroMode.activate === 'function');
    assert.ok(typeof pomodoroMode.deactivate === 'function');
    assert.ok(typeof pomodoroMode.start === 'function');
    assert.ok(typeof pomodoroMode.stopTimer === 'function');
    assert.ok(typeof pomodoroMode.pauseTimer === 'function');
    assert.ok(typeof pomodoroMode.resumeTimer === 'function');
    assert.ok(typeof pomodoroMode.skipPhase === 'function');
    assert.ok(typeof pomodoroMode.resetPomodoro === 'function');
  });

  test('sleepMode exports activate/deactivate/alarm functions', async () => {
    const sleepMode = await import('../js/modes/sleepMode.js');
    assert.ok(typeof sleepMode.activate === 'function');
    assert.ok(typeof sleepMode.deactivate === 'function');
    assert.ok(typeof sleepMode.cancelAlarm === 'function');
    assert.ok(typeof sleepMode.playAlarmSound === 'function');
    assert.ok(typeof sleepMode.setAlarmTime === 'function');
    assert.ok(typeof sleepMode.setWakeWindow === 'function');
    assert.ok(typeof sleepMode.setWakeWorld === 'function');
  });
});

describe('Functional: UI Modules', () => {
  test('modeSelector exports create/update/init', async () => {
    const modeSelector = await import('../js/ui/modeSelector.js');
    assert.ok(typeof modeSelector.createModeSelector === 'function');
    assert.ok(typeof modeSelector.updateModeSelector === 'function');
    assert.ok(typeof modeSelector.initModeSelector === 'function');
  });

  test('commonUI exports render functions', async () => {
    const commonUI = await import('../js/ui/commonUI.js');
    assert.ok(typeof commonUI.renderWorldSelect === 'function');
    assert.ok(typeof commonUI.renderVoicePresets === 'function');
    assert.ok(typeof commonUI.renderSourceList === 'function');
  });

  test('generativeUI exports init/update functions', async () => {
    const generativeUI = await import('../js/ui/generativeUI.js');
    assert.ok(typeof generativeUI.initGenerativeUI === 'function');
    assert.ok(typeof generativeUI.updateGenerativeUIVisibility === 'function');
  });
});

describe('Functional: Generative Engine', () => {
  test('generativeEngine exports required functions', async () => {
    const generativeEngine = await import('../js/synth/generativeEngine.js');
    assert.ok(typeof generativeEngine.getGenerativeEngine === 'function');
    assert.ok(typeof generativeEngine.generateSynthVariation === 'function');
    assert.ok(typeof generativeEngine.applyGenerativeVariation === 'function');
  });
});

console.log('\n✅ All functional tests defined!');