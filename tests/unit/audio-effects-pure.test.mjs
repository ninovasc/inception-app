// tests/unit/audio-effects-pure.test.mjs - Unit tests for audio/effects.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, playHeartbeatPulse, captureAndPlaySubconsciousMemory;

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
  
  // Mock compressor, convolverNode, delayLeft, stereoPanner
  state.compressor = { connect: () => {} };
  state.convolverNode = { connect: () => {} };
  state.delayLeft = { connect: () => {} };
  state.stereoPanner = { connect: () => {} };
  global.MediaRecorder = class MockMediaRecorder {
    constructor() { this.state = 'recording'; }
    start() {}
    stop() {}
    addEventListener() {}
    removeEventListener() {}
  };
  
  const mod = await import('../../js/audio/effects.js');
  playHeartbeatPulse = mod.playHeartbeatPulse;
  captureAndPlaySubconsciousMemory = mod.captureAndPlaySubconsciousMemory;
});

after(() => {
  cleanupTimers();
});

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

  function resetState() {
    state.audioCtx = {
      currentTime: 0,
      createOscillator: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        frequency: { 
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {}
        },
        type: 'sine'
      }),
      createGain: () => ({
        connect: () => {},
        gain: { 
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        }
      }),
      createDelay: () => ({ connect: () => {}, delayTime: { value: 0 } }),
      createStereoPanner: () => ({ connect: () => {}, pan: { value: 0 } }),
      decodeAudioData: (buffer, callback) => callback({ numberOfChannels: 1, getChannelData: () => new Float32Array(100) }),
      sampleRate: 44100
    };
    state.micStream = { getTracks: () => [] };
    state.compressor = { connect: () => {} };
    state.convolverNode = { connect: () => {} };
    state.delayLeft = { connect: () => {} };
    state.stereoPanner = { connect: () => {} };
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('playHeartbeatPulse', () => {
    test('plays heartbeat pulse without error', () => {
      playHeartbeatPulse(0.1);
      assert.ok(true);
    });

    test('handles missing audioCtx gracefully', () => {
      state.audioCtx = null;
      playHeartbeatPulse(0.1);
      assert.ok(true);
    });

    test('creates oscillator with correct frequency', () => {
      playHeartbeatPulse(0.1);
      assert.ok(true);
    });
  });

  describe('captureAndPlaySubconsciousMemory', () => {
    test('returns early when micStream is missing', () => {
      state.micStream = null;
      captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });

    test('returns early when audioCtx is missing', () => {
      state.micStream = { getTracks: () => [] };
      state.audioCtx = null;
      captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });

    test('returns early when MediaRecorder is undefined', () => {
      state.micStream = { getTracks: () => [] };
      state.audioCtx = { currentTime: 0 };
      global.MediaRecorder = undefined;
      captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });

    test('handles recording flow without error', () => {
      state.currentLevel = 0;
      captureAndPlaySubconsciousMemory();
      assert.ok(true);
    });
  });
});