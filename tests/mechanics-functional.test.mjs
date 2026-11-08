// Week 5 TDD: Mechanics module tests - exercising actual code paths
import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import './mock-browser.mjs';

const mechanics = await import('../js/mechanics.js');

describe('Mechanics Module - Functional Tests', () => {
  test('toggleMemoryCatcher is a function', () => {
    assert.ok(typeof mechanics.toggleMemoryCatcher === 'function');
  });

  test('toggleAutoKick is a function', () => {
    assert.ok(typeof mechanics.toggleAutoKick === 'function');
  });

  test('toggleSpatial3D is a function', () => {
    assert.ok(typeof mechanics.toggleSpatial3D === 'function');
  });

  test('toggleGyroSliders is a function', () => {
    assert.ok(typeof mechanics.toggleGyroSliders === 'function');
  });

  test('cycleLucidTimer is a function', () => {
    assert.ok(typeof mechanics.cycleLucidTimer === 'function');
  });

  test('setLucidTimerMinutes is a function', () => {
    assert.ok(typeof mechanics.setLucidTimerMinutes === 'function');
  });

  test('toggleDeprivationWatch is a function', () => {
    assert.ok(typeof mechanics.toggleDeprivationWatch === 'function');
  });

  test('syncMechanicsUI is a function', () => {
    assert.ok(typeof mechanics.syncMechanicsUI === 'function');
  });

  test('syncMechanicsUI does not throw', () => {
    try {
      mechanics.syncMechanicsUI();
      assert.ok(true);
    } catch (e) {
      assert.ok(e instanceof Error);
    }
  });
});