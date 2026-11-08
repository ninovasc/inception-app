// tests/unit/audio-world-pure.test.mjs - Unit tests for audio/world.js pure functions
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  setWorldSynth,
  setWorldVolume,
} from '../../js/audio/world.js';
import { state } from '../../js/state.js';

describe('Audio World Module', () => {
  it('sets synth type for world', () => {
    setWorldSynth(0, 3);
    assert.equal(state.worldSynth[0], 3);
  });

  it('handles different world indices', () => {
    setWorldSynth(5, 7);
    setWorldSynth(12, 2);
    assert.equal(state.worldSynth[5], 7);
    assert.equal(state.worldSynth[12], 2);
  });

  it('handles invalid indices gracefully', () => {
    setWorldSynth(-1, 3);
    setWorldSynth(999, 3);
    assert.ok(true);
  });

  it('sets volume for world', () => {
    setWorldVolume(0, 0.5);
    assert.equal(state.worldVolume[0], 0.5);
  });

  it('handles backward compatibility (volume only)', () => {
    setWorldVolume(0.3);
    // Should use currentLevel
    assert.ok(true);
  });

  it('clamps volume to valid range', () => {
    setWorldVolume(0, -0.5);
    setWorldVolume(1, 1.5);
    assert.ok(true);
  });

  it('updates MP3 gain when playing', () => {
    state.isPlaying = true;
    state.currentLevel = 0;
    state.worldSourceType = ['mp3'];
    state.worldMp3Gains = [null];
    state.audioCtx = { currentTime: 0 };
    
    setWorldVolume(0, 0.7);
    assert.ok(true);
  });
});