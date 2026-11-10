// tests/integration/mechanics-integration.test.mjs - Integration tests for js/mechanics.js (pure functions only)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import the pure functions from mechanics.js
import {
  isDeprivationTriggered,
  calculateLucidProgress,
  calculateLucidTargetSpeed,
  calculateLucidTargetFilter,
  calculateMemCatcherDelay,
  isSilentNoiseLevel,
  normalizeLucidModeIdx,
  formatTimeRemaining,
  shouldTriggerAutoKick
} from '../../js/mechanics.js';

describe('Mechanics Pure Functions Integration', () => {

  // ============================================================
  // Deprivation Trigger Tests
  // ============================================================
  describe('isDeprivationTriggered', () => {
    it('returns true when all conditions met', () => {
      const result = isDeprivationTriggered(20, true, false, true);
      assert.equal(result, true);
    });

    it('returns false when not silent enough', () => {
      const result = isDeprivationTriggered(10, true, false, true);
      assert.equal(result, false);
    });

    it('returns false when phone not face down and motion on', () => {
      const result = isDeprivationTriggered(20, false, true, true);
      assert.equal(result, false);
    });

    it('returns false when mic is off', () => {
      const result = isDeprivationTriggered(20, true, false, false);
      assert.equal(result, false);
    });

    it('handles boundary condition at exactly 15 seconds', () => {
      const result = isDeprivationTriggered(15, true, false, true);
      assert.equal(result, true);
    });

    it('handles edge case with motion off but phone not face down', () => {
      const result = isDeprivationTriggered(20, false, false, true);
      assert.equal(result, true);
    });
  });

  // ============================================================
  // Lucid Timer Calculation Tests
  // ============================================================
  describe('calculateLucidProgress', () => {
    it('returns 0 when timer just started', () => {
      const result = calculateLucidProgress(600, 600);
      assert.equal(result, 0);
    });

    it('returns 1 when timer finished', () => {
      const result = calculateLucidProgress(0, 600);
      assert.equal(result, 1);
    });

    it('returns 0.5 at halfway point', () => {
      const result = calculateLucidProgress(300, 600);
      assert.equal(result, 0.5);
    });

    it('handles totalSec <= 0', () => {
      const result = calculateLucidProgress(100, 0);
      assert.equal(result, 1);
    });

    it('clamps progress to 1 maximum', () => {
      const result = calculateLucidProgress(-10, 100);
      assert.equal(result, 1);
    });

    it('clamps progress to 0 minimum', () => {
      const result = calculateLucidProgress(200, 100);
      assert.equal(result, 0);
    });
  });

  describe('calculateLucidTargetSpeed', () => {
    it('returns 1.0 at start (progress 0)', () => {
      const result = calculateLucidTargetSpeed(0);
      assert.equal(result, 1.0);
    });

    it('returns 0.3 at end (progress 1)', () => {
      const result = calculateLucidTargetSpeed(1);
      // 1.00 - (1 * 0.70) = 0.3 (floating point: 0.29999999999999999)
      assert.ok(Math.abs(result - 0.3) < 0.001);
    });

    it('interpolates correctly at 0.5 progress', () => {
      const result = calculateLucidTargetSpeed(0.5);
      // 1.00 - (0.5 * 0.70) = 0.65
      assert.equal(result, 0.65);
    });
  });

  describe('calculateLucidTargetFilter', () => {
    it('returns 18000 at start (progress 0)', () => {
      const result = calculateLucidTargetFilter(0);
      assert.equal(result, 18000);
    });

    it('returns 400 at end (progress 1)', () => {
      const result = calculateLucidTargetFilter(1);
      assert.equal(result, 400);
    });

    it('interpolates correctly at 0.5 progress', () => {
      const result = calculateLucidTargetFilter(0.5);
      assert.equal(result, 9200);
    });
  });

  // ============================================================
  // MemCatcher Delay Tests
  // ============================================================
  describe('calculateMemCatcherDelay', () => {
    it('returns value between 8000 and 24000', () => {
      for (let i = 0; i < 100; i++) {
        const delay = calculateMemCatcherDelay();
        assert.ok(delay >= 8000);
        assert.ok(delay <= 24000);
      }
    });
  });

  // ============================================================
  // Noise Level Tests
  // ============================================================
  describe('isSilentNoiseLevel', () => {
    it('returns true when noise below threshold', () => {
      const result = isSilentNoiseLevel(15, 18);
      assert.equal(result, true);
    });

    it('returns false when noise above threshold', () => {
      const result = isSilentNoiseLevel(25, 18);
      assert.equal(result, false);
    });

    it('returns false at exact threshold (uses <)', () => {
      const result = isSilentNoiseLevel(18, 18);
      assert.equal(result, false);
    });

    it('uses default threshold of 18', () => {
      const result = isSilentNoiseLevel(15);
      assert.equal(result, true);
    });
  });

  // ============================================================
  // Lucid Mode Index Normalization Tests
  // ============================================================
  describe('normalizeLucidModeIdx', () => {
    it('returns same index when within bounds', () => {
      const result = normalizeLucidModeIdx(2, 5);
      assert.equal(result, 2);
    });

    it('wraps positive overflow', () => {
      const result = normalizeLucidModeIdx(7, 5);
      assert.equal(result, 2);
    });

    it('wraps negative index', () => {
      const result = normalizeLucidModeIdx(-1, 5);
      assert.equal(result, 4);
    });

    it('wraps large negative index', () => {
      const result = normalizeLucidModeIdx(-6, 5);
      assert.equal(result, 4);
    });

    it('handles index equal to length', () => {
      const result = normalizeLucidModeIdx(5, 5);
      assert.equal(result, 0);
    });
  });

  // ============================================================
  // Time Formatting Tests
  // ============================================================
  describe('formatTimeRemaining', () => {
    it('formats minutes and seconds correctly', () => {
      const result = formatTimeRemaining(125);
      assert.equal(result, '2:05');
    });

    it('handles exact minutes', () => {
      const result = formatTimeRemaining(120);
      assert.equal(result, '2:00');
    });

    it('handles seconds less than 10', () => {
      const result = formatTimeRemaining(65);
      assert.equal(result, '1:05');
    });

    it('handles zero seconds', () => {
      const result = formatTimeRemaining(0);
      assert.equal(result, '0:00');
    });

    it('handles negative seconds', () => {
      const result = formatTimeRemaining(-10);
      assert.equal(result, '0:00');
    });

    it('pads seconds with leading zero', () => {
      const result = formatTimeRemaining(61);
      assert.equal(result, '1:01');
    });
  });

  // ============================================================
  // Auto-Kick Trigger Tests
  // ============================================================
  describe('shouldTriggerAutoKick', () => {
    it('returns false when auto-kick off', () => {
      const result = shouldTriggerAutoKick(10, 100, 10000, 1000, false);
      assert.equal(result, false);
    });

    it('returns false when cooldown not elapsed', () => {
      const result = shouldTriggerAutoKick(10, 100, 10000, 9000, true);
      assert.equal(result, false);
    });

    it('returns freefall_start for low force', () => {
      // force=2 < 3.2, returns freefall_start
      const result = shouldTriggerAutoKick(2, 0, 10000, 1000, true);
      assert.equal(result, 'freefall_start');
    });

    it('returns freefall_impact for high force', () => {
      // force=25 > 21.0
      const result = shouldTriggerAutoKick(25, 100, 10000, 1000, true);
      assert.equal(result, 'freefall_impact');
    });

    it('returns freefall_impact for freefall with high force and recent freefall', () => {
      // freefallTimestamp recent (500ms ago), force > 13.5
      const now = Date.now();
      const result = shouldTriggerAutoKick(15, now - 500, now, 1000, true);
      assert.equal(result, 'freefall_impact');
    });

    it('returns freefall_impact when freefall timestamp recent and force high', () => {
      const now = Date.now();
      const result = shouldTriggerAutoKick(14, now - 500, now, 1000, true);
      assert.equal(result, 'freefall_impact');
    });

    it('returns false for moderate force with old freefall', () => {
      const now = Date.now();
      // freefall 2000ms ago (older than 900ms threshold)
      const result = shouldTriggerAutoKick(14, now - 2000, now, 1000, true);
      assert.equal(result, false);
    });

    it('returns false when auto-kick off regardless of force', () => {
      const result = shouldTriggerAutoKick(30, 100, 10000, 1000, false);
      assert.equal(result, false);
    });
  });
});