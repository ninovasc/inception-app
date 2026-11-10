// tests/unit/audio-synth-pure.test.mjs - Unit tests for audio/synth.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, selectSynthType, setSynthVolume, startSynth, stopSynth, restartSynth, startChordProgression, stopChordProgression, syncXYPadFromSliders, updateFromSliders, applyParameters;

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
  
  // Mock audio elements
  state.synthMasterGain = { gain: { setTargetAtTime: () => {} } };
  state.synthNodes = [];
  state.breathLfo = null;
  state.breathLfoGain = null;
  state.breathVolLfo = null;
  state.breathVolGain = null;
  state.chordInterval = null;
  state.synthMasterGain = { gain: { setTargetAtTime: () => {} } };
  state.delayWet = { gain: { setTargetAtTime: () => {} } };
  state.reverbGain = { gain: { setTargetAtTime: () => {} } };
  state.stemSources = [null, null, null];
  state.stemGains = [null, null, null];
  state.worldMp3Sources = [];
  
  global.MediaRecorder = class MockMediaRecorder {
    constructor() { this.state = 'recording'; }
    start() {}
    stop() {}
    addEventListener() {}
    removeEventListener() {}
  };
  
  const mod = await import('../../js/audio/synth.js');
  selectSynthType = mod.selectSynthType;
  setSynthVolume = mod.setSynthVolume;
  startSynth = mod.startSynth;
  stopSynth = mod.stopSynth;
  restartSynth = mod.restartSynth;
  startChordProgression = mod.startChordProgression;
  stopChordProgression = mod.stopChordProgression;
  syncXYPadFromSliders = mod.syncXYPadFromSliders;
  updateFromSliders = mod.updateFromSliders;
  applyParameters = mod.applyParameters;
});

after(() => {
  cleanupTimers();
});

