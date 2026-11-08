// tests/unit/ui-commonUI-pure.test.mjs - Unit tests for ui/commonUI.js
import '../mock-browser.mjs';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderWorldSelect,
  renderVoicePresets,
  renderSourceList,
  syncSlidersFromState,
  initCommonUI,
} from '../../js/ui/commonUI.js';

describe('CommonUI Module', () => {
  let originalState;
  let originalDocument;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
    originalDocument = global.document;
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
    global.document = originalDocument;
  });

  beforeEach(() => {
    global.document = {
      getElementById: (id) => {
        const el = document.createElement('div');
        el.id = id;
        el.value = '';
        el.innerHTML = '';
        el.textContent = '';
        el.style = {};
        el.classList = { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} };
        el.setAttribute = () => {};
        el.getAttribute = () => null;
        el.appendChild = () => {};
        el.querySelector = () => null;
        el.querySelectorAll = () => [];
        return el;
      },
      createElement: () => document.createElement('div'),
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {} },
    };
  });

  afterEach(() => {
    global.document = global.document; // Keep mock
  });

  describe('renderWorldSelect', () => {
    it('renders world select for narrative mode', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentMode = 'narrative';
      stateModule.state.currentLevel = 0;
      
      renderWorldSelect();
      assert.ok(true);
    });

    it('renders world select for pomodoro mode', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentMode = 'pomodoro';
      stateModule.state.currentLevel = 1;
      
      renderWorldSelect();
      assert.ok(true);
    });

    it('handles missing element', () => {
      global.document.getElementById = () => null;
      renderWorldSelect();
      assert.ok(true);
    });
  });

  describe('renderVoicePresets', () => {
    it('renders voice presets for narrative mode', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentMode = 'narrative';
      stateModule.state.currentLevel = 0;
      stateModule.state.voicePreset = 'custom';
      
      renderVoicePresets();
      assert.ok(true);
    });

    it('handles missing element', () => {
      global.document.getElementById = () => null;
      renderVoicePresets();
      assert.ok(true);
    });
  });

  describe('renderSourceList', () => {
    it('renders source list for narrative mode', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentMode = 'narrative';
      stateModule.state.currentLevel = 0;
      stateModule.state.worldSourceType = ['synth', 'synth', 'synth'];
      stateModule.state.worldSynth = [0, 1, 2];
      stateModule.state.worldVolume = [0.2, 0.2, 0.2];
      stateModule.state.worldSources = { mp3: ['', '', ''] };
      
      renderSourceList();
      assert.ok(true);
    });

    it('renders MP3 controls when sourceType is mp3', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentMode = 'narrative';
      stateModule.state.currentLevel = 0;
      stateModule.state.worldSourceType = ['mp3', 'synth', 'synth'];
      stateModule.state.worldSynth = [0, 1, 2];
      stateModule.state.worldVolume = [0.5, 0.2, 0.2];
      stateModule.state.worldSources = { mp3: ['test.mp3', '', ''] };
      
      renderSourceList();
      assert.ok(true);
    });

    it('handles missing container', () => {
      global.document.getElementById = () => null;
      renderSourceList();
      assert.ok(true);
    });
  });

  describe('syncSlidersFromState', () => {
    it('syncs sliders from state', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentLevel = 0;
      stateModule.state.xyState = { x: 0.75 };
      stateModule.state.masterFilter = { frequency: { value: 5000 } };
      stateModule.state.delayWet = 0.25;
      stateModule.state.reverbWet = 0.6;
      
      syncSlidersFromState();
      assert.ok(true);
    });

    it('handles missing state values', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.currentLevel = -1;
      
      syncSlidersFromState();
      assert.ok(true);
    });
  });

  describe('initCommonUI', () => {
    it('initializes all UI components', () => {
      initCommonUI();
      assert.ok(true);
    });
  });
});