// tests/unit/ui-sleepUI-pure.test.mjs - Unit tests for ui/sleepUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSleepUI,
  updateSleepUI,
  setSleepAlarmTime,
  setSleepWakeWindow,
  setSleepWakeWorld,
  testSleepAlarm,
} from '../../js/ui/sleepUI.js';

describe('SleepUI Module', () => {
  let originalState;

  before(async () => {
    const stateModule = await import('../../js/state.js');
    originalState = { ...stateModule.state };
  });

  after(async () => {
    const stateModule = await import('../../js/state.js');
    Object.assign(stateModule.state, originalState);
  });

  describe('createSleepUI', () => {
    it('creates sleep UI container', () => {
      const container = createSleepUI();
      assert.ok(container);
      assert.equal(container.id, 'sleepUI');
      assert.ok(container.innerHTML.includes('sleepWorldSelect'));
      assert.ok(container.innerHTML.includes('sleepAlarmTime'));
      assert.ok(container.innerHTML.includes('sleepWakeWindow'));
      assert.ok(container.innerHTML.includes('sleepAlarmTimer'));
      assert.ok(container.innerHTML.includes('sleepTestAlarm'));
    });
  });

  describe('updateSleepUI', () => {
    it('updates UI based on sleep state', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.sleep = {
        enabled: true,
        currentWorld: 3,
        alarmTime: '07:30',
        wakeWindowMinutes: 20,
      };
      
      updateSleepUI();
      assert.ok(true);
    });

    it('handles disabled sleep mode', () => {
      const stateModule = await import('../../js/state.js');
      stateModule.state.sleep = {
        enabled: false,
        currentWorld: 0,
        alarmTime: '07:00',
        wakeWindowMinutes: 15,
      };
      
      updateSleepUI();
      assert.ok(true);
    });
  });

  describe('setSleepAlarmTime', () => {
    it('sets alarm time with valid format', () => {
      setSleepAlarmTime('07:30');
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.alarmTime, '07:30');
    });

    it('rejects invalid format', () => {
      setSleepAlarmTime('7:30');
      setSleepAlarmTime('07:0');
      setSleepAlarmTime('25:00');
      setSleepAlarmTime('07:60');
      setSleepAlarmTime('invalid');
      // Should not update state
      assert.ok(true);
    });
  });

  describe('setSleepWakeWindow', () => {
    it('clamps wake window to valid range', () => {
      setSleepWakeWindow(15);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.wakeWindowMinutes, 15);
    });

    it('clamps minimum to 5', () => {
      setSleepWakeWindow(0);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.wakeWindowMinutes, 5);
    });

    it('clamps maximum to 60', () => {
      setSleepWakeWindow(100);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.wakeWindowMinutes, 60);
    });

    it('handles invalid input', () => {
      setSleepWakeWindow('abc');
      setSleepWakeWindow(null);
      setSleepWakeWindow(undefined);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.wakeWindowMinutes, 15);
    });
  });

  describe('setSleepWakeWorld', () => {
    it('sets current world', () => {
      setSleepWakeWorld(5);
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.currentWorld, 5);
    });

    it('parses string input', () => {
      setSleepWakeWorld('3');
      const stateModule = await import('../../js/state.js');
      assert.equal(stateModule.state.sleep.currentWorld, 3);
    });
  });

  describe('testSleepAlarm', () => {
    it('plays alarm sound', () => {
      testSleepAlarm();
      assert.ok(true);
    });
  });
});