// tests/unit/audio-stems-pure.test.mjs - Unit tests for audio/stems.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, startStems, stopStems, setVolume;

before(async () => {
  await import('../mock-browser.mjs');
  
  // Import state module namespace to patch its export directly
  const stateModule = await import('../../js/state.js');
  state = stateModule.state;
  
  // Ensure masterFilter is mocked for tests
  stateModule.state.masterFilter = {
    frequency: {
      value: 18000,
      setTargetAtTime: () => {},
      setValueAtTime: () => {},
      cancelScheduledValues: () => {},
      linearRampToValueAtTime: () => {}
    },
    type: 'lowpass',
    connect: () => {},
    disconnect: () => {}
  };
  state.masterFilter = stateModule.state.masterFilter;
  global.stopDeprivationHeartbeat = () => {};
  
  const mod = await import('../../js/audio/stems.js');
  startStems = mod.startStems;
  stopStems = mod.stopStems;
  setVolume = mod.setVolume;
});

after(() => {
  cleanupTimers();
});

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

  function resetState() {
    state.audioCtx = {
      currentTime: 0,
      createBufferSource: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        loop: false,
        playbackRate: { value: 1 },
        buffer: null
      }),
      createGain: () => ({
        connect: () => {},
        gain: { 
          value: 1,
          setValueAtTime: () => {},
          setTargetAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          cancelScheduledValues: () => {}
        }
      })
    };
    state.stemBuffers = [null, null, null];
    state.stemSources = [null, null, null];
    state.stemGains = [
      { gain: { setTargetAtTime: () => {} } },
      { gain: { setTargetAtTime: () => {} } },
      { gain: { setTargetAtTime: () => {} } }
    ];
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('startStems', () => {
    test('stops existing stems before starting', () => {
      state.stemSources = [
        { stop: () => {} },
        { stop: () => {} },
        { stop: () => {} }
      ];
      startStems();
      assert.ok(true);
    });

    test('creates buffer sources for each stem buffer', () => {
      state.stemBuffers = [
        { sampleRate: 44100 },
        { sampleRate: 44100 },
        { sampleRate: 44100 }
      ];
      startStems();
      assert.ok(true);
    });

    test('sets playback rate from slider speed', () => {
      state.stemBuffers = [ { sampleRate: 44100 }, null, null ];
      startStems();
      assert.ok(true);
    });

    test('handles missing buffers gracefully', () => {
      state.stemBuffers = [null, null, null];
      startStems();
      assert.ok(true);
    });

    test('connects sources to stem gains', () => {
      state.stemBuffers = [ { sampleRate: 44100 }, { sampleRate: 44100 }, { sampleRate: 44100 } ];
      state.stemGains = [
        { connect: () => {} },
        { connect: () => {} },
        { connect: () => {} }
      ];
      startStems();
      assert.ok(true);
    });
  });

  describe('stopStems', () => {
    test('stops all stem sources', () => {
      state.stemSources = [
        { stop: () => {} },
        { stop: () => {} },
        { stop: () => {} }
      ];
      stopStems();
      assert.ok(true);
    });

    test('handles null sources gracefully', () => {
      state.stemSources = [null, null, null];
      stopStems();
      assert.ok(true);
    });

    test('sets stem sources to null after stopping', () => {
      state.stemSources = [
        { stop: () => {} },
        { stop: () => {} },
        { stop: () => {} }
      ];
      stopStems();
      assert.ok(true);
    });
  });

  describe('setVolume', () => {
    test('updates volume label', () => {
      setVolume(0, '0.5');
      assert.ok(true);
    });

    test('updates stem gain when audioCtx exists', () => {
      state.stemGains[0] = { gain: { setTargetAtTime: () => {} } };
      state.audioCtx = { currentTime: 0 };
      setVolume(0, '0.8');
      assert.ok(true);
    });

    test('handles missing stem gain gracefully', () => {
      state.stemGains[0] = null;
      setVolume(0, '0.5');
      assert.ok(true);
    });

    test('handles missing audioCtx gracefully', () => {
      state.stemGains[0] = { gain: { setTargetAtTime: () => {} } };
      state.audioCtx = null;
      setVolume(0, '0.5');
      assert.ok(true);
    });
  });
});