import { state } from '../state.js';
import { SLEEP_LEVELS, SLEEP_WORLD_NAMES, SLEEP_WORLD_SYNTH, SLEEP_DEFAULTS, SLEEP_SYNTH_PRESETS, SLEEP_CHORD_PROGRESSIONS } from '../config.js';
import * as audio from '../audio.js';
import { updateAlarmTimerDisplay } from '../modes/uiUpdater.js';

let alarmTimer = null;
let alarmCheckInterval = null;

export function activate() {
  state.sleep.enabled = true;
  state.sleep.isWaking = false;
  state.autoMode = false; // Sono não usa autoMode narrativo
  
  // Para qualquer áudio atual
  if (state.isPlaying) {
    audio.toggleMasterPlay();
  }
  
  // Inicia no primeiro mundo do sono (Delta Profundo)
  if (state.currentLevel !== 0) {
    audio.selectLevel(0);
  }
  
  // Configura synth do primeiro mundo
  if (state.worldSynth) {
    state.worldSynth[0] = SLEEP_WORLD_SYNTH[0];
  }
  
  // Inicia alarme
  scheduleAlarm();
  
  // Inicia áudio do modo sono
  if (!state.audioCtx) audio.initAudio();
  state.isPlaying = true;
  audio.restartWorldAudio();
  
  // Renderiza UI
  renderSleepUI();
  
  }

export function deactivate() {
  state.sleep.enabled = false;
  cancelAlarm();
  }

export function scheduleAlarm() {
  if (alarmTimer) clearTimeout(alarmTimer);
  if (alarmCheckInterval) clearInterval(alarmCheckInterval);
  
  const { alarmTime, wakeWindowMinutes, wakeWorldIndex } = state.sleep;
  const [hours, minutes] = alarmTime.split(':').map(Number);
  
  const now = new Date();
  let alarmDate = new Date();
  alarmDate.setHours(hours, minutes, 0, 0);
  
  // Se o horário já passou hoje, agenda para amanhã
  if (alarmDate <= now) {
    alarmDate.setDate(alarmDate.getDate() + 1);
  }
  
  const wakeDate = new Date(alarmDate.getTime() - wakeWindowMinutes * 60 * 1000);
  const msUntilWake = wakeDate.getTime() - Date.now();
  const msUntilAlarm = alarmDate.getTime() - Date.now();
  
  // Timer para iniciar fase de despertar
  if (msUntilWake > 0) {
    alarmTimer = setTimeout(() => {
      startWakePhase();
    }, msUntilWake);
  } else {
    // Já passou da janela, inicia despertar agora
    startWakePhase();
  }
  
  // Timer para alarme final
  setTimeout(() => {
    triggerAlarm();
  }, msUntilAlarm);
  
  // Atualiza timer display a cada segundo
  alarmCheckInterval = setInterval(() => {
    updateAlarmTimerDisplay();
  }, 1000);
  updateAlarmTimerDisplay();
}

export function cancelAlarm() {
  if (alarmTimer) {
    clearTimeout(alarmTimer);
    alarmTimer = null;
  }
  if (alarmCheckInterval) {
    clearInterval(alarmCheckInterval);
    alarmCheckInterval = null;
  }
}

function startWakePhase() {
  state.sleep.isWaking = true;
  const { wakeWorldIndex } = state.sleep;
  
  // Transição suave para mundo de despertar
  if (state.currentLevel !== state.sleep.wakeWorldIndex) {
    audio.selectLevel(state.sleep.wakeWorldIndex);
  }
  
  // Fade-in gradual do volume nos últimos minutos
  startWakeFadeIn();
}

function startWakeFadeIn() {
  const fadeDuration = 5 * 60 * 1000; // 5 minutos
  const targetVolume = state.worldVolume ? state.worldVolume[state.sleep.wakeWorldIndex] : 0.3;
  
  const fadeSteps = 30;
  const stepDuration = fadeDuration / 30;
  
  let currentStep = 0;
  const fadeInterval = setInterval(() => {
    if (!state.sleep.isWaking || !state.isPlaying) {
      clearInterval(fadeInterval);
      return;
    }
    
    currentStep++;
    const volume = Math.min((currentStep / 30) * (state.worldVolume ? state.worldVolume[state.sleep.wakeWorldIndex] : 0.3), (state.worldVolume ? state.worldVolume[state.sleep.wakeWorldIndex] : 0.3));
    
    if (state.worldMp3Gains && state.worldMp3Gains[state.sleep.wakeWorldIndex]) {
      state.worldMp3Gains[state.sleep.wakeWorldIndex].gain.setTargetAtTime(volume, state.audioCtx.currentTime, 0.1);
    }
    if (state.synthMasterGain) {
      state.synthMasterGain.gain.setTargetAtTime(volume, state.audioCtx.currentTime, 0.1);
    }
    
    if (currentStep >= 30) {
      clearInterval(fadeInterval);
    }
  }, fadeDuration / 30);
}

function triggerAlarm() {
  // Toca som de alarme suave (synth ascendente)
  playAlarmSound();
  
  // Vibração se mobile
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
  
  // Para o modo sono após alarme
  setTimeout(async () => {
    deactivate();
    // Volta para modo narrativo ou livre
    const { switchMode } = await import('./modeManager.js');
    switchMode('narrative');
  }, 60000); // 1 minuto de alarme
}

export function playAlarmSound() {
  const now = state.audioCtx.currentTime;
  
  // Sequência ascendente suave
  const notes = [
    { f: 220, t: 0, dur: 0.5 },    // A3
    { f: 246.94, t: 0.5, dur: 0.5 }, // B3
    { f: 261.63, t: 1.0, dur: 0.5 }, // C4
    { f: 293.66, t: 1.5, dur: 0.5 }, // D4
    { f: 329.63, t: 2.0, dur: 1.0 }  // E4
  ];
  
  notes.forEach(n => {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.f, now + n.t);
    gain.gain.setValueAtTime(0, now + n.t);
    gain.gain.linearRampToValueAtTime(0.15, now + n.t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);
    osc.connect(gain);
    gain.connect(state.masterFilter);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.dur + 0.1);
  });
}

export function setAlarmTime(timeStr) {
  // timeStr no formato 'HH:MM'
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  
  state.sleep.alarmTime = timeStr;
  if (state.sleep.enabled) {
    cancelAlarm();
    scheduleAlarm();
  }
  return true;
}

export function setWakeWindow(minutes) {
  state.sleep.wakeWindowMinutes = Math.max(5, Math.min(60, minutes));
  if (state.sleep.enabled) {
    cancelAlarm();
    scheduleAlarm();
  }
}

export function setWakeWorld(index) {
  if (index >= 0 && index < 8) {
    state.sleep.wakeWorldIndex = index;
  }
}

function renderSleepUI() {
  // Atualiza seletor de mundo do sono se existir
  const sleepWorldSelect = document.getElementById('sleepWorldSelect');
  if (sleepWorldSelect) {
    // preenchido pelo updateDynamicSelects do i18n
  }
  
  // Atualiza time picker se existir
  const alarmTimeInput = /** @type {HTMLInputElement} */ (document.getElementById('sleepAlarmTime'));
  if (alarmTimeInput) {
    alarmTimeInput.value = state.sleep.alarmTime;
  }
}

// Funções acessíveis via import direto ou event delegation (data-action)
// Não expostas mais em window.* para evitar poluição global