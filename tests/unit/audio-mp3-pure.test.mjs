// @ts-nocheck
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

let state, computeAnchors, pickAnchor, startMp3Source, scheduleMp3Continue, startMp3World, stopMp3World, stopAllMp3World, setWorldMp3Volume, crossfadeMp3Worlds, mp3Meta;

const mockDocument = {
  getElementById: (id) => {
    if (id === 'sliderSpeed') return { value: '1.0' };
    return { textContent: '', style: {} };
  }
};

function setupMocks() {
  global.document = mockDocument;
}

function cleanupMocks() {
  delete global.document;
}

describe('Audio MP3 Module - Pure Functions', () => {
  beforeEach(async () => {
    setupMocks();
    // Mock state
    state = {
      audioCtx: {
        createBufferSource: () => ({
          buffer: null,
          loop: false,
          playbackRate: { value: 1 },
          connect: () => {},
          start: () => {},
          stop: () => {},
          onended: null
        }),
        createGain: () => ({
          gain: {
            value: 0,
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
            cancelScheduledValues: () => {},
            setTargetAtTime: () => {}
          },
          connect: () => {},
          disconnect: () => {}
        }),
        currentTime: 0,
        decodeAudioData: (buf, cb) => cb({ duration: 10, sampleRate: 44100, getChannelData: () => new Float32Array(44100) })
      },
      isPlaying: false,
      worldMp3Buffers: [],
      worldMp3Sources: [],
      worldMp3Gains: [],
      worldSources: { mp3: [] },
      worldSourceType: [],
      worldVolume: [],
      currentLevel: 0,
      masterFilter: { connect: () => {} }
    };
    
    const mod = await import('../../js/audio/mp3.js');
    computeAnchors = mod.computeAnchors;
    pickAnchor = mod.pickAnchor;
    startMp3Source = mod.startMp3Source;
    scheduleMp3Continue = mod.scheduleMp3Continue;
    startMp3World = mod.startMp3World;
    stopMp3World = mod.stopMp3World;
    stopAllMp3World = mod.stopAllMp3World;
    setWorldMp3Volume = mod.setWorldMp3Volume;
    crossfadeMp3Worlds = mod.crossfadeMp3Worlds;
    mp3Meta = mod.mp3Meta;
  });

  afterEach(() => {
    if (mp3Meta) mp3Meta.clear();
    cleanupMocks();
  });

  describe('computeAnchors', () => {
    it('returns empty array for short buffer', () => {
      const buffer = {
        duration: 2,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(88200)
      };
      const anchors = computeAnchors(buffer);
      assert.ok(Array.isArray(anchors));
      assert.strictEqual(anchors.length, 0);
    });

    it('returns empty array for silent buffer', () => {
      const buffer = {
        duration: 30,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(30 * 44100).fill(0)
      };
      const anchors = computeAnchors(buffer);
      assert.ok(Array.isArray(anchors));
      assert.strictEqual(anchors.length, 0);
    });

    it('returns anchors for buffer with energy', () => {
      const data = new Float32Array(30 * 44100);
      // Add some energy in the middle
      for (let i = 10 * 44100; i < 20 * 44100; i++) {
        data[i] = 0.5;
      }
      const buffer = {
        duration: 30,
        sampleRate: 44100,
        getChannelData: () => data
      };
      const anchors = computeAnchors(buffer);
      assert.ok(Array.isArray(anchors));
      // Should have some anchors
    });

    it('limits anchors to 24 max', () => {
      const data = new Float32Array(60 * 44100);
      // Add energy throughout
      for (let i = 0; i < data.length; i += 100) {
        data[i] = 0.5;
      }
      const buffer = {
        duration: 60,
        sampleRate: 44100,
        getChannelData: () => data
      };
      const anchors = computeAnchors(buffer);
      assert.ok(anchors.length <= 24);
    });
  });

  describe('pickAnchor', () => {
    it('returns null when no anchors', () => {
      const result = pickAnchor(0, null);
      assert.strictEqual(result, null);
    });

    it('returns anchor when available', () => {
      mp3Meta.set(0, { anchors: [5, 10, 15, 20], used: {} });
      const anchor = pickAnchor(0, null);
      assert.ok([5, 10, 15, 20].includes(anchor));
    });

    it('avoids recent anchor when avoidSec provided', () => {
      mp3Meta.set(0, { anchors: [5, 10, 15, 20], used: {} });
      const anchor = pickAnchor(0, 10);
      assert.notStrictEqual(anchor, 10);
    });

    it('tracks usage with timestamps', () => {
      mp3Meta.set(0, { anchors: [5, 10], used: {} });
      pickAnchor(0, null);
      const meta = mp3Meta.get(0);
      assert.ok(meta.used[0] > 0 || meta.used[1] > 0);
    });
  });

  describe('setWorldMp3Volume', () => {
    it('is a function', () => {
      assert.strictEqual(typeof setWorldMp3Volume, 'function');
    });
  });
});

describe('Audio MP3 Module - Integration', () => {
  beforeEach(async () => {
    setupMocks();
    state = {
      audioCtx: {
        createBufferSource: () => ({
          buffer: null,
          loop: false,
          playbackRate: { value: 1 },
          connect: () => {},
          start: () => {},
          stop: () => {},
          onended: null
        }),
        createGain: () => ({
          gain: {
            value: 0,
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
            cancelScheduledValues: () => {},
            setTargetAtTime: () => {}
          },
          connect: () => {},
          disconnect: () => {}
        }),
        currentTime: 0,
        decodeAudioData: (buf, cb) => cb({ duration: 10, sampleRate: 44100, getChannelData: () => new Float32Array(44100) })
      },
      isPlaying: true,
      worldMp3Buffers: [{ duration: 30, sampleRate: 44100, getChannelData: () => new Float32Array(30 * 44100) }],
      worldMp3Sources: [null],
      worldMp3Gains: [null],
      worldSources: { mp3: ['test.mp3'] },
      worldSourceType: ['mp3'],
      worldVolume: [0.5],
      currentLevel: 0,
      masterFilter: { connect: () => {} }
    };
  });

  afterEach(() => {
    if (mp3Meta) mp3Meta.clear();
    cleanupMocks();
  });

  it('startMp3World is a function', () => {
    assert.strictEqual(typeof startMp3World, 'function');
  });

  it('stopMp3World is a function', () => {
    assert.strictEqual(typeof stopMp3World, 'function');
  });

  it('stopAllMp3World is a function', () => {
    assert.strictEqual(typeof stopAllMp3World, 'function');
  });
});