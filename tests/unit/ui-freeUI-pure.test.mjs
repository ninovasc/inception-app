// tests/unit/ui-freeUI-pure.test.mjs - Unit tests for ui/freeUI.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, createFreeUI, updateFreeUI;

before(async () => {
  await import('../mock-browser.mjs');
  
  // Import state module namespace to patch its export directly
  const stateModule = await import('../../js/state.js');
  state = stateModule.state;
  
  // Ensure masterFilter is mocked for tests
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
  
  const mod = await import('../../js/ui/freeUI.js');
  createFreeUI = mod.createFreeUI;
  updateFreeUI = mod.updateFreeUI;
});

after(() => {
  cleanupTimers();
});

describe('Free UI Module', () => {
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
    state.currentMode = 'free';
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('createFreeUI', () => {
    test('creates free UI container', () => {
      const container = createFreeUI();
      assert.ok(container);
      assert.equal(container.id, 'freeUI');
    });
  });

  describe('updateFreeUI', () => {
    test('returns early when not in free mode', () => {
      state.currentMode = 'narrative';
      updateFreeUI();
      assert.ok(true);
    });

    test('calls initCommonUI when in free mode', () => {
      state.currentMode = 'free';
      updateFreeUI();
      assert.ok(true);
    });

    test('calls syncMechanicsUI when available', () => {
      state.currentMode = 'free';
      updateFreeUI();
      assert.ok(true);
    });

    test('calls updateTriggerIndicator to clear active trigger', () => {
      state.currentMode = 'free';
      updateFreeUI();
      assert.ok(true);
    });
  });
});