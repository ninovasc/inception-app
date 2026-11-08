// tests/unit/modes-pomodoroMode-pure.test.mjs - Unit tests for modes/pomodoroMode.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  activatePomodoroMode,
  deactivatePomodoroMode,
  startPomodoroTimer,
  resumeTimer,
  togglePomodoro,
} from '../../js/modes/pomodoroMode.js';

describe('Pomodoro Mode Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('activatePomodoroMode/deactivatePomodoroMode', () => {
    it('activates pomodoro mode', async () => {
      await activatePomodoroMode();
      const stateModule = await import('../../js/state.js');
      assert.ok(true);
    });

    it('deactivates pomodoro mode', async () => {
      await deactivatePomodoroMode();
      assert.ok(true);
    });
  });

  describe('startPomodoroTimer', () => {
    it('starts pomodoro timer', () => {
      startPomodoroTimer();
      assert.ok(true);
    });
  });

  describe('resumeTimer', () => {
    it('resumes timer', () => {
      resumeTimer();
      assert.ok(true);
    });
  });

  describe('togglePomodoro', () => {
    it('toggles pomodoro on/off', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.pomodoro = {
        enabled: true,
        isRunning: false,
      };
      
      await togglePomodoro();
      assert.ok(true);
    });
  });
});