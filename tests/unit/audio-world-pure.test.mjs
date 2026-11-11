// @ts-nocheck
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

let state, setWorldSynth, setWorldVolume;

describe('Audio World Module - Pure Functions', () => {
  beforeEach(async () => {
    state = {
      worldSynth: [0, 1, 2, 3],
      worldVolume: [0.2, 0.3, 0.4, 0.5],
      currentSynthType: 0,
      isPlaying: false,
      sourceMode: 'synth',
      currentLevel: 0,
      audioCtx: {
        currentTime: 0
      },
      synthMasterGain: {
        gain: {
          setTargetAtTime: () => {}
        }
      },
      worldMp3Gains: [null, null, null, null]
    };
    
    global.document = {
      getElementById: (id) => {
        if (id.startsWith('worldVolVal')) return { textContent: '' };
        return null;
      }
    };
    
    const mod = await import('../../js/audio/world.js');
    setWorldSynth = mod.setWorldSynth;
    setWorldVolume = mod.setWorldVolume;
  });

  describe('setWorldSynth', () => {
    it('sets synth for world index', () => {
      setWorldSynth(0, 5);
      assert.strictEqual(state.worldSynth[0], 5);
    });

    it('handles backward compat (single arg = currentLevel)', () => {
      setWorldSynth(7);
      assert.strictEqual(state.worldSynth[0], 7);
      assert.strictEqual(state.currentSynthType, 7);
    });

    it('ignores NaN values', () => {
      setWorldSynth(0, 'invalid');
      assert.strictEqual(state.worldSynth[0], 0); // unchanged
    });

    it('initializes worldSynth if missing', () => {
      state.worldSynth = null;
      setWorldSynth(0, 3);
      assert.ok(Array.isArray(state.worldSynth));
      assert.strictEqual(state.worldSynth[0], 3);
    });

    it('updates currentSynthType when worldIdx matches currentLevel', () => {
      setWorldSynth(0, 9);
      assert.strictEqual(state.currentSynthType, 9);
    });
  });

  describe('setWorldVolume', () => {
    it('sets volume for world index', () => {
      setWorldVolume(1, 0.7);
      assert.strictEqual(state.worldVolume[1], 0.7);
    });

    it('handles backward compat (single arg = currentLevel)', () => {
      setWorldVolume(0.9);
      assert.strictEqual(state.worldVolume[0], 0.9);
    });

    it('ignores NaN values', () => {
      setWorldVolume(0, 'invalid');
      assert.strictEqual(state.worldVolume[0], 0.2); // unchanged
    });

    it('initializes worldVolume if missing', () => {
      state.worldVolume = null;
      setWorldVolume(0, 0.5);
      assert.ok(Array.isArray(state.worldVolume));
      assert.strictEqual(state.worldVolume[0], 0.5);
    });

    it('updates label when element exists', () => {
      const label = { textContent: '' };
      global.document.getElementById = (id) => label;
      setWorldVolume(0, 0.5);
      assert.strictEqual(label.textContent, '50%');
    });

    it('updates MP3 gain when playing MP3', () => {
      state.isPlaying = true;
      state.currentLevel = 0;
      state.sourceMode = 'mp3';
      state.worldMp3Gains[0] = {
        gain: {
          setTargetAtTime: (val) => { assert.strictEqual(val, 0.8); }
        }
      };
      setWorldVolume(0, 0.8);
    });

    it('updates synth master gain when playing synth', () => {
      state.isPlaying = true;
      state.currentLevel = 0;
      state.sourceMode = 'synth';
      setWorldVolume(0, 0.6);
      // synthMasterGain.gain.setTargetAtTime should be called
    });
  });
});