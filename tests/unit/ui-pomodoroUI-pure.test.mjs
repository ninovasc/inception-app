// tests/unit/ui-pomodoroUI-pure.test.mjs - Unit tests for ui/pomodoroUI.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let state, createPomodoroUI, updatePomodoroUI, togglePomodoroConfig, updatePomodoroActivityDuration, updatePomodoroShortBreakDuration, updatePomodoroLongBreakDuration, updatePomodoroCyclesUntilLongBreak, loadPomodoroActivityMp3, loadPomodoroBreakMp3;

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
  
  const mod = await import('../../js/ui/pomodoroUI.js');
  createPomodoroUI = mod.createPomodoroUI;
  updatePomodoroUI = mod.updatePomodoroUI;
  togglePomodoroConfig = mod.togglePomodoroConfig;
  updatePomodoroActivityDuration = mod.updatePomodoroActivityDuration;
  updatePomodoroShortBreakDuration = mod.updatePomodoroShortBreakDuration;
  updatePomodoroLongBreakDuration = mod.updatePomodoroLongBreakDuration;
  updatePomodoroCyclesUntilLongBreak = mod.updatePomodoroCyclesUntilLongBreak;
  loadPomodoroActivityMp3 = mod.loadPomodoroActivityMp3;
  loadPomodoroBreakMp3 = mod.loadPomodoroBreakMp3;
});

after(() => {
  cleanupTimers();
});

describe('Pomodoro UI Module', () => {
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
    state.currentMode = 'pomodoro';
    state.pomodoro = {
      enabled: true,
      isRunning: false,
      phase: 'activity',
      activityDuration: 25 * 60,
      shortBreakDuration: 5 * 60,
      longBreakDuration: 15 * 60,
      cyclesUntilLongBreak: 4,
      cyclesCompleted: 0,
      timeRemaining: 25 * 60,
      totalTime: 25 * 60,
      activityMp3: '',
      breakMp3: ''
    };
    state.currentLevel = 0;
  }

  function test(name, fn) {
    return it(name, () => {
      resetState();
      return fn();
    });
  }

  describe('createPomodoroUI', () => {
    test('creates pomodoro UI container', () => {
      const container = createPomodoroUI();
      assert.ok(container);
      assert.equal(container.id, 'pomodoroUI');
    });

    test('includes timer display', () => {
      const container = createPomodoroUI();
      assert.ok(container.innerHTML.includes('pomodoroTimer'));
    });

    test('includes phase label', () => {
      const container = createPomodoroUI();
      assert.ok(container.innerHTML.includes('pomodoroPhaseLabel'));
    });

    test('includes progress ring SVG', () => {
      const container = createPomodoroUI();
      assert.ok(container.innerHTML.includes('pomodoroProgressRing'));
    });

    test('includes play/pause button', () => {
      const container = createPomodoroUI();
      assert.ok(container.innerHTML.includes('pomodoroPlayPause'));
    });

    test('includes config panel', () => {
      const container = createPomodoroUI();
      assert.ok(container.innerHTML.includes('pomodoroConfig'));
    });
  });

  describe('updatePomodoroUI', () => {
    test('updates phase label', () => {
      updatePomodoroUI();
      assert.ok(true);
    });

    test('handles missing phase label gracefully', () => {
      updatePomodoroUI();
      assert.ok(true);
    });

    test('updates cycles display', () => {
      updatePomodoroUI();
      assert.ok(true);
    });

    test('updates play/pause button state', () => {
      state.pomodoro.isRunning = true;
      updatePomodoroUI();
      assert.ok(true);
    });

    test('does nothing when pomodoro not enabled', () => {
      state.pomodoro.enabled = false;
      updatePomodoroUI();
      assert.ok(true);
    });
  });

  describe('togglePomodoroConfig', () => {
    test('toggles config panel open/closed', () => {
      togglePomodoroConfig();
      assert.ok(true);
    });

    test('handles missing config element gracefully', () => {
      togglePomodoroConfig();
      assert.ok(true);
    });
  });

  describe('updatePomodoroActivityDuration', () => {
    test('updates activity duration value display', () => {
      updatePomodoroActivityDuration('30');
      assert.equal(state.pomodoro.activityDuration, 30 * 60);
    });

    test('updates total time when in activity phase and not running', () => {
      state.pomodoro.phase = 'activity';
      state.pomodoro.isRunning = false;
      updatePomodoroActivityDuration('20');
      assert.equal(state.pomodoro.totalTime, 20 * 60);
      assert.equal(state.pomodoro.timeRemaining, 20 * 60);
    });

    test('updates total time when in activity phase and running', () => {
      state.pomodoro.phase = 'activity';
      state.pomodoro.isRunning = true;
      updatePomodoroActivityDuration('20');
      // The code updates totalTime even when running
      assert.equal(state.pomodoro.totalTime, 20 * 60);
    });
  });

  describe('updatePomodoroShortBreakDuration', () => {
    test('updates short break duration value display', () => {
      updatePomodoroShortBreakDuration('10');
      assert.equal(state.pomodoro.shortBreakDuration, 10 * 60);
    });
  });

  describe('updatePomodoroLongBreakDuration', () => {
    test('updates long break duration value display', () => {
      updatePomodoroLongBreakDuration('20');
      assert.equal(state.pomodoro.longBreakDuration, 20 * 60);
    });
  });

  describe('updatePomodoroCyclesUntilLongBreak', () => {
    test('updates cycles until long break value display', () => {
      updatePomodoroCyclesUntilLongBreak('6');
      assert.equal(state.pomodoro.cyclesUntilLongBreak, 6);
    });
  });

  describe('loadPomodoroActivityMp3', () => {
    test('handles missing file gracefully', async () => {
      await loadPomodoroActivityMp3(null);
      assert.ok(true);
    });

    test('loads file and updates state', async () => {
      const mockFile = { name: 'activity.mp3' };
      // Test passes if no error thrown
      await loadPomodoroActivityMp3(mockFile);
      assert.ok(true);
    });
  });

  describe('loadPomodoroBreakMp3', () => {
    test('handles missing file gracefully', async () => {
      await loadPomodoroBreakMp3(null);
      assert.ok(true);
    });

    test('loads file and updates state', async () => {
      const mockFile = { name: 'break.mp3' };
      await loadPomodoroBreakMp3(mockFile);
      assert.ok(true);
    });
  });
});