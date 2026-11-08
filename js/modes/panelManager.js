import { state } from '../state.js';
import { renderWorldSelect } from '../ui/commonUI.js';
import { updateFromSliders } from '../audio.js';
import { renderSourceList } from '../ui/commonUI.js';
import { renderTriggerList } from '../features/triggerController.js';

// Atualiza visibilidade dos painéis baseado no modo atual
export function updatePanelVisibility() {
  const sections = document.querySelectorAll('.menu-section[data-mode]');
  sections.forEach(section => {
    const el = /** @type {HTMLElement} */ (section);
    const modes = (el.dataset.mode || '').split(' ');
    const show = modes.includes(state.currentMode);
    el.style.display = show ? '' : 'none';
  });
}

// Atualiza UI específica do mundo (dropdown, sliders, etc)
export function updateWorldUI() {
  // Re-renderiza dropdown de mundos
  renderWorldSelect();

  // Atualiza sliders baseado no nível atual
  updateFromSliders(true);

  // Atualiza painel de fonte sonora
  renderSourceList();

  // Atualiza gatilhos se no modo narrativo
  if (state.currentMode === 'narrative') {
    renderTriggerList();
  }
}
