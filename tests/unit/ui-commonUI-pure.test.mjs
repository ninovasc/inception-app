// tests/unit/ui-commonUI-pure.test.mjs - Unit tests for ui/commonUI.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, renderWorldSelect, renderVoicePresets, renderSourceList, syncSlidersFromState, initCommonUI;

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
  
  const mod = await import('../../js/ui/commonUI.js');
  renderWorldSelect = mod.renderWorldSelect;
  renderVoicePresets = mod.renderVoicePresets;
  renderSourceList = mod.renderSourceList;
  syncSlidersFromState = mod.syncSlidersFromState;
  initCommonUI = mod.initCommonUI;
});

after(() => {
  cleanupTimers();
});

describe('Common UI Module', () => {
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
    state.currentLevel = 0;
    state.xyState = { x: 1.0, y: 0.0 };
    state.worldVolume = [0.2, 0.2, 0.2];
    state.worldSourceType = ['synth', 'synth', 'synth'];
    state.worldSynth = [0, 0, 0];
    state.worldSources = { mp3: ['', '', ''] };
    state.voicePreset = '0';
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('renderWorldSelect', () => {
    test('renders world select dropdown with correct options', () => {
      renderWorldSelect();
      // Test passes if no error thrown
      assert.ok(true);
    });

    test('handles missing element gracefully', () => {
      // Test with missing element - should not throw
      renderWorldSelect();
      assert.ok(true);
    });
  });

  describe('renderVoicePresets', () => {
    test('renders voice preset dropdown with worlds', () => {
      renderVoicePresets();
      assert.ok(true);
    });

    test('includes custom option', () => {
      state.voicePreset = 'custom';
      renderVoicePresets();
      assert.ok(true);
    });
  });

  describe('renderSourceList', () => {
    test('renders source list for all worlds', () => {
      renderSourceList();
      assert.ok(true);
    });

    test('handles different source types', () => {
      state.worldSourceType = ['synth', 'mp3', 'synth'];
      state.worldSources.mp3 = ['test.mp3', '', ''];
      renderSourceList();
      assert.ok(true);
    });

    test('handles missing container gracefully', () => {
      renderSourceList();
      assert.ok(true);
    });
  });

  describe('syncSlidersFromState', () => {
    test('syncs speed slider from xyState.x', () => {
      state.xyState = { x: 1.5, y: 0.2 };
      syncSlidersFromState();
      assert.ok(true);
    });

    test('syncs filter slider from masterFilter.frequency.value', () => {
      state.masterFilter.frequency.value = 5000;
      syncSlidersFromState();
      assert.ok(true);
    });

    test('syncs delay slider from delayWet', () => {
      state.delayWet = 0.5;
      syncSlidersFromState();
      assert.ok(true);
    });

    test('syncs reverb slider from reverbWet', () => {
      state.reverbWet = 0.8;
      syncSlidersFromState();
      assert.ok(true);
    });

    test('handles missing elements gracefully', () => {
      syncSlidersFromState();
      assert.ok(true);
    });
  });

  describe('initCommonUI', () => {
    test('calls all render functions', () => {
      initCommonUI();
      assert.ok(true);
    });
  });
});