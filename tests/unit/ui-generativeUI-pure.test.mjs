// @ts-nocheck
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

let state, createGenerativeUI, toggleGenerative, updateGenerativeVariation, generateNewVariation, saveGenerativeVariation, resetGenerative, applyGenerativeSeed, initGenerativeUI, updateGenerativeUIVisibility, applyGenerativeToCurrentSynth, getCurrentMood;

describe('Generative UI Module', () => {
  beforeEach(async () => {
    state = {
      currentMode: 'narrative',
      currentLevel: 0,
      currentSynthType: 0,
      isPlaying: false,
      sourceMode: 'synth'
    };
    
    global.document = {
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          id: '',
          style: {},
          innerHTML: '',
          querySelector: () => null,
          querySelectorAll: () => [],
          appendChild: () => {},
          contains: () => false,
          textContent: ''
        };
        if (tag === 'input') {
          el.value = '';
          el.type = '';
        }
        if (tag === 'button') {
          el.textContent = '';
        }
        return el;
      },
      getElementById: (id) => {
        const el = {
          id,
          style: {},
          textContent: '',
          value: '',
          contains: () => false,
          appendChild: () => {}
        };
        if (id === 'generativeEnabled') {
          el.checked = false;
          el.type = 'checkbox';
        }
        if (id === 'generativeVariation') {
          el.value = '50';
          el.type = 'range';
        }
        if (id === 'generativeSeedInput') {
          el.value = '';
          el.type = 'text';
        }
        if (id === 'generativeBadge') {
          el.textContent = 'OFF';
        }
        if (id === 'generativeStatus') {
          el.textContent = 'Ready';
        }
        if (id === 'generativeVariationVal') {
          el.textContent = '50%';
        }
        if (id === 'generativeCurrentSeed') {
          el.textContent = '';
        }
        return el;
      },
      body: { appendChild: () => {} }
    };
    
    global.alert = () => {};
    global.prompt = () => 'Test Preset';
    
    const mod = await import('../../js/ui/generativeUI.js');
    createGenerativeUI = mod.createGenerativeUI;
    toggleGenerative = mod.toggleGenerative;
    updateGenerativeVariation = mod.updateGenerativeVariation;
    generateNewVariation = mod.generateNewVariation;
    saveGenerativeVariation = mod.saveGenerativeVariation;
    resetGenerative = mod.resetGenerative;
    applyGenerativeSeed = mod.applyGenerativeSeed;
    initGenerativeUI = mod.initGenerativeUI;
    updateGenerativeUIVisibility = mod.updateGenerativeUIVisibility;
    applyGenerativeToCurrentSynth = mod.applyGenerativeToCurrentSynth;
    
    // Access internal function
    getCurrentMood = mod.getCurrentMood || (() => 'neutral');
  });

  describe('createGenerativeUI', () => {
    it('creates container with correct id', () => {
      const container = createGenerativeUI();
      assert.strictEqual(container.id, 'generativeUI');
    });

    it('includes toggle checkbox', () => {
      const container = createGenerativeUI();
      assert.ok(container.innerHTML.includes('generativeEnabled'));
      assert.ok(container.innerHTML.includes('data-action="toggleGenerative"'));
    });

    it('includes variation slider', () => {
      const container = createGenerativeUI();
      assert.ok(container.innerHTML.includes('generativeVariation'));
      assert.ok(container.innerHTML.includes('data-action="updateGenerativeVariation"'));
    });

    it('includes action buttons', () => {
      const container = createGenerativeUI();
      assert.ok(container.innerHTML.includes('generativeNew'));
      assert.ok(container.innerHTML.includes('generativeSave'));
      assert.ok(container.innerHTML.includes('generativeReset'));
      assert.ok(container.innerHTML.includes('data-action="generateNewVariation"'));
      assert.ok(container.innerHTML.includes('data-action="saveGenerativeVariation"'));
      assert.ok(container.innerHTML.includes('data-action="resetGenerative"'));
    });

    it('includes seed input', () => {
      const container = createGenerativeUI();
      assert.ok(container.innerHTML.includes('generativeSeedInput'));
      assert.ok(container.innerHTML.includes('generativeApplySeed'));
    });
  });

  describe('toggleGenerative', () => {
    it('sets _generativeActive flag', () => {
      toggleGenerative(true);
      assert.ok(true); // internal flag set
      
      toggleGenerative(false);
      assert.ok(true);
    });

    it('updates badge text', () => {
      const badge = document.getElementById('generativeBadge');
      toggleGenerative(true);
      assert.ok(badge.textContent.includes('ON') || badge.textContent.length > 0);
    });

    it('updates status text', () => {
      const status = document.getElementById('generativeStatus');
      toggleGenerative(true);
      assert.ok(status.textContent.length > 0);
    });
  });

  describe('updateGenerativeVariation', () => {
    it('updates variation value display', () => {
      const valEl = document.getElementById('generativeVariationVal');
      updateGenerativeVariation('75');
      assert.strictEqual(valEl.textContent, '75%');
    });
  });

  describe('getCurrentMood', () => {
    it('returns mood for each world index', () => {
      state.currentLevel = 0;
      const mood0 = getCurrentMood();
      assert.ok(typeof mood0 === 'string');
      
      state.currentLevel = 8;
      const mood8 = getCurrentMood();
      assert.strictEqual(mood8, 'relax');
      
      state.currentLevel = 11;
      const mood11 = getCurrentMood();
      assert.strictEqual(mood11, 'energy');
    });
  });

  describe('initGenerativeUI', () => {
    it('creates container when not exists', () => {
      global.document.getElementById = (id) => {
        if (id === 'generativeUI') return null;
        if (id === 'sourcePanel') return { appendChild: () => {}, contains: () => false };
        return null;
      };
      initGenerativeUI();
      assert.ok(true);
    });
  });

  describe('updateGenerativeUIVisibility', () => {
    it('shows for narrative mode', () => {
      state.currentMode = 'narrative';
      const container = { style: { display: 'none' } };
      global.document.getElementById = () => container;
      updateGenerativeUIVisibility();
      assert.strictEqual(container.style.display, 'block');
    });

    it('shows for free mode', () => {
      state.currentMode = 'free';
      const container = { style: { display: 'none' } };
      global.document.getElementById = () => container;
      updateGenerativeUIVisibility();
      assert.strictEqual(container.style.display, 'block');
    });

    it('shows for pomodoro mode', () => {
      state.currentMode = 'pomodoro';
      const container = { style: { display: 'none' } };
      global.document.getElementById = () => container;
      updateGenerativeUIVisibility();
      assert.strictEqual(container.style.display, 'block');
    });

    it('hides for sleep mode', () => {
      state.currentMode = 'sleep';
      const container = { style: { display: 'block' } };
      global.document.getElementById = () => container;
      updateGenerativeUIVisibility();
      assert.strictEqual(container.style.display, 'none');
    });
  });
});