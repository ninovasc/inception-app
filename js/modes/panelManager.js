import { state } from '../state.js';

// Atualiza visibilidade dos painéis baseado no modo atual
export function updatePanelVisibility() {
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
