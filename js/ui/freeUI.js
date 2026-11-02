import { state } from '../state.js';
import { initCommonUI } from './commonUI.js';
import { syncMechanicsUI } from '../mechanics.js';

// ============================================================
// UI Modo Livre - Apenas Mecânicas (sem Gatilhos)
// ============================================================

export function createFreeUI() {
  const container = document.createElement('div');
  container.id = 'freeUI';
  return container;
}

export function updateFreeUI() {
  if (state.currentMode !== 'free') return;
  
  // UI comum (mas sem renderizar gatilhos)
  initCommonUI();
  
  // Específico do Livre
  if (typeof syncMechanicsUI === 'function') syncMechanicsUI();
  
  // Limpa gatilho ativo no modo livre
  const triggerActive = document.getElementById('triggerActive');
  if (triggerActive) {
    triggerActive.textContent = 'Gatilhos desativados no modo Livre';
    triggerActive.dataset.activeTrigger = 'disabled';
  }
}