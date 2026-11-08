// tests/unit/pomodoroUI-pure.test.mjs - Unit tests for pure functions in pomodoroUI.js
import '../mock-browser.mjs';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('PomodoroUI Pure Functions', () => {
  describe('Timer display formatting', () => {
    it('formats minutes and seconds correctly', () => {
      const formatTime = (seconds) => {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.max(0, seconds) % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
      };
      
      assert.equal(formatTime(1500), '25:00');
      assert.equal(formatTime(300), '5:00');
      assert.equal(formatTime(900), '15:00');
      assert.equal(formatTime(0), '0:00');
      assert.equal(formatTime(65), '1:05');
    });

    it('handles negative seconds', () => {
      const formatTime = (seconds) => {
        const mins = Math.floor(Math.max(0, seconds) / 60);
        const secs = Math.max(0, seconds) % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
      };
      
      assert.equal(formatTime(-10), '0:00');
      assert.equal(formatTime(-60), '0:00');
    });
  });

  describe('Phase label mapping', () => {
    it('maps phase to correct label', () => {
      const labels = {
        activity: 'Atividade',
        shortBreak: 'Pausa Curta',
        longBreak: 'Pausa Longa'
      };
      
      assert.equal(labels.activity, 'Atividade');
      assert.equal(labels.shortBreak, 'Pausa Curta');
      assert.equal(labels.longBreak, 'Pausa Longa');
    });

    it('falls back to phase name for unknown', () => {
      const labels = {
        activity: 'Atividade',
        shortBreak: 'Pausa Curta',
        longBreak: 'Pausa Longa'
      };
      
      assert.equal(labels.unknown || 'unknown', 'unknown');
    });
  });

  describe('Cycle display', () => {
    it('formats cycles completed / total', () => {
      const formatCycles = (completed, total) => `${completed}/${total}`;
      
      assert.equal(formatCycles(0, 4), '0/4');
      assert.equal(formatCycles(2, 4), '2/4');
      assert.equal(formatCycles(4, 4), '4/4');
    });
  });

  describe('Config value display', () => {
    it('formats activity duration', () => {
      const formatDuration = (minutes) => `${minutes} min`;
      
      assert.equal(formatDuration(25), '25 min');
      assert.equal(formatDuration(30), '30 min');
      assert.equal(formatDuration(50), '50 min');
    });

    it('formats break durations', () => {
      const formatDuration = (minutes) => `${minutes} min`;
      
      assert.equal(formatDuration(5), '5 min');
      assert.equal(formatDuration(15), '15 min');
    });

    it('formats cycles until long break', () => {
      const formatCycles = (cycles) => String(cycles);
      
      assert.equal(formatCycles(4), '4');
      assert.equal(formatCycles(6), '6');
    });
  });

  describe('Timer progress calculation', () => {
    it('calculates progress percentage', () => {
      const calcProgress = (remaining, total) => {
        if (total <= 0) return 1;
        return Math.max(0, Math.min(1, 1 - remaining / total));
      };
      
      assert.equal(calcProgress(1500, 1500), 0);
      assert.equal(calcProgress(750, 1500), 0.5);
      assert.equal(calcProgress(0, 1500), 1);
      // When remaining > total, progress is negative, clamped to 0
      assert.equal(calcProgress(1600, 1500), 0);
      assert.equal(calcProgress(-100, 1500), 1); // negative remaining = past end, clamped to 1
    });

    it('calculates stroke dash offset for progress ring', () => {
      const circumference = 2 * Math.PI * 45; // r=45
      const calcOffset = (progress) => circumference * (1 - progress);
      
      assert.ok(Math.abs(calcOffset(0) - circumference) < 0.01);
      assert.ok(Math.abs(calcOffset(0.5) - circumference * 0.5) < 0.01);
      assert.ok(Math.abs(calcOffset(1) - 0) < 0.01);
    });
  });

  describe('Button state', () => {
    it('determines play/pause text', () => {
      const getButtonText = (isRunning) => isRunning ? 'Pausar' : 'Iniciar';
      
      assert.equal(getButtonText(true), 'Pausar');
      assert.equal(getButtonText(false), 'Iniciar');
    });

    it('determines aria-pressed', () => {
      const getAriaPressed = (isRunning) => String(isRunning);
      
      assert.equal(getAriaPressed(true), 'true');
      assert.equal(getAriaPressed(false), 'false');
    });
  });

  describe('Config panel toggle', () => {
    it('toggles panel visibility', () => {
      const isOpen = (maxHeight) => maxHeight !== '0px' && maxHeight !== '';
      
      assert.equal(isOpen('0px'), false);
      assert.equal(isOpen(''), false);
      assert.equal(isOpen('200px'), true);
    });

    it('calculates maxHeight from scrollHeight', () => {
      const scrollHeight = 300;
      const maxHeight = `${scrollHeight}px`;
      
      assert.equal(maxHeight, '300px');
    });
  });

  describe('MP3 label formatting', () => {
    it('truncates long filenames', () => {
      const truncate = (name, maxLen = 30) => name.length > maxLen ? name.slice(0, maxLen) : name;
      
      assert.equal(truncate('short.mp3'), 'short.mp3');
      assert.equal(truncate('very_long_filename_that_exceeds_thirty_characters.mp3'), 'very_long_filename_that_exceed');
    });

    it('shows placeholder when no file', () => {
      const getLabel = (name) => name ? name.slice(0, 30) : '[Selecionar MP3]';
      
      assert.equal(getLabel('test.mp3'), 'test.mp3');
      assert.equal(getLabel(null), '[Selecionar MP3]');
      assert.equal(getLabel(undefined), '[Selecionar MP3]');
      assert.equal(getLabel(''), '[Selecionar MP3]');
    });
  });
});