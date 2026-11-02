import { state } from '../state.js';
import { MODES, MODE_ORDER } from '../config.js';
import { switchMode, getCurrentModeConfig } from './modeManager.js';
import { t } from '../i18n.js';

// Cria o seletor de modo (dropdown ou segmented control)
export function createModeSelector() {
  const container = document.createElement('div');
  container.id = 'modeSelectorContainer';
  container.style.cssText = 'margin-bottom: 12px;';
  
  container.innerHTML = `
    <label style="font-size:0.6rem; color:var(--muted); margin-bottom:4px; display:block; font-family:monospace;">${t('mode.label') || 'Modo'}</label>
    <select id="modeSelector" onchange="window.setMode(this.value)" 
      style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:8px 10px;font-size:0.75rem;border-radius:6px;width:100%;">
      ${MODE_ORDER.map(id => {
        const mode = MODES.find(m => m.id === id);
        return `<option value="${id}" ${id === state.currentMode ? 'selected' : ''}>${mode.icon} ${mode.name}</option>`;
      }).join('')}
    </select>
  `;
  
  return container;
}

// Atualiza o seletor baseado no modo atual
export function updateModeSelector() {
  const selector = document.getElementById('modeSelector');
  if (selector) {
    selector.value = state.currentMode;
  }
}

// Handler global para troca de modo
window.setMode = function(modeId) {
  const { switchMode } = require('./modeManager.js');
  switchMode(modeId);
};

// Inicializa o seletor e insere no painel apropriado
export function initModeSelector() {
  // Cria o seletor se não existir
  if (!document.getElementById('modeSelectorContainer')) {
    const selector = createModeSelector();
    
    // Insere no painel "Estado do Sonho" (primeiro painel)
    const estadoPanel = document.getElementById('estadoPanel') || document.querySelector('.menu-section:first-child');
    if (estadoPanel) {
      const titleEl = estadoPanel.querySelector('.menu-title');
      if (titleEl && titleEl.nextSibling) {
        titleEl.parentNode.insertBefore(selector, titleEl.nextSibling);
      } else {
        estadoPanel.appendChild(selector);
      }
    }
  }
  
  updateModeSelector();
}

// Atualiza o seletor visual
export function updateModeSelector() {
  const selector = document.getElementById('modeSelector');
  if (selector) {
    selector.value = state.currentMode;
  }
}

// Expor função para uso inline
window.setMode = function(modeId) {
  const { switchMode } = require('./modeManager.js');
  switchMode(modeId);
};