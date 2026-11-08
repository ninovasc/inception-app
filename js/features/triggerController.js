import { state } from '../state.js';
import { TRIGGER_DEFS, WORLD_NAMES, normalizeWorldTriggers } from '../config.js';
import { t } from '../i18n.js';
import { getActiveTrigger, evaluateAutoMode } from '../modes/narrativeMode.js';
import { updateTriggerIndicator } from '../modes/modeManager.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function triggerOptions(current, allowOff) {
  const off = allowOff
    ? `<option value="-1" ${current === -1 ? 'selected' : ''}>${t('trigger.disabled')}</option>`
    : '';
  return off + WORLD_NAMES.map((name, i) =>
    `<option value="${i}" ${current === i ? 'selected' : ''}>${name}</option>`
  ).join('');
}

export function renderTriggerList() {
  const container = document.getElementById('triggerList');
  if (!container) return;
  if (!state.worldTriggers) state.worldTriggers = normalizeWorldTriggers(null);
  const tr = state.worldTriggers;
  const active = getActiveTrigger();
  container.innerHTML = TRIGGER_DEFS.map((def, i) => {
    const current = (tr[def.key] != null) ? tr[def.key] : -1;
    const allowOff = def.key !== 'fallback';
    // Agrupamento visual por sensor (a ordem curada é preservada).
    const isActive = !!(active && active.key === def.key);
    return `
      <div style="display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px solid #151515; ${isActive ? 'background:#151515; border-radius:4px; padding-left:4px;' : ''}">
        <span style="font-size:0.62rem; color:var(--muted); font-family:monospace; width:14px;">${i + 1}</span>
        <span style="font-size:0.7rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${def.label}</span>
        <span style="font-size:0.55rem; color:var(--muted); font-family:monospace; flex-shrink:0;">${def.sensor}</span>
        <select data-action="setWorldTrigger" data-key="${def.key}" aria-label="${def.label}" style="background:#0a0a0a; border:1px solid var(--border); color:#fff; padding:4px 6px; font-size:0.68rem; border-radius:6px; max-width:130px;">
          ${triggerOptions(current, allowOff)}
        </select>
      </div>
    `;
  }).join('');
  updateTriggerIndicator();

  const mEl = document.getElementById('triggerMotion');
  const sEl = document.getElementById('triggerSilence');
  const mVal = document.getElementById('triggerMotionVal');
  const sVal = document.getElementById('triggerSilenceVal');
  if (mEl) /** @type {HTMLInputElement} */ (mEl).value = String(state.triggerMotion);
  if (mVal) mVal.textContent = Math.round(state.triggerMotion * 100) + '%';
  if (sEl) /** @type {HTMLInputElement} */ (sEl).value = String(state.triggerSilenceSec);
  if (sVal) sVal.textContent = state.triggerSilenceSec + 's';
}

export function setWorldTrigger(key, value) {
  if (!state.worldTriggers) state.worldTriggers = normalizeWorldTriggers(null);
  if (!(key in state.worldTriggers)) return;
  const idx = parseInt(value, 10);
  if (key === 'fallback') {
    if (idx < 0 || idx >= WORLD_NAMES.length) return; // fallback sempre ativo
    state.worldTriggers.fallback = idx;
  } else {
    state.worldTriggers[key] = (idx >= 0 && idx < WORLD_NAMES.length) ? idx : -1;
  }
  renderTriggerList();
  if (state.autoMode && state.isPlaying) evaluateAutoMode();
}

export function setWorldTriggerMotion(value) {
  const v = parseFloat(value);
  if (isNaN(v)) return;
  state.triggerMotion = Math.max(0, Math.min(1, v));
  const el = document.getElementById('triggerMotionVal');
  if (el) el.textContent = Math.round(state.triggerMotion * 100) + '%';
  if (state.autoMode && state.isPlaying) evaluateAutoMode();
}

export function setWorldTriggerSilence(value) {
  const v = parseInt(value, 10);
  if (isNaN(v)) return;
  state.triggerSilenceSec = Math.max(5, Math.min(300, v));
  const el = document.getElementById('triggerSilenceVal');
  if (el) el.textContent = state.triggerSilenceSec + 's';
  if (state.autoMode && state.isPlaying) evaluateAutoMode();
}

// Funções acessíveis via import direto ou event delegation (data-action)
// Não expostas mais em window.* para evitar poluição global
