// tests/unit/audio-pure.test.mjs - Unit tests for pure functions in audio.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCrossfadeGain,
  normalizeLevelIndex,
  getWorldVolume,
  getSourceMode,
} from '../../js/audio.js';

describe('Audio Pure Functions', () => {
  describe('calculateCrossfadeGain', () => {
    it('returns object with currentGain, targetGain, duration', () => {
      const result = calculateCrossfadeGain(0.5, 1.0, 750);
      assert.deepEqual(result, { currentGain: 0.5, targetGain: 1.0, duration: 750 });
    });

    it('handles zero values', () => {
      const result = calculateCrossfadeGain(0, 0, 0);
      assert.deepEqual(result, { currentGain: 0, targetGain: 0, duration: 0 });
    });

    it('handles negative values', () => {
      const result = calculateCrossfadeGain(-0.5, 0.5, 1000);
      assert.deepEqual(result, { currentGain: -0.5, targetGain: 0.5, duration: 1000 });
    });
  });

  describe('normalizeLevelIndex', () => {
    it('returns index unchanged when within bounds', () => {
      assert.equal(normalizeLevelIndex(5, 10), 5);
      assert.equal(normalizeLevelIndex(0, 10), 0);
      assert.equal(normalizeLevelIndex(9, 10), 9);
    });

    it('clamps negative index to 0', () => {
      assert.equal(normalizeLevelIndex(-1, 10), 0);
      assert.equal(normalizeLevelIndex(-100, 10), 0);
    });

    it('clamps index above max to max-1', () => {
      assert.equal(normalizeLevelIndex(10, 10), 9);
      assert.equal(normalizeLevelIndex(100, 10), 9);
    });
  });

  describe('getWorldVolume', () => {
    it('returns volume for valid index', () => {
      const worldVolume = [0.1, 0.5, 0.8];
      assert.equal(getWorldVolume(worldVolume, 1), 0.5);
    });

    it('returns default when index is out of bounds', () => {
      const worldVolume = [0.1, 0.5];
      assert.equal(getWorldVolume(worldVolume, 5), 0.2);
    });

    it('returns default when worldVolume is null/undefined', () => {
      assert.equal(getWorldVolume(null, 0), 0.2);
      assert.equal(getWorldVolume(undefined, 0), 0.2);
    });

    it('returns default when volume at index is null/undefined', () => {
      const worldVolume = [0.1, null, 0.3];
      assert.equal(getWorldVolume(worldVolume, 1), 0.2);
    });

    it('uses custom default when provided', () => {
      const worldVolume = [0.1, 0.5];
      assert.equal(getWorldVolume(worldVolume, 5, 0.5), 0.5);
    });
  });

  describe('getSourceMode', () => {
    it('returns source mode for valid index', () => {
      const worldSourceType = ['synth', 'mp3', 'capture'];
      assert.equal(getSourceMode(worldSourceType, 1), 'mp3');
    });

    it('returns default when index is out of bounds', () => {
      const worldSourceType = ['synth'];
      assert.equal(getSourceMode(worldSourceType, 5), 'synth');
    });

    it('returns default when worldSourceType is null/undefined', () => {
      assert.equal(getSourceMode(null, 0), 'synth');
      assert.equal(getSourceMode(undefined, 0), 'synth');
    });

    it('returns default when mode at index is null/undefined', () => {
      const worldSourceType = ['synth', null, 'mp3'];
      assert.equal(getSourceMode(worldSourceType, 1), 'synth');
    });

    it('uses custom default when provided', () => {
      const worldSourceType = ['synth'];
      assert.equal(getSourceMode(worldSourceType, 5, 'mp3'), 'mp3');
    });
  });
});