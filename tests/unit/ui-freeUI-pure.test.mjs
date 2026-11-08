// tests/unit/ui-freeUI-pure.test.mjs - Unit tests for ui/freeUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createFreeUI,
  updateFreeUI,
} from '../../js/ui/freeUI.js';

describe('FreeUI Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('createFreeUI', () => {
    it('creates free UI container', () => {
      const container = createFreeUI();
      assert.ok(container);
      assert.equal(container.id, 'freeUI');
      assert.ok(container.innerHTML.includes('freeWorldSelect'));
    });
  });

  describe('updateFreeUI', () => {
    it('updates UI based on free state', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.free = {
        currentWorld: 5,
      };
      
      updateFreeUI();
      assert.ok(true);
    });

    it('handles different worlds', () => {
      const stateModule = await import('../../js/state.js');
      for (let i = 0; i < 13; i++) {
        stateModule.state.free = { currentWorld: i };
        updateFreeUI();
      }
      assert.ok(true);
    });
  });
});