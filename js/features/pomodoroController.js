import { state } from '../state.js';
import { switchMode } from '../modes/modeManager.js';
import * as pomodoroMode from '../modes/pomodoroMode.js';
import { t } from '../i18n.js';

export function startPomodoro() {
  if (!state.pomodoro.enabled) {
    switchMode('pomodoro');
  } else {
    pomodoroMode.startTimer();
  }
}

export function pausePomodoro() { pomodoroMode.pauseTimer(); }
export function resumePomodoro() { pomodoroMode.resumeTimer(); }
export function skipPomodoroPhase() { pomodoroMode.skipPhase(); }
export function resetPomodoro() { pomodoroMode.resetPomodoro(); }
export function setPomodoroDurations(config) { pomodoroMode.setDurations(config); }
export function setPomodoroActivityMp3(url) { pomodoroMode.setActivityMp3(url); }
export function setPomodoroBreakMp3(url) { pomodoroMode.setBreakMp3(url); }

export function togglePomodoro() {
  if (!state.pomodoro.enabled) return;
  if (state.pomodoro.isRunning) {
    pomodoroMode.pauseTimer();
  } else {
    pomodoroMode.resumeTimer();
  }
  const btnText = document.getElementById('pomodoroPlayPauseText');
  if (btnText) {
    btnText.textContent = state.pomodoro.isRunning
      ? (t('pomodoro.pause') || 'Pausar')
      : (t('pomodoro.start') || 'Iniciar');
  }
}

window.startPomodoro = startPomodoro;
window.togglePomodoro = togglePomodoro;
window.pausePomodoro = pausePomodoro;
window.resumePomodoro = resumePomodoro;
window.skipPomodoroPhase = skipPomodoroPhase;
window.resetPomodoro = resetPomodoro;
window.setPomodoroDurations = setPomodoroDurations;
window.setPomodoroActivityMp3 = setPomodoroActivityMp3;
window.setPomodoroBreakMp3 = setPomodoroBreakMp3;
