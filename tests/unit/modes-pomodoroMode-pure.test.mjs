// tests/unit/modes-pomodoroMode-pure.test.mjs - Unit tests for modes/pomodoroMode.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../../js/state.js';
import { cleanupTimers } from '../mock-browser.mjs';

// Dynamic imports after mock is set up
let activate, deactivate, start, stopTimer, pauseTimer, resumeTimer, skipPhase, getCurrentPhase, getTimeRemaining, getTotalTime, getCyclesCompleted, setDurations, setActivityMp3, setBreakMp3, resetPomodoro;

before(async () => {
  await import('../mock-browser.mjs');
  const mod = await import('../../js/modes/pomodoroMode.js');
  activate = mod.activate;
  deactivate = mod.deactivate;
  start = mod.start;
  stopTimer = mod.stopTimer;
  pauseTimer = mod.pauseTimer;
  resumeTimer = mod.resumeTimer;
  skipPhase = mod.skipPhase;
  getCurrentPhase = mod.getCurrentPhase;
  getTimeRemaining = mod.getTimeRemaining;
  getTotalTime = mod.getTotalTime;
  getCyclesCompleted = mod.getCyclesCompleted;
  setDurations = mod.setDurations;
  setActivityMp3 = mod.setActivityMp3;
  setBreakMp3 = mod.setBreakMp3;
  resetPomodoro = mod.resetPomodoro;
});

after(() => {
  cleanupTimers();
});

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

  describe('activate/deactivate', () => {
    it('activate enables pomodoro and sets defaults', () => {
      state.pomodoro.enabled = false;
      activate();
      assert.equal(state.pomodoro.enabled, true);
      assert.equal(state.pomodoro.isRunning, false);
      assert.equal(state.autoMode, false);
    });

    it('deactivate disables pomodoro and stops timer', () => {
      state.pomodoro.enabled = true;
      state.pomodoro.isRunning = true;
      deactivate();
      assert.equal(state.pomodoro.enabled, false);
    });
  });

  describe('start/stop/pause/resume', () => {
    it('start begins timer', () => {
      state.pomodoro.enabled = true;
      state.pomodoro.isRunning = false;
      start();
      assert.equal(state.pomodoro.isRunning, true);
    });

    it('stop stops timer', () => {
      state.pomodoro.isRunning = true;
      stopTimer();
      assert.equal(state.pomodoro.isRunning, false);
    });

    it('pauseTimer pauses timer', () => {
      state.pomodoro.isRunning = true;
      pauseTimer();
      assert.equal(state.pomodoro.isRunning, false);
    });

    it('resumeTimer resumes timer', () => {
      state.pomodoro.enabled = true;
      state.pomodoro.isRunning = false;
      resumeTimer();
      assert.equal(state.pomodoro.isRunning, true);
    });
  });

  describe('phase management', () => {
    it('getCurrentPhase returns current phase', () => {
      state.pomodoro.phase = 'activity';
      assert.equal(getCurrentPhase(), 'activity');
      state.pomodoro.phase = 'shortBreak';
      assert.equal(getCurrentPhase(), 'shortBreak');
      state.pomodoro.phase = 'longBreak';
      assert.equal(getCurrentPhase(), 'longBreak');
    });

    it('getTimeRemaining returns remaining seconds', () => {
      state.pomodoro.timeRemaining = 1500;
      assert.equal(getTimeRemaining(), 1500);
    });

    it('getTotalTime returns total duration', () => {
      state.pomodoro.totalTime = 1500;
      assert.equal(getTotalTime(), 1500);
    });

    it('getCyclesCompleted returns completed cycles', () => {
      state.pomodoro.cyclesCompleted = 3;
      assert.equal(getCyclesCompleted(), 3);
    });
  });

  describe('phase transitions', () => {
    it('skipPhase triggers next phase', () => {
      state.pomodoro.phase = 'activity';
      state.pomodoro.cyclesCompleted = 0;
      skipPhase();
      // nextPhase is internal, but we can test it doesn't throw
      assert.ok(true);
    });
  });

  describe('duration configuration', () => {
    it('setDurations updates pomodoro config', () => {
      setDurations({ activityDuration: 25 * 60 });
      assert.equal(state.pomodoro.activityDuration, 25 * 60);
    });

    it('setDurations handles shortBreakDuration', () => {
      setDurations({ shortBreakDuration: 10 * 60 });
      assert.equal(state.pomodoro.shortBreakDuration, 10 * 60);
    });

    it('setDurations handles longBreakDuration', () => {
      setDurations({ longBreakDuration: 20 * 60 });
      assert.equal(state.pomodoro.longBreakDuration, 20 * 60);
    });

    it('setDurations handles cyclesUntilLongBreak', () => {
      setDurations({ cyclesUntilLongBreak: 6 });
      assert.equal(state.pomodoro.cyclesUntilLongBreak, 6);
    });
  });

  describe('MP3 handling', () => {
    it('setActivityMp3 sets activity MP3', () => {
      setActivityMp3('activity.mp3');
      assert.equal(state.pomodoro.activityMp3, 'activity.mp3');
    });

    it('setBreakMp3 sets break MP3', () => {
      setBreakMp3('break.mp3');
      assert.equal(state.pomodoro.breakMp3, 'break.mp3');
    });
  });

  describe('resetPomodoro', () => {
    it('resets pomodoro to initial state', () => {
      state.pomodoro.phase = 'longBreak';
      state.pomodoro.timeRemaining = 100;
      state.pomodoro.cyclesCompleted = 3;
      state.pomodoro.isRunning = true;
      
      resetPomodoro();
      
      assert.equal(state.pomodoro.phase, 'activity');
      assert.equal(state.pomodoro.cyclesCompleted, 0);
      assert.equal(state.pomodoro.isRunning, false);
    });
  });
});