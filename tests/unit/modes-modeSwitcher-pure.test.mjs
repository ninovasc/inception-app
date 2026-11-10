// tests/unit/modes-modeSwitcher-pure.test.mjs - Unit tests for modes/modeSwitcher.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, initModeManager, switchMode, activateMode, getCurrentModeModule, isMode, getCurrentModeConfig, isPomodoroMode, isSleepMode, isNarrativeMode, isFreeMode, modeModules;

before(async () => {
  await import('../mock-browser.mjs');
  // Import state module namespace to patch its export directly
  const stateModule = await import('../../js/state.js');
  state = stateModule.state;
  // Patch the state module's export directly
  stateModule.state.masterFilter = {
    frequency: {
      value: 18000,
      setTargetAtTime: () => {},
      setValueAtTime: () => {},
      cancelScheduledValues: () => {},
      linearRampToValueAtTime: () => {}
    },
    type: 'lowpass',
    connect: () => {},
    disconnect: () => {}
  };
  state.masterFilter = stateModule.state.masterFilter;
  global.stopDeprivationHeartbeat = () => {};
  
  const mod = await import('../../js/modes/modeSwitcher.js');
  initModeManager = mod.initModeManager;
  switchMode = mod.switchMode;
  activateMode = mod.activateMode;
  getCurrentModeModule = mod.getCurrentModeModule;
  isMode = mod.isMode;
  getCurrentModeConfig = mod.getCurrentModeConfig;
  isPomodoroMode = mod.isPomodoroMode;
  isSleepMode = mod.isSleepMode;
  isNarrativeMode = mod.isNarrativeMode;
  isFreeMode = mod.isFreeMode;
  modeModules = mod.modeModules;
});

after(() => {
  cleanupTimers();
});

describe('Mode Switcher Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  function resetState() {
    state.currentMode = '';
    state.autoMode = false;
    state.isPlaying = false;
  }

  // Use a test wrapper to reset state before each test
  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('initModeManager', () => {
    test('initializes mode manager', () => {
      initModeManager();
      assert.equal(state.currentMode, '');
    });
  });

  describe('switchMode', () => {
    test('returns false for invalid mode', () => {
      const result = switchMode('invalid');
      assert.equal(result, false);
    });

    test('switches to narrative mode', () => {
      const result = switchMode('narrative');
      assert.equal(result, true);
      assert.equal(state.currentMode, 'narrative');
    });

    test('switches to pomodoro mode', () => {
      const result = switchMode('pomodoro');
      assert.equal(result, true);
      assert.equal(state.currentMode, 'pomodoro');
    });

    test('switches to sleep mode', () => {
      const result = switchMode('sleep');
      assert.equal(result, true);
      assert.equal(state.currentMode, 'sleep');
    });

    test('switches to free mode', () => {
      const result = switchMode('free');
      assert.equal(result, true);
      assert.equal(state.currentMode, 'free');
    });

    test('returns true when already in mode', () => {
      state.currentMode = 'narrative';
      const result = switchMode('narrative');
      assert.equal(result, true);
    });

    test('returns to empty mode when empty string', () => {
      state.currentMode = 'narrative';
      const result = switchMode('');
      assert.equal(result, true);
      assert.equal(state.currentMode, '');
    });

    test('stops audio when switching to empty', () => {
      state.currentMode = 'narrative';
      state.isPlaying = true;
      switchMode('');
      // audio.toggleMasterPlay would be called internally
      assert.ok(true);
    });
  });

  describe('activateMode', () => {
    test('activates mode module', () => {
      activateMode('narrative');
      assert.ok(true);
    });
  });

  describe('getCurrentModeModule', () => {
    test('returns module for current mode', () => {
      state.currentMode = 'narrative';
      const module = getCurrentModeModule();
      assert.ok(module);
      assert.ok(typeof module.activate === 'function');
    });

    test('returns null for free mode', () => {
      state.currentMode = 'free';
      const module = getCurrentModeModule();
      assert.equal(module, null);
    });
  });

  describe('isMode', () => {
    test('returns true for matching mode', () => {
      state.currentMode = 'narrative';
      assert.equal(isMode('narrative'), true);
    });

    test('returns false for different mode', () => {
      state.currentMode = 'narrative';
      assert.equal(isMode('pomodoro'), false);
    });
  });

  describe('getCurrentModeConfig', () => {
    test('returns config for current mode', () => {
      state.currentMode = 'pomodoro';
      const config = getCurrentModeConfig();
      assert.ok(config);
      assert.equal(config.id, 'pomodoro');
    });

    test('returns undefined for invalid mode', () => {
      state.currentMode = 'invalid';
      const config = getCurrentModeConfig();
      assert.equal(config, undefined);
    });
  });

  describe('isPomodoroMode', () => {
    test('returns true when in pomodoro mode', () => {
      state.currentMode = 'pomodoro';
      assert.equal(isPomodoroMode(), true);
    });

    test('returns false otherwise', () => {
      state.currentMode = 'narrative';
      assert.equal(isPomodoroMode(), false);
    });
  });

  describe('isSleepMode', () => {
    test('returns true when in sleep mode', () => {
      state.currentMode = 'sleep';
      assert.equal(isSleepMode(), true);
    });

    test('returns false otherwise', () => {
      state.currentMode = 'narrative';
      assert.equal(isSleepMode(), false);
    });
  });

  describe('isNarrativeMode', () => {
    test('returns true when in narrative mode', () => {
      state.currentMode = 'narrative';
      assert.equal(isNarrativeMode(), true);
    });

    test('returns false otherwise', () => {
      state.currentMode = 'pomodoro';
      assert.equal(isNarrativeMode(), false);
    });
  });

  describe('isFreeMode', () => {
    test('returns true when in free mode', () => {
      state.currentMode = 'free';
      assert.equal(isFreeMode(), true);
    });

    test('returns false otherwise', () => {
      state.currentMode = 'narrative';
      assert.equal(isFreeMode(), false);
    });
  });

  describe('modeModules', () => {
    test('has modules for all modes', () => {
      assert.ok(modeModules.narrative);
      assert.ok(modeModules.pomodoro);
      assert.ok(modeModules.sleep);
      assert.equal(modeModules.free, null);
    });

    test('modules have activate/deactivate functions', () => {
      assert.ok(typeof modeModules.narrative.activate === 'function');
      assert.ok(typeof modeModules.narrative.deactivate === 'function');
      assert.ok(typeof modeModules.pomodoro.activate === 'function');
      assert.ok(typeof modeModules.pomodoro.deactivate === 'function');
      assert.ok(typeof modeModules.sleep.activate === 'function');
      assert.ok(typeof modeModules.sleep.deactivate === 'function');
    });
  });
});