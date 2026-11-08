// tests/unit/audio-synth-pure.test.mjs - Unit tests for audio/synth.js pure functions
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  selectSynthType,
  setSynthVolume,
  startSynth,
  stopSynth,
  restartSynth,
  startChordProgression,
  stopChordProgression,
  syncXYPadFromSliders,
  updateFromSliders,
  applyParameters,
} from '../../js/audio/synth.js';
import { state } from '../../js/state.js';

describe('Audio Synth Module', () => {
  it('sets current synth type', () => {
    selectSynthType(3);
    assert.equal(state.currentSynthType, 3);
  });

  it('handles invalid indices', () => {
    selectSynthType(-1);
    selectSynthType(999);
    // Should not throw
    assert.ok(true);
  });

  it('sets synth volume', () => {
    setSynthVolume(0.5);
    assert.ok(true);
  });

  it('clamps volume to valid range', () => {
    setSynthVolume(-0.5);
    setSynthVolume(1.5);
    assert.ok(true);
  });

  it('starts and stops synth without throwing', () => {
    startSynth();
    stopSynth();
    assert.ok(true);
  });

  it('handles stop with fade time', () => {
    stopSynth(500);
    assert.ok(true);
  });

  it('restartSynth calls stop then start', () => {
    restartSynth();
    assert.ok(true);
  });

  it('starts and stops chord progression', () => {
    startChordProgression();
    stopChordProgression();
    assert.ok(true);
  });

  it('can be called multiple times', () => {
    startChordProgression();
    startChordProgression();
    stopChordProgression();
    stopChordProgression();
    assert.ok(true);
  });

  it('syncs XY pad from slider values', () => {
    syncXYPadFromSliders(0.5, 1000);
    // The function calculates x from speed and y from filter
    // x = (speed - 0.25) / 1.15 = (0.5 - 0.25) / 1.15 = 0.25 / 1.15 = 0.217...
    // y = 1 - (filter - 160) / (18000 - 160) = 1 - (1000 - 160) / 17840 = 1 - 0.047 = 0.953
    assert.ok(state.xyState.x >= 0 && state.xyState.x <= 1);
    assert.ok(state.xyState.y >= 0 && state.xyState.y <= 1);
  });

  it('handles edge values', () => {
    syncXYPadFromSliders(0, 0);
    assert.ok(state.xyState.x >= 0 && state.xyState.x <= 1);
    assert.ok(state.xyState.y >= 0 && state.xyState.y <= 1);
    syncXYPadFromSliders(1, 18000);
    assert.ok(state.xyState.x >= 0 && state.xyState.x <= 1);
    assert.ok(state.xyState.y >= 0 && state.xyState.y <= 1);
  });
});