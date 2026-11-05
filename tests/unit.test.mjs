import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import * as config from '../js/config.js';

describe('Unit: config helpers', () => {
  test('normalizeSourceType keeps valid types', () => {
    assert.equal(config.normalizeSourceType('mp3'), 'mp3');
    assert.equal(config.normalizeSourceType('synth'), 'synth');
  });
  test('normalizeSourceType defaults invalid to synth', () => {
    assert.equal(config.normalizeSourceType('foo'), 'synth');
    assert.equal(config.normalizeSourceType(null), 'synth');
  });
  test('getCurrentModeWorlds returns array for each mode', () => {
    for (const m of ['narrative','pomodoro','sleep','free']) {
      const w = config.getCurrentModeWorlds(m);
      assert.ok(Array.isArray(w), m);
      assert.ok(w.length > 0, m);
    }
  });
  test('normalizeWorldTriggers handles null', () => {
    const t = config.normalizeWorldTriggers(null);
    assert.ok(t && typeof t === 'object');
    assert.equal(typeof t.fallback, 'number');
  });
});
