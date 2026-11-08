// tests/integration/audio-sensors.test.mjs - Integration tests for audio + sensors modules
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioContext } from '../../js/audio.js';
import { createSensorsContext } from '../../js/sensors.js';
// Import pure functions directly
import {
  calculateCrossfadeGain,
  normalizeLevelIndex,
  getWorldVolume,
  getSourceMode,
} from '../../js/audio.js';
import {
  calculateForce,
  calculateIntensity,
  mapSpeedFromIntensity,
  calculateGyroSliders,
  calculateMicDb,
  isGateOpen,
  detectClap,
  updateOrientationTriggers,
} from '../../js/sensors.js';

describe('Integration: Audio + Sensors', () => {
  let audioCtx;
  let sensorsCtx;
  let originalState;

  before(async () => {
    // Import state to get reference
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
    
    audioCtx = createAudioContext({ state: stateModule.state });
    sensorsCtx = createSensorsContext({ state: stateModule.state });
  });

  after(async () => {
    // Reset state
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('setSourceMode + sensor interaction', () => {
    it('setSourceMode updates state correctly', () => {
      const { state } = audioCtx;
      state.worldSourceType = ['synth', 'synth', 'synth'];
      state.currentLevel = 0;
      
      // Call with default context
      audioCtx.setSourceMode(0, 'mp3');
      
      assert.equal(state.worldSourceType[0], 'mp3');
      assert.equal(state.sourceMode, 'mp3');
    });

    it('setSourceMode backward compatibility (mode only)', () => {
      const { state } = audioCtx;
      state.worldSourceType = ['synth', 'synth', 'synth'];
      state.currentLevel = 1;
      
      audioCtx.setSourceMode('mp3');
      
      assert.equal(state.worldSourceType[1], 'mp3');
      assert.equal(state.sourceMode, 'mp3');
    });
  });

  describe('motionHandler + audio parameters', () => {
    it('motionHandler calculates intensity and maps to speed', () => {
      const { state } = sensorsCtx;
      state.isMotionOn = true;
      state.isPlaying = true;
      
      // Simulate freefall impact force
      const force = 25;
      const intensity = calculateIntensity(force);
      const speed = mapSpeedFromIntensity(intensity);
      
      assert.ok(intensity > 0.5);
      assert.ok(speed > 0.5 && speed <= 1.3);
    });

    it('gyro sliders calculate all parameters', () => {
      const sliders = calculateGyroSliders(45, 30, 90);
      
      assert.ok(typeof sliders.speed === 'number');
      assert.ok(typeof sliders.filter === 'number');
      assert.ok(typeof sliders.delay === 'number');
      assert.ok(typeof sliders.reverb === 'number');
      assert.ok(typeof sliders.gate === 'number');
      assert.ok(typeof sliders.delayV === 'number');
      assert.ok(typeof sliders.feedback === 'number');
      assert.ok(typeof sliders.reverbV === 'number');
      assert.ok(typeof sliders.dryWet === 'number');
    });
  });

  describe('mic gate + clap detection', () => {
    it('calculateMicDb returns correct values', () => {
      // Level 255 = 0 dB
      assert.ok(Math.abs(calculateMicDb(255)) < 1);
      
      // Level 128 = ~-6 dB
      const db128 = calculateMicDb(128);
      assert.ok(db128 < 0 && db128 > -10);
      
      // Gate open when db > threshold
      assert.equal(isGateOpen(-5, -10), true);
      assert.equal(isGateOpen(-15, -10), false);
    });

    it('detectClap identifies valid clap pattern', () => {
      // Valid: high db, previous low, within window
      assert.equal(detectClap(-5, -20, 1000, 500, 1), true);
      
      // Invalid: db not high enough
      assert.equal(detectClap(-15, -20, 1000, 500, 1), false);
      
      // Invalid: previous not low enough
      assert.equal(detectClap(-5, -10, 1000, 500, 1), false);
      
      // Invalid: too recent
      assert.equal(detectClap(-5, -20, 1000, 900, 1), false);
      
      // Invalid: outside window
      assert.equal(detectClap(-5, -20, 1000, 0, 1), false);
    });
  });

  describe('orientation triggers', () => {
    it('updateOrientationTriggers sets inverted hold', () => {
      const ctx = {
        state: {
          invertedSince: null,
          isInvertedHold: false,
          isPhoneFaceDown: false,
          flatSince: null,
          isFlatHold: false,
        },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(160, 0, 5000, ctx);
      
      assert.ok(ctx.state.invertedSince !== null);
      assert.equal(ctx.state.isInvertedHold, false); // Not held long enough
      assert.equal(ctx.state.isPhoneFaceDown, true); // 160 > 145
    });

    it('updateOrientationTriggers sets flat hold', () => {
      const ctx = {
        state: {
          invertedSince: null,
          isInvertedHold: false,
          isPhoneFaceDown: false,
          flatSince: null,
          isFlatHold: false,
        },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(20, 10, 5000, ctx);
      
      assert.ok(ctx.state.flatSince !== null);
      assert.equal(ctx.state.isFlatHold, false); // Not held long enough
    });
  });

  describe('crossfade gain calculation', () => {
    it('calculateCrossfadeGain returns correct object', () => {
      const result = calculateCrossfadeGain(0.5, 1.0, 750);
      
      assert.deepEqual(result, { currentGain: 0.5, targetGain: 1.0, duration: 750 });
    });
  });

  describe('level index normalization', () => {
    it('normalizeLevelIndex clamps correctly', () => {
      assert.equal(normalizeLevelIndex(5, 10), 5);
      assert.equal(normalizeLevelIndex(-1, 10), 0);
      assert.equal(normalizeLevelIndex(15, 10), 9);
    });
  });

  describe('world volume getter', () => {
    it('getWorldVolume returns correct values', () => {
      assert.equal(getWorldVolume([0.1, 0.5, 0.8], 1), 0.5);
      assert.equal(getWorldVolume(null, 0), 0.2);
      assert.equal(getWorldVolume([0.1, null], 1), 0.2);
      assert.equal(getWorldVolume([0.1], 5, 0.5), 0.5);
    });
  });

  describe('source mode getter', () => {
    it('getSourceMode returns correct values', () => {
      assert.equal(getSourceMode(['synth', 'mp3'], 1), 'mp3');
      assert.equal(getSourceMode(null, 0), 'synth');
      assert.equal(getSourceMode(['synth', null], 1), 'synth');
      assert.equal(getSourceMode(['synth'], 5, 'mp3'), 'mp3');
    });
  });
});