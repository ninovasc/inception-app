// tests/unit/audio-effects-pure.test.mjs - Unit tests for audio/effects.js pure functions
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  playHeartbeatPulse,
  captureAndPlaySubconsciousMemory,
} from '../../js/audio/effects.js';

describe('Audio Effects Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('playHeartbeatPulse', () => {
    it('plays heartbeat pulse without throwing', () => {
      playHeartbeatPulse(0);
      playHeartbeatPulse(0.1);
      playHeartbeatPulse(0.5);
      assert.ok(true);
    });

    it('handles negative delay', () => {
      playHeartbeatPulse(-0.1);
      assert.ok(true);
    });
  });

  describe('captureAndPlaySubconsciousMemory', () => {
    it('captures and plays without throwing', async () => {
      await captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });

    it('handles missing mic stream gracefully', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.micStream = null;
      await captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });
  });
});