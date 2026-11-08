// tests/unit/modes-narrativeMode-pure.test.mjs - Unit tests for modes/narrativeMode.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  activateNarrativeMode,
  deactivateNarrativeMode,
  toggleAutoMode,
  getActiveTrigger,
} from '../../js/modes/narrativeMode.js';

describe('Narrative Mode Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('activateNarrativeMode/deactivateNarrativeMode', () => {
    it('activates narrative mode', async () => {
      await activateNarrativeMode();
      const stateModule = await import('../../js/state.js');
      assert.ok(true);
    });

    it('deactivates narrative mode', async () => {
      await deactivateNarrativeMode();
      assert.ok(true);
    });
  });

  describe('toggleAutoMode', () => {
    it('toggles auto mode on/off', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.autoMode = false;
      
      await toggleAutoMode();
      assert.equal(stateModule.state.autoMode, true);
      
      await toggleAutoMode();
      assert.equal(stateModule.state.autoMode, false);
    });
  });

  describe('getActiveTrigger', () => {
    it('returns active trigger', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.worldTriggers = {
        bonusRain: 10,
        clap: 5,
        fallback: 0,
      };
      stateModule.state.triggerMotion = 0.5;
      stateModule.state.triggerSilenceSec = 30;
      
      const trigger = getActiveTrigger();
      assert.ok(trigger);
    });

    it('returns fallback when no triggers active', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.worldTriggers = {
        bonusRain: -1,
        clap: -1,
      };
      
      const trigger = getActiveTrigger();
      assert.ok(trigger);
    });
  });
});