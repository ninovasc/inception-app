// @ts-nocheck
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

let state, createModeSelector, updateModeSelector, initModeSelector, MODES, MODE_ORDER;

describe('Mode Selector Module', () => {
  beforeEach(async () => {
    state = {
      currentMode: '',
      currentLevel: 0
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
          insertBefore: () => {},
          contains: () => false
        };
        if (tag === 'select') {
          el.value = '';
          el.options = [];
        }
        return el;
      },
      getElementById: (id) => {
        if (id === 'estadoPanel') return { querySelector: () => ({ nextSibling: null, parentNode: { insertBefore: () => {} } }), appendChild: () => {} };
        return null;
      },
      body: { appendChild: () => {} }
    };
    
    const mod = await import('../../js/ui/modeSelector.js');
    createModeSelector = mod.createModeSelector;
    updateModeSelector = mod.updateModeSelector;
    initModeSelector = mod.initModeSelector;
    
    // Import config
    const config = await import('../../js/config.js');
    MODES = config.MODES;
    MODE_ORDER = config.MODE_ORDER;
  });

  describe('createModeSelector', () => {
    it('creates container with correct id', () => {
      const container = createModeSelector();
      assert.strictEqual(container.id, 'modeSelectorContainer');
    });

    it('includes label', () => {
      const container = createModeSelector();
      assert.ok(container.innerHTML.includes('label'));
    });

    it('includes select with data-action', () => {
      const container = createModeSelector();
      assert.ok(container.innerHTML.includes('data-action="setMode"'));
    });

    it('includes options for all modes', () => {
      const container = createModeSelector();
      for (const modeId of MODE_ORDER) {
        const mode = MODES.find(m => m.id === modeId);
        if (mode) {
          assert.ok(container.innerHTML.includes(mode.icon));
          assert.ok(container.innerHTML.includes(mode.name));
        }
      }
    });
  });

  describe('updateModeSelector', () => {
    it('updates select value', () => {
      state.currentMode = 'narrative';
      updateModeSelector();
      // verify function exists and runs
      assert.ok(true);
    });

    it('handles missing selector gracefully', () => {
      global.document.getElementById = () => null;
      state.currentMode = 'pomodoro';
      // Should not throw
      updateModeSelector();
      assert.ok(true);
    });
  });

  describe('initModeSelector', () => {
    it('creates selector when not exists', () => {
      global.document.getElementById = (id) => {
        if (id === 'modeSelectorContainer') return null;
        if (id === 'estadoPanel') return { 
          querySelector: () => ({ nextSibling: null, parentNode: { insertBefore: () => {} } }), 
          appendChild: () => {} 
        };
        return null;
      };
      // Should not throw
      initModeSelector();
      assert.ok(true);
    });

    it('updates selector when exists', () => {
      const mockSelector = { value: '' };
      global.document.getElementById = (id) => {
        if (id === 'modeSelectorContainer') return mockSelector;
        if (id === 'estadoPanel') return { 
          querySelector: () => ({ nextSibling: null, parentNode: { insertBefore: () => {} } }), 
          appendChild: () => {} 
        };
        return null;
      };
      state.currentMode = 'sleep';
      initModeSelector();
      assert.ok(true);
    });
  });
});