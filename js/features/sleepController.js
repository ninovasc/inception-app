import { state } from '../state.js';
import { setAlarmTime as setSleepAlarmTimeMode, cancelAlarm as cancelSleepAlarmMode } from '../modes/sleepMode.js';

export function setSleepAlarmTime(timeStr) {
  setSleepAlarmTimeMode(timeStr);
}

export function setSleepWakeWindow(minutes) {
  state.sleep.wakeWindowMinutes = Math.max(5, Math.min(60, parseInt(minutes) || 15));
}

export function setSleepWakeWorld(index) {
  if (index >= 0 && index < 8) {
    state.sleep.wakeWorldIndex = index;
  }
}

export function cancelSleepAlarm() {
  cancelSleepAlarmMode();
}

export async function testSleepAlarm() {
  const { state } = await import('../state.js');
  const audio = await import('../audio.js');
  if (!state.audioCtx) audio.initAudio();
  const { playAlarmSound } = await import('../modes/sleepMode.js');
  playAlarmSound();
}

window.setSleepAlarmTime = setSleepAlarmTime;
window.setSleepWakeWindow = setSleepWakeWindow;
window.setSleepWakeWorld = setSleepWakeWorld;
window.cancelSleepAlarm = cancelSleepAlarm;
window.testSleepAlarm = testSleepAlarm;
