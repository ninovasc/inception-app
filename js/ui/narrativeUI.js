import { state } from '../state.js';
import { initCommonUI } from './commonUI.js';
import { syncMechanicsUI } from '../mechanics.js';
import { updateTriggerIndicator } from '../modes/uiUpdater.js';
import { renderTriggerList } from '../features/triggerController.js';

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
  updateTriggerIndicator();
  if (syncMechanicsUI) syncMechanicsUI();
  
  // Renderiza lista de gatilhos
  renderTriggerList();
}