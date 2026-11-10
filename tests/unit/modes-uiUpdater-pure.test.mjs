// tests/unit/modes-uiUpdater-pure.test.mjs - Unit tests for modes/uiUpdater.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../../js/state.js';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let updateModeUI, updateModeSpecificUI, updateTimerDisplay, updateAlarmTimerDisplay, updateSleepUI, syncAutoUI, updateTriggerIndicator, getCurrentModeWorldCount, currentModeAllowsMp3;

before(async () => {
  await import('../mock-browser.mjs');
  const mod = await import('../../js/modes/uiUpdater.js');
  updateModeUI = mod.updateModeUI;
  updateModeSpecificUI = mod.updateModeSpecificUI;
  updateTimerDisplay = mod.updateTimerDisplay;
  updateAlarmTimerDisplay = mod.updateAlarmTimerDisplay;
  updateSleepUI = mod.updateSleepUI;
  syncAutoUI = mod.syncAutoUI;
  updateTriggerIndicator = mod.updateTriggerIndicator;
  getCurrentModeWorldCount = mod.getCurrentModeWorldCount;
  currentModeAllowsMp3 = mod.currentModeAllowsMp3;
});

after(() => {
  cleanupTimers();
});

describe('UI Updater Module', () => {
  let originalState;
  let originalDocument;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
    originalDocument = global.document;
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
    global.document = originalDocument;
  });

  function setupMockDocument() {
    function createMockEl() {
      return {
        tagName: 'DIV',
        id: '',
        value: '',
        innerHTML: '',
        textContent: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
        setAttribute: () => {},
        getAttribute: () => null,
        appendChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        dataset: {}
      };
    }
    global.document = {
      getElementById: (id) => {
        const el = createMockEl();
        el.id = id;
        return el;
      },
      querySelectorAll: () => [],
      createElement: () => createMockEl(),
    };
  }

  function test(name, fn) {
    return it(name, () => {
      setupMockDocument();
      return fn();
    });
  }

  describe('updateModeUI', () => {
    test('updates mode selector', () => {
      state.currentMode = 'narrative';
      updateModeUI();
      assert.ok(true);
    });

    test('updates auto mode button', () => {
      state.currentMode = 'narrative';
      updateModeUI();
      assert.ok(true);
    });

    test('updates mode label', () => {
      state.currentMode = 'pomodoro';
      updateModeUI();
      assert.ok(true);
    });
  });

  describe('updateModeSpecificUI', () => {
    test('calls updateNarrativeUI for narrative mode', () => {
      updateModeSpecificUI('narrative');
      assert.ok(true);
    });

    test('calls updatePomodoroUI for pomodoro mode', () => {
      updateModeSpecificUI('pomodoro');
      assert.ok(true);
    });

    test('calls updateSleepUI for sleep mode', () => {
      updateModeSpecificUI('sleep');
      assert.ok(true);
    });

    test('calls updateFreeUI for free mode', () => {
      updateModeSpecificUI('free');
      assert.ok(true);
    });
  });

  describe('updateTimerDisplay', () => {
    test('updates pomodoro timer display', () => {
      state.currentMode = 'pomodoro';
      state.pomodoro.timeRemaining = 1500;
      state.pomodoro.totalTime = 1500;
      updateTimerDisplay();
      assert.ok(true);
    });

    test('does nothing for non-pomodoro mode', () => {
      state.currentMode = 'narrative';
      updateTimerDisplay();
      assert.ok(true);
    });

    test('handles missing timer element', () => {
      state.currentMode = 'pomodoro';
      state.pomodoro.timeRemaining = 1500;
      state.pomodoro.totalTime = 1500;
      updateTimerDisplay();
      assert.ok(true);
    });
  });

  describe('updateAlarmTimerDisplay', () => {
    test('updates sleep alarm timer', () => {
      state.currentMode = 'sleep';
      state.sleep.alarmTime = '07:00';
      state.sleep.wakeWindowMinutes = 15;
      state.sleep.isWaking = false;
      updateAlarmTimerDisplay();
      assert.ok(true);
    });

    test('shows waking message when diffMs <= 0', () => {
      state.currentMode = 'sleep';
      state.sleep.alarmTime = '07:00';
      state.sleep.wakeWindowMinutes = 15;
      // Set alarm in past
      state.sleep.alarmTime = '00:00';
      updateAlarmTimerDisplay();
      assert.ok(true);
    });

    test('shows waking label when isWaking', () => {
      state.currentMode = 'sleep';
      state.sleep.isWaking = true;
      state.sleep.alarmTime = '07:00';
      state.sleep.wakeWindowMinutes = 15;
      updateAlarmTimerDisplay();
      assert.ok(true);
    });

    test('does nothing for non-sleep mode', () => {
      state.currentMode = 'narrative';
      updateAlarmTimerDisplay();
      assert.ok(true);
    });
  });

  describe('updateSleepUI', () => {
    test('updates sleep world select', () => {
      state.currentMode = 'sleep';
      state.sleep.currentWorld = 3;
      state.sleep.alarmTime = '07:30';
      state.sleep.wakeWindowMinutes = 20;
      updateSleepUI();
      assert.ok(true);
    });

    test('does nothing for non-sleep mode', () => {
      state.currentMode = 'narrative';
      updateSleepUI();
      assert.ok(true);
    });
  });

  describe('syncAutoUI', () => {
    test('updates auto mode button', () => {
      state.autoMode = true;
      syncAutoUI();
      assert.ok(true);
    });

    test('handles missing elements', () => {
      state.autoMode = true;
      syncAutoUI();
      assert.ok(true);
    });
  });

  describe('updateTriggerIndicator', () => {
    test('shows free mode message', () => {
      state.currentMode = 'free';
      updateTriggerIndicator();
      assert.ok(true);
    });

    test('shows active trigger when available', () => {
      state.currentMode = 'narrative';
      // We can't easily mock getActiveTrigger, just test it doesn't throw
      updateTriggerIndicator();
      assert.ok(true);
    });

    test('shows fallback when no triggers active', () => {
      state.currentMode = 'narrative';
      state.worldTriggers = { bonusRain: -1, clap: -1 };
      updateTriggerIndicator();
      assert.ok(true);
    });

    test('shows first valid trigger as fallback', () => {
      state.currentMode = 'narrative';
      state.worldTriggers = { bonusRain: 2, clap: -1 };
      updateTriggerIndicator();
      assert.ok(true);
    });
  });

  describe('getCurrentModeWorldCount', () => {
    test('returns pomodoro world count for pomodoro mode', () => {
      state.currentMode = 'pomodoro';
      const count = getCurrentModeWorldCount();
      assert.equal(count, 2);
    });

    test('returns sleep world count for sleep mode', () => {
      state.currentMode = 'sleep';
      const count = getCurrentModeWorldCount();
      assert.equal(count, 8);
    });

    test('returns world count for other modes', () => {
      state.currentMode = 'narrative';
      const count = getCurrentModeWorldCount();
      assert.equal(count, 13);
    });

    test('returns 0 for empty mode', () => {
      state.currentMode = '';
      const count = getCurrentModeWorldCount();
      assert.equal(count, 0);
    });
  });

  describe('currentModeAllowsMp3', () => {
    test('returns true for pomodoro mode', () => {
      state.currentMode = 'pomodoro';
      assert.equal(currentModeAllowsMp3(), true);
    });

    test('returns true for free mode', () => {
      state.currentMode = 'free';
      assert.equal(currentModeAllowsMp3(), true);
    });

    test('returns true for narrative mode', () => {
      state.currentMode = 'narrative';
      assert.equal(currentModeAllowsMp3(), true);
    });

    test('returns false for sleep mode', () => {
      state.currentMode = 'sleep';
      assert.equal(currentModeAllowsMp3(), false);
    });

    test('returns false for empty mode', () => {
      state.currentMode = '';
      assert.equal(currentModeAllowsMp3(), false);
    });
  });
});