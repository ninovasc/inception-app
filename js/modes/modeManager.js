import { state } from '../state.js';
import { MODES, MODE_ORDER, DEFAULT_MODE, WORLD_NAMES, POMODORO_WORLD_NAMES, SLEEP_WORLD_NAMES, WORLD_COUNT, POMODORO_WORLD_COUNT, SLEEP_WORLD_COUNT } from '../config.js';
import * as narrativeMode from './narrativeMode.js';
import * as pomodoroMode from './pomodoroMode.js';
import * as sleepMode from './sleepMode.js';
import { updateNarrativeUI } from '../ui/narrativeUI.js';
import { updateFreeUI } from '../ui/freeUI.js';
import { updatePomodoroUI } from '../ui/pomodoroUI.js';
import { updateSleepUI } from '../ui/sleepUI.js';

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
      if (typeof window.toggleMasterPlay === 'function' && window.state?.isPlaying) {
        window.toggleMasterPlay();
      }
      
      // Atualiza UI
      updateModeUI();
      updateWorldUI();
      updateModeSpecificUI('');
      
      console.log(`[ModeManager] Modo parado: ${prevMode} → nenhum`);
    }
    return true;
  }
  
  if (!MODES.find(m => m.id === modeId)) {
    console.warn(`Modo desconhecido: ${modeId}`);
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
  
  console.log(`[ModeManager] Modo alterado: ${prevMode} → ${modeId}`);
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
function activateMode(modeId) {
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

// Atualiza UI do seletor de modo
function updateModeUI() {
  // Atualiza seletor no header/painel
  const selector = document.getElementById('modeSelector');
  if (selector) {
    selector.value = state.currentMode;
  }
  
  // Atualiza botão "Modo Automático" (mantém compatibilidade)
  const autoBtn = document.getElementById('btnAutoMode');
  if (autoBtn) {
    const isNarrative = state.currentMode === 'narrative';
    autoBtn.classList.toggle('active', isNarrative);
    autoBtn.setAttribute('aria-pressed', isNarrative);
    const sub = document.getElementById('autoSub');
    if (sub) sub.textContent = isNarrative ? 'ON' : 'OFF';
  }
  
  // Atualiza label do modo no header se existir
  const modeLabel = document.getElementById('currentModeLabel');
  if (modeLabel) {
    const mode = MODES.find(m => m.id === state.currentMode);
    modeLabel.textContent = mode ? mode.name : '—';
  }
  
  // Atualiza visibilidade dos painéis por modo
  updatePanelVisibility();
}

// Atualiza visibilidade dos painéis baseado no modo atual
function updatePanelVisibility() {
  const sections = document.querySelectorAll('.menu-section[data-mode]');
  sections.forEach(section => {
    const modes = section.dataset.mode?.split(' ') || [];
    const show = modes.includes(state.currentMode);
    section.style.display = show ? '' : 'none';
  });
}

// Atualiza UI específica do mundo (dropdown, sliders, etc)
export function updateWorldUI() {
  // Re-renderiza dropdown de mundos
  if (typeof window.renderWorldSelect === 'function') {
    window.renderWorldSelect();
  }
  
  // Atualiza sliders baseado no nível atual
  if (typeof window.updateFromSliders === 'function') {
    window.updateFromSliders(true);
  }
  
  // Atualiza painel de fonte sonora
  if (typeof window.renderSourceList === 'function') {
    window.renderSourceList();
  }
  
  // Atualiza gatilhos se no modo narrativo
  if (state.currentMode === 'narrative' && typeof window.renderTriggerList === 'function') {
    window.renderTriggerList();
  }
}

// Retorna mundos disponíveis para o modo atual
export function getCurrentModeWorlds() {
  switch (state.currentMode) {
    case 'narrative':
      return WORLD_NAMES;
    case 'pomodoro':
      return POMODORO_WORLD_NAMES;
    case 'sleep':
      return SLEEP_WORLD_NAMES;
    case 'free':
      return WORLD_NAMES;
    default:
      return [];
  }
}

// Retorna contagem de mundos do modo atual
export function getCurrentModeWorldCount() {
  if (!state.currentMode) return 0;
  switch (state.currentMode) {
    case 'pomodoro':
      return POMODORO_WORLD_COUNT;
    case 'sleep':
      return SLEEP_WORLD_COUNT;
    default:
      return WORLD_COUNT;
  }
}

// Verifica se modo atual permite MP3
export function currentModeAllowsMp3() {
  if (!state.currentMode) return false;
  return state.currentMode === 'pomodoro' || state.currentMode === 'free' || state.currentMode === 'narrative';
}

// Verifica se modo atual usa timer Pomodoro
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

// Atualiza UI específica do modo
export function updateModeSpecificUI(modeId) {
  switch (modeId) {
    case 'narrative':
      if (typeof updateNarrativeUI === 'function') updateNarrativeUI();
      break;
    case 'pomodoro':
      if (typeof updatePomodoroUI === 'function') updatePomodoroUI();
      break;
    case 'sleep':
      if (typeof updateSleepUI === 'function') updateSleepUI();
      break;
    case 'free':
      if (typeof updateFreeUI === 'function') updateFreeUI();
      break;
  }
}