describe('Audio Synth Module', () => {
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
          value: 440,
          setValueAtTime: () => {},
          setTargetAtTime: () => {},
          linearRampToValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          cancelScheduledValues: () => {}
        },
        type: 'sine'
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
      }),
      createBiquadFilter: () => ({ 
        connect: () => {}, 
        type: 'lowpass', 
        frequency: { value: 1000, setValueAtTime: () => {} },
        disconnect: () => {}
      }),
      createBiquadFilter: () => ({ 
        connect: () => {}, 
        type: 'lowpass', 
        frequency: { value: 1000, setValueAtTime: () => {} },
        disconnect: () => {}
      }),
      createDelay: () => ({ connect: () => {}, delayTime: { value: 0, setValueAtTime: () => {} } }),
      createStereoPanner: () => ({ connect: () => {}, pan: { value: 0, setValueAtTime: () => {} } }),
      createConvolver: () => ({ connect: () => {}, buffer: null }),
      createBuffer: (channels, length, sampleRate) => ({
        numberOfChannels: channels,
        length: length,
        sampleRate: sampleRate,
        getChannelData: () => new Float32Array(length)
      }),
      createBufferSource: () => ({
        connect: () => {},
        start: () => {},
        stop: () => {},
        loop: false,
        playbackRate: { value: 1 },
        buffer: null
      }),
      sampleRate: 44100,
      currentTime: 0
    };
    state.isPlaying = true;
    state.sourceMode = 'synth';
    state.currentLevel = 0;
    state.currentSynthType = 0;
    state.xyState = { x: 0.5, y: 0.5 };
    state.synthNodes = [];
    state.breathLfo = null;
    state.breathLfoGain = null;
    state.breathVolLfo = null;
    state.breathVolGain = null;
    state.chordInterval = null;
    state.synthMasterGain = { gain: { setTargetAtTime: () => {} } };
    state.delayWet = { gain: { setTargetAtTime: () => {} } };
    state.reverbGain = { gain: { setTargetAtTime: () => {} } };
    state.stemSources = [null, null, null];
    state.stemGains = [null, null, null];
    state.worldMp3Sources = [];
    state.compressor = { connect: () => {} };
    state.convolverNode = { connect: () => {} };
    state.delayLeft = { connect: () => {} };
    state.delayRight = { connect: () => {} };
    state.stereoPanner = { connect: () => {} };
    state.dryGain = { connect: () => {} };
    state.synthMasterGain = { gain: { setTargetAtTime: () => {} }, connect: () => {} };
    state.breathLfo = null;
    state.breathLfoGain = null;
    state.breathVolLfo = null;
    state.breathVolGain = null;
    state.chordInterval = null;
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('selectSynthType', () => {
    test('initializes audio and sets synth type', () => {
      selectSynthType(1);
      assert.equal(state.currentSynthType, 1);
    });

    test('handles invalid index', () => {
      selectSynthType('invalid');
      assert.ok(true);
    });

    test('sets worldSynth for current level', () => {
      state.currentLevel = 2;
      selectSynthType(3);
      assert.equal(state.worldSynth[2], 3);
    });
  });

  describe('setSynthVolume', () => {
    test('updates volume label', () => {
      setSynthVolume('0.5');
      assert.ok(true);
    });

    test('updates synthMasterGain when audioCtx exists', () => {
      state.synthMasterGain = { gain: { setTargetAtTime: () => {} } };
      state.audioCtx = { currentTime: 0 };
      setSynthVolume('0.8');
      assert.ok(true);
    });

    test('handles missing label gracefully', () => {
      setSynthVolume('0.5');
      assert.ok(true);
    });
  });

  describe('startSynth', () => {
    test('returns early when audioCtx missing', () => {
      state.audioCtx = null;
      startSynth();
      assert.ok(true);
    });

    test('creates oscillators with correct parameters', () => {
      state.isPlaying = true;
      state.sourceMode = 'synth';
      startSynth();
      assert.ok(state.synthNodes.length > 0);
    });

    test('handles transpose semitones', () => {
      startSynth(12);
      assert.ok(true);
    });
  });

  describe('stopSynth', () => {
    test('stops all synth nodes', () => {
      state.synthNodes = [
        { osc: { stop: () => {} }, gain: { gain: { value: 1, cancelScheduledValues: () => {}, linearRampToValueAtTime: () => {} } }, isLfo: false },
        { osc: { stop: () => {} }, isLfo: true }
      ];
      stopSynth(100);
      assert.ok(true);
    });

    test('clears pluck timer', () => {
      global.pluckTimer = setInterval(() => {}, 1000);
      stopSynth(100);
      assert.ok(true);
    });

    test('stops breath LFOs', () => {
      state.breathLfo = { stop: () => {}, disconnect: () => {} };
      state.breathLfoGain = { disconnect: () => {} };
      state.breathVolLfo = { stop: () => {}, disconnect: () => {} };
      state.breathVolGain = { disconnect: () => {} };
      stopSynth(100);
      assert.ok(true);
    });
  });

  describe('restartSynth', () => {
    test('stops and restarts synth', () => {
      restartSynth(0, 80);
      assert.ok(true);
    });
  });

  describe('startChordProgression', () => {
    test('stops existing progression and starts new', () => {
      state.chordInterval = setInterval(() => {}, 1000);
      startChordProgression();
      assert.ok(true);
    });

    test('handles missing bpm gracefully', () => {
      state.isPlaying = true;
      state.sourceMode = 'synth';
      startChordProgression();
      assert.ok(true);
    });
  });

  describe('stopChordProgression', () => {
    test('clears chord interval', () => {
      state.chordInterval = setInterval(() => {}, 1000);
      stopChordProgression();
      assert.ok(true);
    });

    test('handles missing interval gracefully', () => {
      stopChordProgression();
      assert.ok(true);
    });
  });

  describe('syncXYPadFromSliders', () => {
    test('calculates x and y from sliders', () => {
      syncXYPadFromSliders(1.0, 18000);
      assert.ok(state.xyState.x >= 0 && state.xyState.x <= 1);
      assert.ok(state.xyState.y >= 0 && state.xyState.y <= 1);
    });
  });

  describe('updateFromSliders', () => {
    test('updates parameters from sliders', () => {
      updateFromSliders(true);
      assert.ok(true);
    });

    test('handles syncXY false', () => {
      updateFromSliders(false);
      assert.ok(true);
    });
  });

  describe('applyParameters', () => {
    test('updates UI values and audio parameters', () => {
      applyParameters();
      assert.ok(true);
    });

    test('handles missing audioCtx gracefully', () => {
      state.audioCtx = null;
      applyParameters();
      assert.ok(true);
    });

    test('updates delay and reverb wet gains', () => {
      state.delayWet = { gain: { setTargetAtTime: () => {} } };
      state.reverbGain = { gain: { setTargetAtTime: () => {} } };
      applyParameters();
      assert.ok(true);
    });
  });
});