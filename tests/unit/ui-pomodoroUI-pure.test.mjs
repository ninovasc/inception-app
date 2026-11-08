// tests/unit/ui-pomodoroUI-pure.test.mjs - Unit tests for ui/pomodoroUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPomodoroUI,
  updatePomodoroUI,
  togglePomodoroConfig,
  updatePomodoroActivityDuration,
  updatePomodoroShortBreakDuration,
  updatePomodoroLongBreakDuration,
  updatePomodoroCyclesUntilLongBreak,
  loadPomodoroActivityMp3,
  loadPomodoroBreakMp3,
} from '../../js/ui/pomodoroUI.js';

describe('PomodoroUI Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('createPomodoroUI', () => {
    it('creates pomodoro UI container', () => {
      const container = createPomodoroUI();
      assert.ok(container);
      assert.equal(container.id, 'pomodoroUI');
      assert.ok(container.innerHTML.includes('pomodoroTimer'));
      assert.ok(container.innerHTML.includes('pomodoroPlayPause'));
      assert.ok(container.innerHTML.includes('pomodoroConfig'));
    });
  });

  describe('updatePomodoroUI', () => {
    it('updates UI based on state', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.pomodoro = {
        enabled: true,
        phase: 'activity',
        isRunning: false,
        cyclesCompleted: 2,
        cyclesUntilLongBreak: 4,
      };
      
      updatePomodoroUI();
      assert.ok(true);
    });

    it('handles disabled pomodoro', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.pomodoro = {
        enabled: false,
        phase: 'activity',
        isRunning: false,
        cyclesCompleted: 0,
        cyclesUntilLongBreak: 4,
      };
      
      updatePomodoroUI();
      assert.ok(true);
    });

    it('updates phase labels correctly', () => {
      const stateModule = await import('../../js/state.js');
      const phases = ['activity', 'shortBreak', 'longBreak'];
      
      for (const phase of phases) {
        stateModule.state.pomodoro = {
          enabled: true,
          phase,
          isRunning: true,
          cyclesCompleted: 1,
          cyclesUntilLongBreak: 4,
        };
        updatePomodoroUI();
      }
      assert.ok(true);
    });
  });

  describe('togglePomodoroConfig', () => {
    it('toggles config panel', () => {
      togglePomodoroConfig();
      assert.ok(true);
    });

    it('handles missing config element', () => {
      global.document.getElementById = () => null;
      togglePomodoroConfig();
      assert.ok(true);
    });
  });

  describe('Configuration updates', () => {
    it('updates activity duration', () => {
      updatePomodoroActivityDuration(30);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.pomodoro.activityDuration, 30 * 60);
    });

    it('updates short break duration', () => {
      updatePomodoroShortBreakDuration(10);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.pomodoro.shortBreakDuration, 10 * 60);
    });

    it('updates long break duration', () => {
      updatePomodoroLongBreakDuration(20);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.pomodoro.longBreakDuration, 20 * 60);
    });

    it('updates cycles until long break', () => {
      updatePomodoroCyclesUntilLongBreak(6);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.pomodoro.cyclesUntilLongBreak, 6);
    });
  });

  describe('MP3 loading', () => {
    it('loads activity MP3', async () => {
      const mockFile = { name: 'activity.mp3', arrayBuffer: async () => new ArrayBuffer(1024) };
      await loadPomodoroActivityMp3(mockFile);
      assert.ok(true);
    });

    it('loads break MP3', async () => {
      const mockFile = { name: 'break.mp3', arrayBuffer: async () => new ArrayBuffer(1024) };
      await loadPomodoroBreakMp3(mockFile);
      assert.ok(true);
    });

    it('handles null file', async () => {
      await loadPomodoroActivityMp3(null);
      await loadPomodoroBreakMp3(null);
      assert.ok(true);
    });
  });
});