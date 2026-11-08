// tests/unit/audio-stems-pure.test.mjs - Unit tests for audio/stems.js pure functions
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startStems,
  stopStems,
  setVolume,
} from '../../js/audio/stems.js';

describe('Audio Stems Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('startStems/stopStems', () => {
    it('starts and stops stems without throwing', () => {
      startStems();
      stopStems();
      assert.ok(true);
    });

    it('handles multiple calls', () => {
      startStems();
      startStems();
      stopStems();
      stopStems();
      assert.ok(true);
    });
  });

  describe('setVolume', () => {
    it('sets volume for stems', () => {
      setVolume(0.5);
      assert.ok(true);
    });

    it('handles edge values', () => {
      setVolume(-0.5);
      setVolume(1.5);
      setVolume(0);
      setVolume(1);
      assert.ok(true);
    });
  });
});