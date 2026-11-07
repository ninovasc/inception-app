import { state } from '../state.js';
import { POMODORO_LEVELS, POMODORO_WORLD_NAMES, POMODORO_WORLD_SYNTH, POMODORO_DEFAULTS, POMODORO_CHORD_PROGRESSIONS } from '../config.js';
import * as audio from '../audio.js';

let timerInterval = null;

export async function activate() {
  state.pomodoro.enabled = true;
  state.pomodoro.isRunning = false;
  state.autoMode = false; // Pomodoro não usa autoMode narrativo
  
  // Garante que está no mundo Atividade (0) ao selecionar o modo
  if (state.currentLevel !== 0) {
    audio.selectLevel(0);
  }
  
  renderPomodoroUI();
}

// Inicia o timer (chamado ao clicar em "Iniciar")
export function start() {
  if (state.pomodoro.isRunning) return;
  state.pomodoro.isRunning = true;
  startTimer();
  renderPomodoroUI();
}

export function deactivate() {
  state.pomodoro.enabled = false;
  stopTimer();
}

export function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  state.pomodoro.isRunning = true;
  state.pomodoro.timeRemaining = state.pomodoro.totalTime;
  
  timerInterval = setInterval(() => {
    if (!state.pomodoro.isRunning || !state.pomodoro.enabled) {
      stopTimer();
      return;
    }
    
    state.pomodoro.timeRemaining--;
    updateTimerDisplay();
    
    if (state.pomodoro.timeRemaining <= 0) {
      nextPhase();
    }
  }, 1000);
  
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const timerEl = document.getElementById('pomodoroTimer');
  if (timerEl) {
    const mins = Math.floor(state.pomodoro.timeRemaining / 60);
    const secs = state.pomodoro.timeRemaining % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Sincroniza timer do screensaver (modo Pomodoro)
  if (typeof window.syncScreensaverPomodoroTimer === 'function') {
    window.syncScreensaverPomodoroTimer();
  }
  
  // Atualiza progress ring se existir
  const progressRing = document.getElementById('pomodoroProgressRing');
  if (progressRing) {
    const progress = 1 - (state.pomodoro.timeRemaining / state.pomodoro.totalTime);
    const circumference = 2 * Math.PI * 45; // r=45
    const offset = circumference * (1 - progress);
    progressRing.style.strokeDashoffset = offset;
  }
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  state.pomodoro.isRunning = false;
}

export function pauseTimer() {
  state.pomodoro.isRunning = false;
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function resumeTimer() {
  if (state.pomodoro.isRunning || !state.pomodoro.enabled) return;
  state.pomodoro.isRunning = true;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!state.pomodoro.isRunning || !state.pomodoro.enabled) {
      stopTimer();
      return;
    }
    state.pomodoro.timeRemaining--;
    updateTimerDisplay();
    if (state.pomodoro.timeRemaining <= 0) {
      nextPhase();
    }
  }, 1000);
  updateTimerDisplay();
}

export function skipPhase() {
  nextPhase();
}

async function nextPhase() {
  const { phase, cyclesCompleted, cyclesUntilLongBreak } = state.pomodoro;
  
  if (phase === 'activity') {
    state.pomodoro.cyclesCompleted++;
    
    if (state.pomodoro.cyclesCompleted % cyclesUntilLongBreak === 0) {
      // Pausa longa
      state.pomodoro.phase = 'longBreak';
      state.pomodoro.totalTime = state.pomodoro.longBreakDuration;
    } else {
      // Pausa curta
      state.pomodoro.phase = 'shortBreak';
      state.pomodoro.totalTime = state.pomodoro.shortBreakDuration;
    }
  } else {
    // Volta para atividade
    state.pomodoro.phase = 'activity';
    state.pomodoro.totalTime = state.pomodoro.activityDuration;
  }
  
  state.pomodoro.timeRemaining = state.pomodoro.totalTime;
  await transitionToPhase(state.pomodoro.phase);
}

