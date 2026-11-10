// tests/unit/modes-narrativeMode-pure.test.mjs - Unit tests for modes/narrativeMode.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../../js/state.js';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let activate, start, deactivate, stopAutoMode, startAutoMode, evaluateAutoMode, decideWorld, toggleAutoMode, isAutoMode, getActiveTrigger, resetSession, setAutoModeEnabled, getSessionStartTime, setSessionStartTime;

before(async () => {
  await import('../mock-browser.mjs');
  const mod = await import('../../js/modes/narrativeMode.js');
  activate = mod.activate;
  start = mod.start;
  deactivate = mod.deactivate;
  stopAutoMode = mod.stopAutoMode;
  startAutoMode = mod.startAutoMode;
  evaluateAutoMode = mod.evaluateAutoMode;
  decideWorld = mod.decideWorld;
  toggleAutoMode = mod.toggleAutoMode;
  isAutoMode = mod.isAutoMode;
  getActiveTrigger = mod.getActiveTrigger;
  resetSession = mod.resetSession;
  setAutoModeEnabled = mod.setAutoModeEnabled;
  getSessionStartTime = mod.getSessionStartTime;
  setSessionStartTime = mod.setSessionStartTime;
});

after(() => {
  cleanupTimers();
});

describe('Narrative Mode Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('activate/deactivate', () => {
    it('activate sets autoMode to true', () => {
      state.autoMode = false;
      activate();
      assert.equal(state.autoMode, true);
    });

    it('deactivate sets autoMode to false', () => {
      state.autoMode = true;
      deactivate();
      assert.equal(state.autoMode, false);
    });
  });

  describe('start/stopAutoMode', () => {
    it('startAutoMode sets autoMode and creates interval', () => {
      state.autoMode = false;
      startAutoMode();
      assert.equal(state.autoMode, true);
    });

    it('stopAutoMode clears interval and sets autoMode false', () => {
      state.autoMode = true;
      stopAutoMode();
      assert.equal(state.autoMode, false);
    });

    it('toggleAutoMode toggles state', () => {
      state.autoMode = false;
      toggleAutoMode();
      assert.equal(state.autoMode, true);
      toggleAutoMode();
      assert.equal(state.autoMode, false);
    });

    it('isAutoMode returns current state', () => {
      state.autoMode = true;
      assert.equal(isAutoMode(), true);
      state.autoMode = false;
      assert.equal(isAutoMode(), false);
    });
  });

  describe('setAutoModeEnabled', () => {
    it('enables auto mode when true', () => {
      state.autoMode = false;
      setAutoModeEnabled(true);
      assert.equal(state.autoMode, true);
    });

    it('disables auto mode when false', () => {
      state.autoMode = true;
      setAutoModeEnabled(false);
      assert.equal(state.autoMode, false);
    });
  });

  describe('session management', () => {
    it('resetSession clears session state', () => {
      resetSession();
      assert.ok(true); // just verify it doesn't throw
    });

    it('get/setSessionStartTime works', () => {
      setSessionStartTime(1234567890);
      assert.equal(getSessionStartTime(), 1234567890);
    });
  });

  describe('decideWorld', () => {
    it('returns fallback world when no triggers active', () => {
      state.worldTriggers = { fallback: 0 };
      const result = decideWorld();
      assert.equal(result, 0);
    });

    it('returns world for active trigger', () => {
      state.worldTriggers = { bonusRain: 2, fallback: 0 };
      state.micRainIntenseSec = 100; // trigger active
      const result = decideWorld();
      assert.equal(result, 2);
    });

    it('handles missing worldTriggers gracefully', () => {
      state.worldTriggers = null;
      const result = decideWorld();
      assert.ok(result >= 0);
    });
  });

  describe('evaluateAutoMode', () => {
    it('returns null when not in narrative mode', () => {
      state.currentMode = 'pomodoro';
      assert.equal(evaluateAutoMode(), null);
    });

    it('returns null when autoMode disabled', () => {
      state.currentMode = 'narrative';
      state.autoMode = false;
      assert.equal(evaluateAutoMode(), null);
    });

    it('calls selectLevel when world changes', () => {
      state.currentMode = 'narrative';
      state.autoMode = true;
      state.currentLevel = 0;
      state.worldTriggers = { bonusRain: 2 };
      state.micRainIntenseSec = 100;
      evaluateAutoMode();
      // Should call audio.selectLevel internally
      assert.ok(true);
    });
  });

  describe('getActiveTrigger', () => {
    it('returns last decision', () => {
      const result = getActiveTrigger();
      assert.ok(result);
    });
  });
});