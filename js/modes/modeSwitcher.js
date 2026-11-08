import { state } from '../state.js';
import { MODES } from '../config.js';
import * as audio from '../audio.js';
import * as narrativeMode from './narrativeMode.js';
import * as pomodoroMode from './pomodoroMode.js';
import * as sleepMode from './sleepMode.js';
import { updateModeUI, updateModeSpecificUI } from './uiUpdater.js';
import { updateWorldUI } from './panelManager.js';

export const modeModules = {
  narrative: narrativeMode,
  pomodoro: pomodoroMode,
  sleep: sleepMode,
  free: null // modo livre não tem módulo próprio
};

// Inicializa o gerenciador de modos
export function initModeManager() {
  // NÃO restaura modo salvo - usuário deve escolher
  state.currentMode = '';

  // Atualiza UI do seletor
  updateModeUI();
}

// Troca de modo
export function switchMode(modeId) {
  // Se modeId vazio, volta para "sem modo" - para tudo
  if (!modeId) {
    const prevMode = state.currentMode;
    if (prevMode) {
      deactivateMode(prevMode);
      state.currentMode = '';
      localStorage.removeItem('pasiv-mode');

      // Para áudio
      if (state.isPlaying) {
        audio.toggleMasterPlay();
      }

      // Atualiza UI
      updateModeUI();
      updateWorldUI();
      updateModeSpecificUI('');
    }
    return true;
  }

  if (!MODES.find(m => m.id === modeId)) {
    return false;
  }

  const prevMode = state.currentMode;
  if (prevMode === modeId) return true; // já está neste modo

  // Desativa modo anterior
  deactivateMode(prevMode);

  // Ativa novo modo
  state.currentMode = modeId;
  localStorage.setItem('pasiv-mode', modeId);

  const module = modeModules[modeId];
  if (module && module.activate) {
    module.activate();
  }

  // Atualiza UI
  updateModeUI();
  updateWorldUI();

  // Atualiza UI específica do modo
  updateModeSpecificUI(modeId);

  return true;
}

// Desativa modo atual
function deactivateMode(modeId) {
  const module = modeModules[modeId];
  if (module && module.deactivate) {
    module.deactivate();
  }

  // Limpezas gerais
  if (modeId === 'pomodoro') {
    pomodoroMode.stopTimer();
  }
  if (modeId === 'sleep') {
    sleepMode.cancelAlarm();
  }
  if (modeId === 'narrative') {
    narrativeMode.stopAutoMode();
  }
}

// Ativa modo
export function activateMode(modeId) {
  const module = modeModules[modeId];
  if (module && module.activate) {
    module.activate();
  }
}

// Retorna módulo do modo atual
export function getCurrentModeModule() {
  return modeModules[state.currentMode];
}

// Verifica se está em modo específico
export function isMode(modeId) {
  return state.currentMode === modeId;
}

// Obtém configuração do modo atual
export function getCurrentModeConfig() {
  return MODES.find(m => m.id === state.currentMode);
}

// Verifica se modo atual é Pomodoro
export function isPomodoroMode() {
  return state.currentMode === 'pomodoro';
}

// Verifica se modo atual é Sono
export function isSleepMode() {
  return state.currentMode === 'sleep';
}

// Verifica se modo atual é Narrativo
export function isNarrativeMode() {
  return state.currentMode === 'narrative';
}

// Verifica se modo atual é Livre
export function isFreeMode() {
  return state.currentMode === 'free';
}
