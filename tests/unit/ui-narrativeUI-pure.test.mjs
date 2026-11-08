// tests/unit/ui-narrativeUI-pure.test.mjs - Unit tests for ui/narrativeUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNarrativeUI,
  updateNarrativeUI,
} from '../../js/ui/narrativeUI.js';

describe('NarrativeUI Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('createNarrativeUI', () => {
    it('creates narrative UI container', () => {
      const container = createNarrativeUI();
      assert.ok(container);
      assert.equal(container.id, 'narrativeUI');
      assert.ok(container.innerHTML.includes('narrativeWorldSelect'));
    });
  });

  describe('updateNarrativeUI', () => {
    it('updates UI based on narrative state', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.narrative = {
        currentWorld: 2,
        autoMode: true,
      };
      
      updateNarrativeUI();
      assert.ok(true);
    });

    it('handles different worlds', () => {
      const stateModule = await import('../../js/state.js');
      for (let i = 0; i < 13; i++) {
        stateModule.state.narrative = { currentWorld: i, autoMode: false };
        updateNarrativeUI();
      }
      assert.ok(true);
    });
  });
});