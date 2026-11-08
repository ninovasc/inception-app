// ============================================================
// Pomodoro Mode — Timer & Lógica de Fases
// ============================================================
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
  
  // Presets de voz para Pomodoro
  try {
    const sensors = await import('../sensors.js');
    if (sensors && sensors.MIC_PRESETS) {
      sensors.MIC_PRESETS['Pomodoro Atividade'] = { gate: -35, delay: 0.22, feedback: 0.18, reverb: 0.40, dry: 0.70, wet: 0.30, pitch: 0 };
      sensors.MIC_PRESETS['Pomodoro Pausa'] = { gate: -25, delay: 0.06, feedback: 0.03, reverb: 0.08, dry: 0.92, wet: 0.08, pitch: 0 };
    }
  } catch (e) {}
  
  if (typeof window.updatePomodoroUI === 'function') window.updatePomodoroUI();
}

// Inicia o timer (chamado ao clicar em "Iniciar")
export function start() {
  if (state.pomodoro.isRunning) return;
  state.pomodoro.isRunning = true;
  startTimer();
  if (typeof window.updatePomodoroUI === 'function') window.updatePomodoroUI();
}

export function deactivate() {
  state.pomodoro.enabled = false;
  stopTimer();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  state.pomodoro.isRunning = true;
  state.pomodoro.timeRemaining = state.pomodoro.totalTime;
  
  timerInterval = setInterval(() => {
    if (!state.pomodoro.isRunning || !state.pomodoro.enabled) {
      stopTimer();
      return;
    }
    
    state.pomodoro.timeRemaining--;
    if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
    
    if (state.pomodoro.timeRemaining <= 0) {
      nextPhase();
    }
  }, 1000);
  
  if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
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
    if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
    if (state.pomodoro.timeRemaining <= 0) {
      nextPhase();
    }
  }, 1000);
  if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
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
  
  if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
  if (typeof window.updatePomodoroUI === 'function') window.updatePomodoroUI();

  // Aplica preset de microfone conforme a fase (atividade = mais baixo + eco; pausa = mais presente)
  try {
    const sensors = await import('../sensors.js');
    if (sensors && sensors.MIC_PRESETS) {
      sensors.MIC_PRESETS['Pomodoro Atividade'] = { gate: -35, delay: 0.22, feedback: 0.18, reverb: 0.40, dry: 0.70, wet: 0.30, pitch: 0 };
      sensors.MIC_PRESETS['Pomodoro Pausa'] = { gate: -25, delay: 0.06, feedback: 0.03, reverb: 0.08, dry: 0.92, wet: 0.08, pitch: 0 };
    }
    if (sensors && typeof sensors.applyMicPreset === 'function') {
      sensors.applyMicPreset(newPhase === 'activity' ? 'Pomodoro Atividade' : 'Pomodoro Pausa');
    }
  } catch (e) {}
  
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

export function resetPomodoro() {
  stopTimer();
  state.pomodoro.phase = 'activity';
  state.pomodoro.timeRemaining = state.pomodoro.activityDuration;
  state.pomodoro.totalTime = state.pomodoro.activityDuration;
  state.pomodoro.cyclesCompleted = 0;
  if (typeof window.updatePomodoroUI === 'function') window.updatePomodoroUI();
  if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
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

// Funções acessíveis via import direto ou event delegation (data-action)
// Não expostas mais em window.* para evitar poluição global