// tests/unit/mechanics-pure.test.mjs - Unit tests for pure functions in mechanics.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDeprivationTriggered,
  calculateLucidProgress,
  calculateLucidTargetSpeed,
  calculateLucidTargetFilter,
  calculateMemCatcherDelay,
  isSilentNoiseLevel,
  normalizeLucidModeIdx,
  formatTimeRemaining,
  shouldTriggerAutoKick,
} from '../../js/mechanics.js';

describe('Mechanics Pure Functions', () => {
  describe('isDeprivationTriggered', () => {
    it('returns true when all conditions met', () => {
      assert.equal(isDeprivationTriggered(15, true, false, true), true);
      assert.equal(isDeprivationTriggered(20, false, false, true), true);
    });

    it('returns false when silence < 15s', () => {
      assert.equal(isDeprivationTriggered(14, true, false, true), false);
      assert.equal(isDeprivationTriggered(0, true, false, true), false);
    });

    it('returns false when not phone face down and motion on', () => {
      assert.equal(isDeprivationTriggered(15, false, true, true), false);
    });

    it('returns false when mic off', () => {
      assert.equal(isDeprivationTriggered(15, true, false, false), false);
    });
  });

  describe('calculateLucidProgress', () => {
    it('returns 0 when timer just started', () => {
      assert.equal(calculateLucidProgress(600, 600), 0);
    });

    it('returns 1 when timer finished', () => {
      assert.equal(calculateLucidProgress(0, 600), 1);
      assert.equal(calculateLucidProgress(-10, 600), 1); // clamped
    });

    it('returns 0.5 at halfway', () => {
      assert.equal(calculateLucidProgress(300, 600), 0.5);
    });

    it('clamps to [0, 1]', () => {
      assert.equal(calculateLucidProgress(700, 600), 0); // not started
      assert.equal(calculateLucidProgress(-100, 600), 1); // past end
    });

    it('handles zero totalSec', () => {
      assert.equal(calculateLucidProgress(100, 0), 1);
    });
  });

  describe('calculateLucidTargetSpeed', () => {
    it('returns 1.0 at start (progress 0)', () => {
      assert.equal(calculateLucidTargetSpeed(0), 1.0);
    });

    it('returns 0.3 at end (progress 1)', () => {
      assert.ok(Math.abs(calculateLucidTargetSpeed(1) - 0.3) < 0.0001);
    });

    it('interpolates linearly', () => {
      assert.ok(Math.abs(calculateLucidTargetSpeed(0.5) - 0.65) < 0.0001);
    });
  });

  describe('calculateLucidTargetFilter', () => {
    it('returns 18000 at start (progress 0)', () => {
      assert.equal(calculateLucidTargetFilter(0), 18000);
    });

    it('returns 400 at end (progress 1)', () => {
      assert.equal(calculateLucidTargetFilter(1), 400);
    });

    it('interpolates linearly', () => {
      assert.equal(calculateLucidTargetFilter(0.5), 9200);
    });
  });

  describe('calculateMemCatcherDelay', () => {
    it('returns value between 8000 and 24000', () => {
      for (let i = 0; i < 100; i++) {
        const delay = calculateMemCatcherDelay();
        assert.ok(delay >= 8000 && delay <= 24000);
      }
    });
  });

  describe('isSilentNoiseLevel', () => {
    it('returns true when below default threshold', () => {
      assert.equal(isSilentNoiseLevel(10), true);
      assert.equal(isSilentNoiseLevel(0), true);
    });

    it('returns false when above default threshold', () => {
      assert.equal(isSilentNoiseLevel(20), false);
      assert.equal(isSilentNoiseLevel(100), false);
    });

    it('respects custom threshold', () => {
      assert.equal(isSilentNoiseLevel(15, 20), true);
      assert.equal(isSilentNoiseLevel(25, 20), false);
    });
  });

  describe('normalizeLucidModeIdx', () => {
    it('normalizes positive indices', () => {
      assert.equal(normalizeLucidModeIdx(0, 4), 0);
      assert.equal(normalizeLucidModeIdx(2, 4), 2);
      assert.equal(normalizeLucidModeIdx(4, 4), 0);
      assert.equal(normalizeLucidModeIdx(5, 4), 1);
    });

    it('normalizes negative indices', () => {
      assert.equal(normalizeLucidModeIdx(-1, 4), 3);
      assert.equal(normalizeLucidModeIdx(-2, 4), 2);
      assert.equal(normalizeLucidModeIdx(-4, 4), 0);
      assert.equal(normalizeLucidModeIdx(-5, 4), 3);
    });
  });

  describe('formatTimeRemaining', () => {
    it('formats minutes and seconds', () => {
      assert.equal(formatTimeRemaining(0), '0:00');
      assert.equal(formatTimeRemaining(30), '0:30');
      assert.equal(formatTimeRemaining(60), '1:00');
      assert.equal(formatTimeRemaining(125), '2:05');
      assert.equal(formatTimeRemaining(3661), '61:01');
    });

    it('handles negative seconds', () => {
      assert.equal(formatTimeRemaining(-10), '0:00');
      assert.equal(formatTimeRemaining(-60), '0:00');
    });
  });

  describe('shouldTriggerAutoKick', () => {
    it('returns false when autoKick off', () => {
      assert.equal(shouldTriggerAutoKick(25, 0, 1000, 0, false), false);
    });

    it('returns false when last kick recent', () => {
      assert.equal(shouldTriggerAutoKick(25, 0, 1000, 500, true), false);
    });

    it('returns "freefall_start" when force < 3.2', () => {
      assert.equal(shouldTriggerAutoKick(2, 0, 7000, 0, true), 'freefall_start');
      assert.equal(shouldTriggerAutoKick(0, 0, 7000, 0, true), 'freefall_start');
    });

    it('returns "freefall_impact" when force > 21', () => {
      assert.equal(shouldTriggerAutoKick(25, 0, 7000, 0, true), 'freefall_impact');
      assert.equal(shouldTriggerAutoKick(30, 0, 7000, 0, true), 'freefall_impact');
    });

    it('returns "freefall_impact" when freefall recent and force > 13.5', () => {
      assert.equal(shouldTriggerAutoKick(15, 6500, 7000, 0, true), 'freefall_impact');
      assert.equal(shouldTriggerAutoKick(14, 6500, 7000, 0, true), 'freefall_impact');
    });

    it('returns false for intermediate forces', () => {
      assert.equal(shouldTriggerAutoKick(10, 0, 7000, 0, true), false);
      assert.equal(shouldTriggerAutoKick(13, 6500, 7000, 0, true), false);
      assert.equal(shouldTriggerAutoKick(13.5, 0, 7000, 0, true), false);
    });
  });
});