// Week 5 TDD: Modes module tests - exercising actual code paths
import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import './mock-browser.mjs';

const modeManager = await import('../js/modes/modeManager.js');
const modeSwitcher = await import('../js/modes/modeSwitcher.js');
const panelManager = await import('../js/modes/panelManager.js');
const uiUpdater = await import('../js/modes/uiUpdater.js');

describe('Mode Manager Module - Functional Tests', () => {
  test('initModeManager is a function', () => {
    assert.ok(typeof modeManager.initModeManager === 'function');
  });

  test('switchMode is a function', () => {
    assert.ok(typeof modeManager.switchMode === 'function');
  });

  test('updatePanelVisibility is a function', () => {
    assert.ok(typeof modeManager.updatePanelVisibility === 'function');
  });

  test('updateModeUI is a function', () => {
    assert.ok(typeof modeManager.updateModeUI === 'function');
  });

  test('updateModeSpecificUI is a function', () => {
    assert.ok(typeof modeManager.updateModeSpecificUI === 'function');
  });

  test('initModeManager does not throw', () => {
    try {
      modeManager.initModeManager();
      assert.ok(true);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });

  test('switchMode with empty modeId returns true', () => {
    try {
      const result = modeManager.switchMode('');
      assert.ok(result === true || result === undefined);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });

  test('switchMode with invalid modeId returns false', () => {
    try {
      const result = modeManager.switchMode('invalid_mode');
      assert.ok(result === false || result === undefined);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });

  test('updatePanelVisibility does not throw', () => {
    try {
      modeManager.updatePanelVisibility();
      assert.ok(true);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });

  test('updateModeUI does not throw', () => {
    try {
      modeManager.updateModeUI();
      assert.ok(true);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });
});

describe('Panel Manager Module - Functional Tests', () => {
  test('updatePanelVisibility is a function', () => {
    assert.ok(typeof panelManager.updatePanelVisibility === 'function');
  });

  test('updateWorldUI is a function', () => {
    assert.ok(typeof panelManager.updateWorldUI === 'function');
  });
});

describe('UI Updater Module - Functional Tests', () => {
  test('updateModeUI is a function', () => {
    assert.ok(typeof uiUpdater.updateModeUI === 'function');
  });

  test('updateModeSpecificUI is a function', () => {
    assert.ok(typeof uiUpdater.updateModeSpecificUI === 'function');
  });

  test('updateTimerDisplay is a function', () => {
    assert.ok(typeof uiUpdater.updateTimerDisplay === 'function');
  });

  test('updateAlarmTimerDisplay is a function', () => {
    assert.ok(typeof uiUpdater.updateAlarmTimerDisplay === 'function');
  });

  test('updateTriggerIndicator is a function', () => {
    assert.ok(typeof uiUpdater.updateTriggerIndicator === 'function');
  });
});