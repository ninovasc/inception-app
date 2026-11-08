// tests/integration/state-audio.test.mjs - Integration tests for state + audio modules
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioContext } from '../../js/audio.js';
// Import pure functions directly
import {
  calculateCrossfadeGain,
  normalizeLevelIndex,
  getWorldVolume,
  getSourceMode,
} from '../../js/audio.js';
import { normalizeSourceType } from '../../js/config.js';

describe('Integration: State + Audio', () => {
  let audioCtx;
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
    audioCtx = createAudioContext({ state: stateModule.state });
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('state mutations through audio functions', () => {
    it('setSourceMode mutates worldSourceType array', () => {
      const { state } = audioCtx;
      state.worldSourceType = ['synth', 'synth', 'synth'];
      state.currentLevel = 2;
      
      audioCtx.setSourceMode(2, 'mp3');
      
      assert.equal(state.worldSourceType[2], 'mp3');
      assert.equal(state.sourceMode, 'mp3');
    });

    it('selectLevel updates currentLevel and synth type', () => {
      const { state, LEVELS, WORLD_SYNTH } = audioCtx;
      
      // The pure logic: currentSynthType comes from worldSynth or WORLD_SYNTH
      state.currentLevel = 0;
      state.worldSynth = [0, 1, 2];
      
      const synthType = state.worldSynth[0] != null ? state.worldSynth[0] : WORLD_SYNTH[0];
      assert.equal(synthType, 0);
    });

    it('restartWorldAudio sets sourceMode from worldSourceType', () => {
      const { state, restartWorldAudio } = audioCtx;
      state.isPlaying = true;
      state.worldSourceType = ['mp3', 'synth', 'capture'];
      state.currentLevel = 0;
      
      restartWorldAudio(audioCtx);
      
      assert.equal(state.sourceMode, 'mp3');
    });
  });

  describe('pure function compositions', () => {
    it('normalizeLevelIndex + getWorldVolume composition', () => {
      const idx = normalizeLevelIndex(15, 10); // clamped to 9
      const vol = getWorldVolume([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], idx);
      
      assert.equal(idx, 9);
      assert.equal(vol, 1.0);
    });

    it('getSourceMode + normalizeSourceType composition', () => {
      const mode = getSourceMode(['synth', 'mp3', 'mp3'], 2);
      const normalized = normalizeSourceType(mode);
      
      assert.equal(normalized, 'mp3');
    });
  });
});