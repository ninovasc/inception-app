// tests/unit/mp3-pure.test.mjs - Unit tests for pure functions in audio/mp3.js
import '../mock-browser.mjs';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickAnchor,
  scheduleMp3Continue,
  mp3Meta,
} from '../../js/audio/mp3.js';

describe('MP3 Pure Functions', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('pickAnchor', () => {
    it('returns anchor when anchors exist', () => {
      // Setup mock meta
      mp3Meta.set(0, {
        anchors: [10, 20, 30, 40, 50],
        used: { 0: 1000, 1: 2000, 2: 3000, 3: 4000, 4: 5000 }
      });
      
      const anchor = pickAnchor(0, 15);
      assert.ok([10, 20, 30, 40, 50].includes(anchor));
    });

    it('returns null when no anchors', () => {
      mp3Meta.set(1, { anchors: [], used: {} });
      
      const anchor = pickAnchor(1, 10);
      assert.equal(anchor, null);
    });

    it('falls back to pool when filter removes all (REGRESSION TEST)', () => {
      // All anchors within 1 second of avoidSec - filter would remove all
      mp3Meta.set(2, {
        anchors: [10.1, 10.2, 10.3],
        used: { 0: 1000, 1: 2000, 2: 3000 }
      });
      
      const anchor = pickAnchor(2, 10.15);
      // Should return one of the anchors, not null
      assert.ok([10.1, 10.2, 10.3].includes(anchor));
    });

    it('avoids avoidSec when possible', () => {
      mp3Meta.set(3, {
        anchors: [5, 15, 25, 35, 45],
        used: { 0: 1000, 1: 2000, 2: 3000, 3: 4000, 4: 5000 }
      });
      
      // avoidSec = 15, should pick from others
      const anchor = pickAnchor(3, 15);
      assert.ok(anchor !== 15);
    });

    it('returns null when meta not found', () => {
      const anchor = pickAnchor(999, 10);
      assert.equal(anchor, null);
    });
  });

  describe('pickAnchor with avoidSec null', () => {
    it('uses -999 as default avoidSec', () => {
      mp3Meta.set(4, {
        anchors: [5, 15, 25],
        used: { 0: 1000, 1: 2000, 2: 3000 }
      });
      
      const anchor = pickAnchor(4, null);
      assert.ok([5, 15, 25].includes(anchor));
    });
  });

  describe('scheduleMp3Continue handles null anchor', () => {
    it('returns early when pickAnchor returns null', () => {
      // This is a behavioral test - we verify the function doesn't throw
      // when pickAnchor returns null
      mp3Meta.set(5, {
        buffer: { duration: 100 },
        anchors: [],
        used: {},
        jumpTimer: null,
        src: { stop: () => {} },
        gain: { gain: { cancelScheduledValues: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, disconnect: () => {} },
        curOffset: 0
      });
      
      // Should not throw even when pickAnchor returns null
      scheduleMp3Continue(5, { duration: 100 }, 0, 1);
      assert.ok(true);
    });
  });
});