async function transitionToPhase(newPhase) {
  let worldIndex = 0;
  let newTotalTime = 0;
  
  switch (newPhase) {
    case 'activity':
      worldIndex = 0; // Atividade
      newTotalTime = state.pomodoro.activityDuration;
      break;
    case 'shortBreak':
    case 'longBreak':
      worldIndex = 1; // Descanso
      newTotalTime = newPhase === 'longBreak' 
        ? state.pomodoro.longBreakDuration 
        : state.pomodoro.shortBreakDuration;
      break;
  }
  
  state.pomodoro.phase = newPhase;
  state.pomodoro.totalTime = newTotalTime;
  state.pomodoro.timeRemaining = newTotalTime;
  
  // Transição de mundo com crossfade suave
  if (state.currentLevel !== worldIndex) {
    audio.selectLevel(worldIndex);
  }
  
  // Atualiza synth do mundo
  if (state.worldSynth) {
    state.worldSynth[worldIndex] = 0; // Usa síntese padrão do Pomodoro
  }
  
  updateTimerDisplay();
  renderPomodoroUI();
  
  // Toca som de transição se estiver tocando
  if (state.isPlaying) {
    // O audio.selectLevel já cuida da transição
  }
}

export function getCurrentPhase() {
  return state.pomodoro.phase;
}

export function getTimeRemaining() {
  return state.pomodoro.timeRemaining;
}

export function getTotalTime() {
  return state.pomodoro.totalTime;
}

export function getCyclesCompleted() {
  return state.pomodoro.cyclesCompleted;
}

export function setDurations(config) {
  if (config.activityDuration !== undefined) {
    state.pomodoro.activityDuration = config.activityDuration;
  }
  if (config.shortBreakDuration !== undefined) {
    state.pomodoro.shortBreakDuration = config.shortBreakDuration;
  }
  if (config.longBreakDuration !== undefined) {
    state.pomodoro.longBreakDuration = config.longBreakDuration;
  }
  if (config.cyclesUntilLongBreak !== undefined) {
    state.pomodoro.cyclesUntilLongBreak = config.cyclesUntilLongBreak;
  }
}

export function setActivityMp3(url) {
  state.pomodoro.activityMp3 = url;
}

export function setBreakMp3(url) {
  state.pomodoro.breakMp3 = url;
}

function renderPomodoroUI() {
  // Atualiza seletor de fase se existir
  const phaseLabel = document.getElementById('pomodoroPhaseLabel');
  if (phaseLabel) {
    const labels = {
      activity: 'Atividade',
      shortBreak: 'Pausa Curta',
      longBreak: 'Pausa Longa'
    };
    phaseLabel.textContent = labels[state.pomodoro.phase] || state.pomodoro.phase;
  }
  
  // Atualiza indicador de ciclos
  const cyclesEl = document.getElementById('pomodoroCycles');
  if (cyclesEl) {
    cyclesEl.textContent = `${state.pomodoro.cyclesCompleted}/${state.pomodoro.cyclesUntilLongBreak}`;
  }
}



export function resetPomodoro() {
  stopTimer();
  state.pomodoro.phase = 'activity';
  state.pomodoro.timeRemaining = state.pomodoro.activityDuration;
  state.pomodoro.totalTime = state.pomodoro.activityDuration;
  state.pomodoro.cyclesCompleted = 0;
  renderPomodoroUI();
  updateTimerDisplay();
}

// Expor globalmente para uso inline no HTML
window.startPomodoro = async () => {
  if (!state.pomodoro.enabled) {
    const { modeManager } = await import('./modeManager.js');
    modeManager.switchMode('pomodoro');
  } else {
    pomodoroMode.startTimer();
  }
};

window.pausePomodoro = () => pomodoroMode.pauseTimer();
window.resumePomodoro = () => pomodoroMode.resumeTimer();
window.skipPomodoroPhase = () => pomodoroMode.skipPhase();
window.resetPomodoro = () => pomodoroMode.resetPomodoro();
window.setPomodoroDurations = (config) => pomodoroMode.setDurations(config);
window.setPomodoroActivityMp3 = (url) => pomodoroMode.setActivityMp3(url);
window.setPomodoroBreakMp3 = (url) => pomodoroMode.setBreakMp3(url);