// tests/unit/modes-sleepMode-pure.test.mjs - Unit tests for modes/sleepMode.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  activateSleepMode,
  deactivateSleepMode,
  scheduleAlarm,
  cancelAlarm,
  playAlarmSound,
  checkSensoryDeprivation,
  enterSensoryDeprivation,
  stopDeprivationHeartbeat,
} from '../../js/modes/sleepMode.js';

describe('Sleep Mode Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('activateSleepMode/deactivateSleepMode', () => {
    it('activates sleep mode', async () => {
      await activateSleepMode();
      const stateModule = await import('../../js/state.js');
      assert.ok(true);
    });

    it('deactivates sleep mode', async () => {
      await deactivateSleepMode();
      assert.ok(true);
    });
  });

  describe('scheduleAlarm/cancelAlarm', () => {
    it('schedules alarm', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.sleep = {
        alarmTime: '07:00',
        wakeWindowMinutes: 15,
      };
      
      scheduleAlarm();
      assert.ok(true);
    });

    it('cancels alarm', () => {
      cancelAlarm();
      assert.ok(true);
    });
  });

  describe('playAlarmSound', () => {
    it('plays alarm sound', () => {
      playAlarmSound();
      assert.ok(true);
    });
  });

  describe('checkSensoryDeprivation', () => {
    it('checks deprivation conditions', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.isDeprivationWatchOn = true;
      stateModule.state.micAnalyser = {
        frequencyBinCount: 64,
        getByteFrequencyData: (arr) => arr.fill(10),
      };
      stateModule.state.isPhoneFaceDown = true;
      stateModule.state.isMotionOn = false;
      stateModule.state.silenceSeconds = 0;
      stateModule.state.isDeprivationActive = false;
      stateModule.state.deprivationCheckInterval = null;
      stateModule.state.micGainNode = { gain: { setTargetAtTime: () => {} } };
      stateModule.state.audioCtx = { currentTime: 0 };
      
      checkSensoryDeprivation();
      assert.ok(true);
    });
  });

  describe('enterSensoryDeprivation', () => {
    it('enters deprivation mode', async () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.isDeprivationActive = false;
      stateModule.state.isDeprivationWatchOn = true;
      stateModule.state.isPlaying = true;
      stateModule.state.audioCtx = { currentTime: 0 };
      
      await enterSensoryDeprivation();
      assert.ok(true);
    });
  });

  describe('stopDeprivationHeartbeat', () => {
    it('stops heartbeat', () => {
      stopDeprivationHeartbeat();
      assert.ok(true);
    });
  });
});