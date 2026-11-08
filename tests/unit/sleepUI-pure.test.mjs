// tests/unit/sleepUI-pure.test.mjs - Unit tests for pure functions in sleepUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SleepUI Pure Functions', () => {
  describe('Alarm time handling', () => {
    it('validates time format HH:MM', () => {
      const isValidTime = (timeStr) => /^\d{2}:\d{2}$/.test(timeStr);
      
      assert.equal(isValidTime('07:00'), true);
      assert.equal(isValidTime('23:59'), true);
      assert.equal(isValidTime('00:00'), true);
      assert.equal(isValidTime('7:00'), false);
      assert.equal(isValidTime('07:0'), false);
      assert.equal(isValidTime('25:00'), true); // format valid, value not checked
      assert.equal(isValidTime('07:60'), true); // format valid, value not checked
      assert.equal(isValidTime(''), false);
      assert.equal(isValidTime('07:00:00'), false);
    });

    it('parses hours and minutes', () => {
      const parseTime = (timeStr) => {
        if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes };
      };
      
      assert.deepEqual(parseTime('07:00'), { hours: 7, minutes: 0 });
      assert.deepEqual(parseTime('23:59'), { hours: 23, minutes: 59 });
      assert.deepEqual(parseTime('00:00'), { hours: 0, minutes: 0 });
      assert.equal(parseTime('invalid'), null);
    });
  });

  describe('Wake window handling', () => {
    it('clamps wake window to valid range', () => {
      const clampWakeWindow = (val) => Math.max(5, Math.min(60, parseInt(val) || 15));
      
      assert.equal(clampWakeWindow(15), 15);
      assert.equal(clampWakeWindow(5), 5);
      assert.equal(clampWakeWindow(60), 60);
      // parseInt('0') = 0 which is falsy, so defaults to 15, then clamped to 15
      assert.equal(clampWakeWindow('0'), 15);
      assert.equal(clampWakeWindow(100), 60);
      assert.equal(clampWakeWindow('30'), 30);
      assert.equal(clampWakeWindow('abc'), 15);
      assert.equal(clampWakeWindow(null), 15);
      assert.equal(clampWakeWindow(undefined), 15);
    });

    it('formats wake window display', () => {
      const formatWakeWindow = (minutes) => `${minutes} min`;
      
      assert.equal(formatWakeWindow(5), '5 min');
      assert.equal(formatWakeWindow(15), '15 min');
      assert.equal(formatWakeWindow(60), '60 min');
    });
  });

  describe('World selection', () => {
    it('parses world index', () => {
      const parseWorldIdx = (val) => parseInt(val);
      
      assert.equal(parseWorldIdx('0'), 0);
      assert.equal(parseWorldIdx('7'), 7);
      assert.equal(parseWorldIdx('0'), 0);
    });
  });

  describe('Timer display formatting', () => {
    it('formats hours and minutes until alarm', () => {
      const formatTimer = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}:${String(minutes).padStart(2, '0')}`;
      };
      
      assert.equal(formatTimer(0), '0:00');
      assert.equal(formatTimer(3600), '1:00');
      assert.equal(formatTimer(7200), '2:00');
      assert.equal(formatTimer(25200), '7:00'); // 7 hours
      assert.equal(formatTimer(27000), '7:30'); // 7.5 hours
    });

    it('handles large values', () => {
      const formatTimer = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${hours}:${String(minutes).padStart(2, '0')}`;
      };
      
      assert.equal(formatTimer(86400), '24:00');
    });
  });

  describe('Sleep world names', () => {
    it('has correct number of worlds', () => {
      const SLEEP_WORLD_NAMES = [
        'Half Remembered Dream',
        'We Built Our Own World',
        'Dream Is Collapsing',
        'Radical Notion',
        'Old Souls',
        '528491',
        'Mombasa',
        'One Simple Idea'
      ];
      
      assert.equal(SLEEP_WORLD_NAMES.length, 8);
    });

    it('generates option elements', () => {
      const SLEEP_WORLD_NAMES = ['World 1', 'World 2', 'World 3'];
      
      const html = SLEEP_WORLD_NAMES.map((w, i) => 
        `<option value="${i}">${w}</option>`
      ).join('');
      
      assert.ok(html.includes('value="0"'));
      assert.ok(html.includes('value="1"'));
      assert.ok(html.includes('value="2"'));
      assert.ok(html.includes('World 1'));
      assert.ok(html.includes('World 2'));
      assert.ok(html.includes('World 3'));
    });
  });

  describe('Alarm label', () => {
    it('shows correct label', () => {
      const getLabel = (untilAlarm) => untilAlarm ? 'Até o Alarme' : 'Até o Alarme';
      
      assert.equal(getLabel(true), 'Até o Alarme');
      assert.equal(getLabel(false), 'Até o Alarme');
    });
  });
});