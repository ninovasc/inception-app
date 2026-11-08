// tests/unit/audio-core-pure.test.mjs - Unit tests for audio/core.js pure functions
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initAudio } from '../../js/audio/core.js';

describe('Audio Core Module', () => {
  it('initializes audio context and nodes', () => {
    initAudio();
    // Note: In test environment, audio context is mocked
    // This verifies the function runs without throwing
    assert.ok(true);
  });

  it('can be called multiple times safely', () => {
    initAudio();
    initAudio();
    initAudio();
    assert.ok(true);
  });
});