import { state } from '../state.js';
import { switchMode, modeModules } from '../modes/modeManager.js';
import * as mechanics from '../mechanics.js';
import * as audio from '../audio.js';
import { updateGenerativeUIVisibility } from '../ui/generativeUI.js';

// Troca de modo via seletor
export function setMode(modeId) {
  if (!modeId) {
    // Volta para "sem modo" - esconde botões e painéis
    const startBtn = document.getElementById('startModeBtn');
    if (startBtn) startBtn.style.display = 'none';
    const kickBtn = document.getElementById('kickBtn');
    if (kickBtn) kickBtn.style.display = 'none';
    switchMode(''); // Call switchMode to update panel visibility
    if (typeof updateGenerativeUIVisibility === 'function') updateGenerativeUIVisibility();
    return;
  }

  switchMode(modeId);

  if (typeof updateGenerativeUIVisibility === 'function') updateGenerativeUIVisibility();

  // Mostra botão Iniciar e Chute quando modo selecionado
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'flex';
  const kickBtn = document.getElementById('kickBtn');
  if (kickBtn) kickBtn.style.display = 'flex';
}

// Inicia o modo atual selecionado
export function startCurrentMode() {
  if (!state.currentMode) return;

  // Inicia áudio se necessário
  if (!audio.audioCtx) audio.initAudio();

  // Ativa modo atual (inicia timer, alarme, etc)
  const module = modeModules?.[state.currentMode];
  if (module && module.activate) {
    module.activate();
  }

  // Marca como tocando
  state.isPlaying = true;

  // Ativa mecânicas padrão
  mechanics.activateDreamDefaults();

  // Atualiza UI
  if (typeof window.updateFromSliders === 'function') window.updateFromSliders(true);

  // Esconde botão Iniciar
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'none';

  // Atualiza status
  const statusEl = document.getElementById('topStatus');
  if (statusEl) statusEl.textContent = 'SONHANDO';
}

export function getCurrentMode() {
  return state.currentMode;
}

// Expose to global scope for inline handlers
window.setMode = setMode;
window.startCurrentMode = startCurrentMode;
window.getCurrentMode = getCurrentMode;
