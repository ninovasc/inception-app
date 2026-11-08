// tests/unit/sensors-pure.test.mjs - Unit tests for pure functions in sensors.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateForce,
  calculateIntensity,
  mapSpeedFromIntensity,
  isFreefallDetected,
  calculateGyroSliders,
  calculatePanValue,
  calculateMicDb,
  isGateOpen,
  detectClap,
  updateOrientationTriggers,
} from '../../js/sensors.js';

describe('Sensors Pure Functions', () => {
  describe('calculateForce', () => {
    it('calculates force from acceleration', () => {
      const acc = { x: 3, y: 4, z: 0 };
      assert.equal(calculateForce(acc), 5);
    });

    it('handles null/undefined acceleration', () => {
      assert.equal(calculateForce(null), 0);
      assert.equal(calculateForce(undefined), 0);
    });

    it('handles missing x, y, z properties', () => {
      assert.equal(calculateForce({}), 0);
      assert.equal(calculateForce({ x: 1 }), 1);
    });

    it('calculates 3D force correctly', () => {
      const acc = { x: 1, y: 2, z: 2 };
      assert.equal(calculateForce(acc), 3);
    });
  });

  describe('calculateIntensity', () => {
    it('returns 0 for 9.81 (gravity)', () => {
      assert.equal(calculateIntensity(9.81), 0);
    });

    it('returns ~1 for force difference >= 10', () => {
      // force = 0 gives diff = 9.81 (not >= 10)
      // force = 20 gives diff = 10.19 (>= 10)
      // force = -1 gives diff = 10.81 (>= 10)
      assert.ok(Math.abs(calculateIntensity(20) - 1) < 0.0001);
      assert.ok(Math.abs(calculateIntensity(-1) - 1) < 0.0001);
    });

    it('returns proportional intensity for values between', () => {
      assert.ok(Math.abs(calculateIntensity(14.81) - 0.5) < 0.0001);
      assert.ok(Math.abs(calculateIntensity(4.81) - 0.5) < 0.0001);
    });

    it('clamps to 1 for extreme values', () => {
      assert.ok(Math.abs(calculateIntensity(100) - 1) < 0.0001);
      assert.ok(Math.abs(calculateIntensity(-100) - 1) < 0.0001);
    });
  });

  describe('mapSpeedFromIntensity', () => {
    it('maps intensity 0 to speed 0.5', () => {
      assert.equal(mapSpeedFromIntensity(0), 0.5);
    });

    it('maps intensity 1 to speed 1.3', () => {
      assert.equal(mapSpeedFromIntensity(1), 1.3);
    });

    it('maps proportionally', () => {
      assert.equal(mapSpeedFromIntensity(0.5), 0.9);
    });
  });

  describe('isFreefallDetected', () => {
    it('returns false when autoKick is off', () => {
      const result = isFreefallDetected(1, 0, 1000, 0, false);
      assert.equal(result, false);
    });

    it('returns false when last kick was recent', () => {
      const result = isFreefallDetected(1, 0, 1000, 990, true);
      assert.equal(result, false);
    });

    it('returns "freefall_start" when force < 3.2', () => {
      const result = isFreefallDetected(2, 0, 7000, 0, true);
      assert.equal(result, 'freefall_start');
    });

    it('returns "freefall_impact" when force > 21', () => {
      const result = isFreefallDetected(25, 0, 7000, 0, true);
      assert.equal(result, 'freefall_impact');
    });

    it('returns "freefall_impact" when freefall timestamp recent and force > 13.5', () => {
      const result = isFreefallDetected(15, 6500, 7000, 0, true);
      assert.equal(result, 'freefall_impact');
    });

    it('returns false for intermediate values', () => {
      const result = isFreefallDetected(10, 0, 7000, 0, true);
      assert.equal(result, false);
    });
  });

  describe('calculateGyroSliders', () => {
    it('returns all slider values for zero angles', () => {
      const result = calculateGyroSliders(0, 0, 0);
      assert.equal(result.speed, 0.4);
      assert.equal(result.filter, 200);
      assert.equal(result.delay, 0.05);
      assert.equal(result.reverb, 0.05);
      assert.equal(result.gate, -60);
      assert.equal(result.delayV, 0);
      assert.equal(result.feedback, 0);
      assert.equal(result.reverbV, 0);
      assert.equal(result.dryWet, 0.5);
    });

    it('calculates non-linear combinations for non-zero angles', () => {
      const result = calculateGyroSliders(90, 45, 180);
      assert.ok(result.speed > 0.4 && result.speed < 1.4);
      assert.ok(result.filter > 200 && result.filter < 18000);
      assert.ok(result.delay >= 0.05 && result.delay < 0.85);
      assert.ok(result.reverb >= 0.05 && result.reverb < 1);
    });

    it('handles negative angles', () => {
      const result = calculateGyroSliders(-90, -45, -180);
      assert.ok(result.speed > 0.4 && result.speed < 1.4);
    });
  });

  describe('calculatePanValue', () => {
    it('returns 0 when baseCompassAlpha is null', () => {
      assert.equal(calculatePanValue(90, null), 0);
    });

    it('returns 0 when alpha equals baseCompassAlpha', () => {
      assert.equal(calculatePanValue(90, 90), 0);
    });

    it('calculates pan value for positive diff', () => {
      const result = calculatePanValue(155, 90);
      assert.ok(result > 0 && result <= 1);
    });

    it('calculates pan value for negative diff', () => {
      const result = calculatePanValue(25, 90);
      assert.ok(result < 0 && result >= -1);
    });

    it('clamps to [-1, 1]', () => {
      assert.equal(calculatePanValue(90 + 65, 90), 1);
      assert.equal(calculatePanValue(90 - 65, 90), -1);
      assert.equal(calculatePanValue(90 + 100, 90), 1);
      assert.equal(calculatePanValue(90 - 100, 90), -1);
    });

    it('handles wrap-around at 360 degrees', () => {
      const result = calculatePanValue(10, 350);
      assert.ok(result > 0 && result <= 1);
    });
  });

  describe('calculateMicDb', () => {
    it('returns -Infinity for level 0', () => {
      const result = calculateMicDb(0);
      assert.ok(result < -100); // Very low value
    });

    it('returns 0 dB for level 255', () => {
      const result = calculateMicDb(255);
      assert.ok(Math.abs(result) < 1); // Close to 0
    });

    it('returns negative dB for levels < 255', () => {
      const result = calculateMicDb(128);
      assert.ok(result < 0);
    });
  });

  describe('isGateOpen', () => {
    it('returns true when db > threshold', () => {
      assert.equal(isGateOpen(-20, -30), true);
    });

    it('returns false when db <= threshold', () => {
      assert.equal(isGateOpen(-30, -20), false);
      assert.equal(isGateOpen(-20, -20), false);
    });
  });

  describe('detectClap', () => {
    it('returns true for valid clap pattern', () => {
      // db > -10, prevDb < -18, time since last clap > 150ms, within window
      const result = detectClap(-5, -20, 1000, 500, 1);
      assert.equal(result, true);
    });

    it('returns false when db not high enough', () => {
      const result = detectClap(-15, -20, 1000, 500, 1);
      assert.equal(result, false);
    });

    it('returns false when prevDb not low enough', () => {
      const result = detectClap(-5, -10, 1000, 500, 1);
      assert.equal(result, false);
    });

    it('returns false when last clap too recent (< 150ms)', () => {
      const result = detectClap(-5, -20, 1000, 900, 1);
      assert.equal(result, false);
    });

    it('returns false when last clap outside window', () => {
      const result = detectClap(-5, -20, 1000, 0, 1);
      assert.equal(result, false);
    });

    it('returns false when no previous clap (lastClapTs = 0)', () => {
      const result = detectClap(-5, -20, 1000, 0, 1);
      assert.equal(result, false);
    });
  });

  describe('updateOrientationTriggers', () => {
    it('sets inverted hold when beta > TRIGGER_INVERTED_DEG', () => {
      const ctx = {
        state: {
          invertedSince: null,
          isInvertedHold: false,
          isPhoneFaceDown: false,
        },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(160, 0, 5000, ctx);
      assert.ok(ctx.state.invertedSince !== null);
      assert.ok(ctx.state.isInvertedHold === false); // Not held long enough
      assert.ok(ctx.state.isPhoneFaceDown === true); // 160 > 145 and <= 180
    });

    it('sets isInvertedHold true after hold time', () => {
      const ctx = {
        state: {
          invertedSince: 1000,
          isInvertedHold: false,
          isPhoneFaceDown: false,
        },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(160, 0, 5000, ctx);
      assert.ok(ctx.state.isInvertedHold === true);
    });

    it('resets inverted when beta <= TRIGGER_INVERTED_DEG', () => {
      const ctx = {
        state: {
          invertedSince: 1000,
          isInvertedHold: true,
          isPhoneFaceDown: false,
        },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(100, 0, 5000, ctx);
      assert.ok(ctx.state.invertedSince === null);
      assert.ok(ctx.state.isInvertedHold === false);
    });

    it('sets flat hold when beta and gamma within TRIGGER_FLAT_DEG', () => {
      const ctx = {
        state: {
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
      assert.ok(ctx.state.isFlatHold === false);
    });

    it('sets isPhoneFaceDown when beta > 145', () => {
      const ctx = {
        state: { isPhoneFaceDown: false },
        TRIGGER_INVERTED_DEG: 150,
        TRIGGER_INVERTED_HOLD_SEC: 2,
        TRIGGER_FLAT_DEG: 30,
        TRIGGER_FLAT_HOLD_SEC: 2,
      };
      
      updateOrientationTriggers(150, 0, 5000, ctx);
      assert.ok(ctx.state.isPhoneFaceDown === true);
    });
  });
});