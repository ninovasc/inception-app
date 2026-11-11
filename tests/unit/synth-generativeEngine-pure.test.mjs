// @ts-nocheck
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

let GenerativeEngine, getGenerativeEngine, generateSynthVariation, applyGenerativeVariation, initGenerativeEngine;

describe('Generative Engine Module', () => {
  beforeEach(async () => {
    const mod = await import('../../js/synth/generativeEngine.js');
    GenerativeEngine = mod.GenerativeEngine;
    getGenerativeEngine = mod.getGenerativeEngine;
    generateSynthVariation = mod.generateSynthVariation;
    applyGenerativeVariation = mod.applyGenerativeVariation;
    initGenerativeEngine = mod.initGenerativeEngine;
  });

  describe('GenerativeEngine class', () => {
    let engine;

    beforeEach(() => {
      engine = new GenerativeEngine();
    });

    it('initializes with correct defaults', () => {
      assert.strictEqual(engine.isLoaded, false);
      assert.strictEqual(engine.isLoading, false);
      assert.strictEqual(engine.model, null);
      assert.strictEqual(engine.session, null);
      assert.ok(engine.inputTensor instanceof Float32Array);
      assert.ok(engine.outputTensor instanceof Float32Array);
    });

    describe('_prepareInput', () => {
      it('normalizes frequencies to 0-1', () => {
        const input = {
          baseFreqs: [100, 200, 300, 400],
          baseTypes: ['sine', 'sine', 'sine', 'sine'],
          baseGains: [0.5, 0.5, 0.5, 0.5],
          baseLfo: 0.1,
          pluck: { gain: 0.5, bpm: 120 },
          pulse: { gain: 0.3, bpm: 60, offbeat: false },
          noise: { gain: 0.2, freq: 1000 },
          drift: 0.01,
          binaural: 10,
          bpm: 120,
          worldName: 'TestWorld',
          worldBgColor: '#808080',
          targetMood: 'focus',
          variationIntensity: 0.5,
          seed: 12345
        };
        
        engine._prepareInput(input, engine.inputTensor);
        
        // Check frequencies normalized (100/2000 = 0.05, etc.)
        assert.ok(engine.inputTensor[0] >= 0 && engine.inputTensor[0] <= 1);
        assert.ok(engine.inputTensor[1] >= 0 && engine.inputTensor[1] <= 1);
      });

      it('maps wave types correctly', () => {
        const input = {
          baseFreqs: [440, 440, 440, 440],
          baseTypes: ['sine', 'triangle', 'sawtooth', 'square'],
          baseGains: [0.5, 0.5, 0.5, 0.5],
          baseLfo: 0,
          pluck: null,
          pulse: null,
          noise: null,
          drift: 0,
          binaural: 0,
          bpm: 60,
          worldName: '',
          worldBgColor: '#000000',
          targetMood: 'neutral',
          variationIntensity: 0.5,
          seed: 0
        };
        
        engine._prepareInput(input, engine.inputTensor);
        
        // Check type mapping at indices 4-7
        assert.strictEqual(engine.inputTensor[4], 0);      // sine
        assert.strictEqual(engine.inputTensor[5], 0.25);  // triangle
        assert.strictEqual(engine.inputTensor[6], 0.5);   // sawtooth
        assert.strictEqual(engine.inputTensor[7], 0.75);  // square
      });

      it('encodes mood as one-hot', () => {
        const moods = ['focus', 'relax', 'sleep', 'energy', 'melancholy', 'neutral'];
        
        for (let i = 0; i < moods.length; i++) {
          const input = {
            baseFreqs: [440, 440, 440, 440],
            baseTypes: ['sine', 'sine', 'sine', 'sine'],
            baseGains: [0.5, 0.5, 0.5, 0.5],
            baseLfo: 0,
            pluck: null,
            pulse: null,
            noise: null,
            drift: 0,
            binaural: 0,
            bpm: 60,
            worldName: '',
            worldBgColor: '#000000',
            targetMood: moods[i],
            variationIntensity: 0.5,
            seed: 0
          };
          
          engine._prepareInput(input, engine.inputTensor);
          
          // Mood starts at index 26, 6 values
          let moodIdx = -1;
          for (let j = 0; j < 6; j++) {
            if (engine.inputTensor[26 + j] === 1) moodIdx = j;
          }
          assert.strictEqual(moodIdx, i);
        }
      });

      it('calculates color brightness', () => {
        assert.strictEqual(engine._colorBrightness('#000000'), 0);
        assert.strictEqual(engine._colorBrightness('#FFFFFF'), 1);
        assert.ok(engine._colorBrightness('#808080') > 0 && engine._colorBrightness('#808080') < 1);
      });
    });

    describe('_inferFallback', () => {
      it('returns deterministic output for same seed', () => {
        const inputTensor = new Float32Array(64).fill(0.5);
        
        const out1 = engine._inferFallback(inputTensor, 12345);
        const out2 = engine._inferFallback(inputTensor, 12345);
        
        for (let i = 0; i < out1.length; i++) {
          assert.strictEqual(out1[i], out2[i]);
        }
      });

      it('returns different output for different seeds', () => {
        const inputTensor = new Float32Array(64).fill(0.5);
        
        const out1 = engine._inferFallback(inputTensor, 12345);
        const out2 = engine._inferFallback(inputTensor, 54321);
        
        let different = false;
        for (let i = 0; i < out1.length; i++) {
          if (out1[i] !== out2[i]) different = true;
        }
        assert.ok(different);
      });
    });

    describe('_parseOutput', () => {
      it('returns structured variation object', () => {
        const output = new Float32Array(64).fill(0.1);
        const variation = engine._parseOutput(output, 0.5);
        
        assert.ok(variation.freqDeltas);
        assert.ok(variation.gainDeltas);
        assert.ok(variation.pluck);
        assert.ok(variation.pulse);
        assert.ok(variation.noise);
        assert.ok(typeof variation.driftDelta === 'number');
        assert.ok(typeof variation.binauralDelta === 'number');
        assert.ok(typeof variation.bpmDelta === 'number');
        assert.ok(typeof variation.confidence === 'number');
        assert.ok(typeof variation.variationHash === 'string');
      });

      it('scales deltas by intensity', () => {
        const output = new Float32Array(64).fill(1);
        
        const v1 = engine._parseOutput(output, 0.5);
        const v2 = engine._parseOutput(output, 1.0);
        
        // At intensity 1.0, deltas should be larger
        assert.ok(Math.abs(v2.freqDeltas[0]) >= Math.abs(v1.freqDeltas[0]));
      });
    });

    describe('_emptyOutput', () => {
      it('returns zero deltas', () => {
        const empty = engine._emptyOutput();
        
        assert.deepStrictEqual(empty.freqDeltas, [0,0,0,0]);
        assert.deepStrictEqual(empty.gainDeltas, [0,0,0,0]);
        assert.strictEqual(empty.confidence, 0);
        assert.strictEqual(empty.variationHash, '00000000');
      });
    });

    describe('generateVariation', () => {
      it('loads model if not loaded', async () => {
        const input = {
          baseFreqs: [440, 440, 440, 440],
          baseTypes: ['sine', 'sine', 'sine', 'sine'],
          baseGains: [0.5, 0.5, 0.5, 0.5],
          baseLfo: 0,
          pluck: null,
          pulse: null,
          noise: null,
          drift: 0,
          binaural: 0,
          bpm: 60,
          worldName: 'Test',
          worldBgColor: '#000000',
          targetMood: 'neutral',
          variationIntensity: 0.5,
          seed: 12345
        };
        
        const variation = await engine.generateVariation(input, 0.5, 12345);
        
        assert.ok(variation.freqDeltas);
        assert.ok(engine.isLoaded);
      });
    });
  });

  describe('Singleton functions', () => {
    it('getGenerativeEngine returns singleton', () => {
      const e1 = getGenerativeEngine();
      const e2 = getGenerativeEngine();
      assert.strictEqual(e1, e2);
    });

    it('applyGenerativeVariation applies deltas to base synth', () => {
      const baseSynth = {
        freqs: [440, 550, 660, 880],
        gains: [0.5, 0.5, 0.5, 0.5],
        types: ['sine', 'sine', 'sine', 'sine'],
        lfo: 0.1,
        pluck: { gain: 0.5, bpm: 120 },
        pulse: { gain: 0.3, bpm: 60, offbeat: false },
        noise: { gain: 0.2, freq: 1000 },
        drift: 0.01,
        binaural: 10,
        bpm: 120
      };
      
      const variation = {
        freqDeltas: [1, -1, 2, -2], // semitones
        gainDeltas: [6, -6, 3, -3], // dB
        typeChanges: null,
        lfoDelta: 0.1,
        pluck: { gainDelta: 0.1, bpmDelta: 10 },
        pulse: { gainDelta: 0.05, bpmDelta: 5, offbeatFlip: true },
        noise: { gainDelta: 0.05, freqDelta: 100 },
        driftDelta: 0.005,
        binauralDelta: 2,
        bpmDelta: 10,
        confidence: 0.8,
        variationHash: 'abc123'
      };
      
      const result = applyGenerativeVariation(baseSynth, variation, 1.0);
      
      // Check freq changed (1 semitone up = * 2^(1/12))
      assert.ok(result.freqs[0] > baseSynth.freqs[0]);
      assert.ok(result.freqs[1] < baseSynth.freqs[1]);
      
      // Check gain changed (6dB = * 2)
      assert.ok(result.gains[0] > baseSynth.gains[0]);
      assert.ok(result.gains[1] < baseSynth.gains[1]);
    });
  });
});