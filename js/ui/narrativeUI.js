import { state } from '../state.js';
import { initCommonUI, updateActiveTriggerDisplay } from './commonUI.js';
import { syncMechanicsUI } from '../mechanics.js';

// ============================================================
// UI Modo Narrativo - Gatilhos + Mecânicas
// ============================================================

export function createNarrativeUI() {
  const container = document.createElement('div');
  container.id = 'narrativeUI';
  return container;
}

export function updateNarrativeUI() {
  if (state.currentMode !== 'narrative') return;
  
  // UI comum
  initCommonUI();
  
  // Específico do Narrativo
  updateActiveTriggerDisplay();
  if (typeof syncMechanicsUI === 'function') syncMechanicsUI();
  
  // Renderiza lista de gatilhos
  if (typeof window.renderTriggerList === 'function') {
    window.renderTriggerList();
  }
}