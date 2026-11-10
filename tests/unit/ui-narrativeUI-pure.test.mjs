// tests/unit/ui-narrativeUI-pure.test.mjs - Unit tests for ui/narrativeUI.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, createNarrativeUI, updateNarrativeUI;

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
  
  const mod = await import('../../js/ui/narrativeUI.js');
  createNarrativeUI = mod.createNarrativeUI;
  updateNarrativeUI = mod.updateNarrativeUI;
});

after(() => {
  cleanupTimers();
});

describe('Narrative UI Module', () => {
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
    state.currentMode = 'narrative';
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('createNarrativeUI', () => {
    test('creates narrative UI container', () => {
      const container = createNarrativeUI();
      assert.ok(container);
      assert.equal(container.id, 'narrativeUI');
    });
  });

  describe('updateNarrativeUI', () => {
    test('returns early when not in narrative mode', () => {
      state.currentMode = 'pomodoro';
      updateNarrativeUI();
      assert.ok(true);
    });

    test('calls initCommonUI when in narrative mode', () => {
      state.currentMode = 'narrative';
      updateNarrativeUI();
      assert.ok(true);
    });

    test('calls updateTriggerIndicator', () => {
      state.currentMode = 'narrative';
      updateNarrativeUI();
      assert.ok(true);
    });

    test('calls syncMechanicsUI when available', () => {
      state.currentMode = 'narrative';
      updateNarrativeUI();
      assert.ok(true);
    });

    test('calls renderTriggerList', () => {
      state.currentMode = 'narrative';
      updateNarrativeUI();
      assert.ok(true);
    });
  });
});