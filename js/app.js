import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES, YOUTUBE_ENABLED, normalizeSourceType, TRIGGER_DEFS, WORLD_NAMES, WORLD_SYNTH, normalizeWorldTriggers, POMODORO_LEVELS, POMODORO_WORLD_NAMES, SLEEP_LEVELS, SLEEP_WORLD_NAMES, MODES, MODE_ORDER } from './config.js';
import * as audio from './audio.js';
import * as sensors from './sensors.js';
import * as mechanics from './mechanics.js';
import * as seed from './seed.js';
import * as ui from './ui.js';
import './power.js';
import * as yt from './youtube.js';
import * as cap from './capture.js';

import { SCREENSAVER_SVG } from './screensaver-svg.js';
import { initI18n, t, setLang } from './i18n.js';
import { initModeManager, switchMode, isMode, isPomodoroMode, isSleepMode, isNarrativeMode, isFreeMode, updateModeSpecificUI, modeModules, updateTriggerIndicator, syncAutoUI } from './modes/modeManager.js';
import { initModeSelector } from './ui/modeSelector.js';
import { createPomodoroUI, updatePomodoroUI } from './ui/pomodoroUI.js';
import { updateTimerDisplay } from './modes/modeManager.js';
import { createSleepUI } from './ui/sleepUI.js';
import { createNarrativeUI, updateNarrativeUI } from './ui/narrativeUI.js';
import { createFreeUI, updateFreeUI } from './ui/freeUI.js';
import { initCommonUI, renderWorldSelect, renderVoicePresets, renderSourceList } from './ui/commonUI.js';
import { updateSleepUI, updateAlarmTimerDisplay } from './modes/modeManager.js';

window.__lucidModes = LUCID_MODES;

// Expose to global scope for inline handlers
Object.assign(window, {
  initAudio: audio.initAudio,
  setSourceMode: audio.setSourceMode,
  selectSynthType: audio.selectSynthType,
  setSynthVolume: audio.setSynthVolume,
  startSynth: audio.startSynth,
  stopSynth: audio.stopSynth,
  loadStem: audio.loadStem,
  startStems: audio.startStems,
  stopStems: audio.stopStems,
  setVolume: audio.setVolume,
  toggleMasterPlay: audio.toggleMasterPlay,
  selectLevel: audio.selectLevel,
  syncXYPadFromSliders: audio.syncXYPadFromSliders,
  updateFromSliders: audio.updateFromSliders,
  applyParameters: audio.applyParameters,
  setWorldSynth: audio.setWorldSynth,
  setWorldVolume: audio.setWorldVolume,
  restartWorldAudio: audio.restartWorldAudio,
  triggerKick: audio.triggerKick,
  toggleMic: sensors.toggleMic,
  applyMicPreset: sensors.applyMicPreset,
  setMicParam: sensors.setMicParam,
  toggleMotion: sensors.toggleMotion,
  motionHandler: sensors.motionHandler,
  orientationHandler: sensors.orientationHandler,
  toggleGPS: sensors.toggleGPS,
  toggleMemoryCatcher: mechanics.toggleMemoryCatcher,
  toggleAutoKick: mechanics.toggleAutoKick,
  toggleSpatial3D: mechanics.toggleSpatial3D,
  cycleLucidTimer: mechanics.cycleLucidTimer,
  setLucidTimerMinutes: mechanics.setLucidTimerMinutes,
  toggleDeprivationWatch: mechanics.toggleDeprivationWatch,
  checkSensoryDeprivation: mechanics.checkSensoryDeprivation,
  enterSensoryDeprivation: mechanics.enterSensoryDeprivation,
  stopDeprivationHeartbeat: mechanics.stopDeprivationHeartbeat,
  syncMechanicsUI: mechanics.syncMechanicsUI,
  generateFullSeed: seed.generateFullSeed,
  copySeed: seed.copySeed,
  applySeed: seed.applySeed,
  togglePanel: ui.togglePanel,
  toggleHelp: ui.toggleHelp,
  autoResizeSeed: ui.autoResizeSeed,
  startYouTube: yt.startYouTube,
  stopYouTube: yt.stopYouTube,
  startYouTubeWorld: yt.startYouTubeWorld,
  stopYouTubeWorld: yt.stopYouTubeWorld,
  stopAllYouTubeWorld: yt.stopAllYouTubeWorld,
  setYouTubeRate: yt.setYouTubeRate,
  loadYouTube: yt.loadYouTube,
  loadWorldMp3: audio.loadWorldMp3,
  setYouTubeVolume: yt.setYouTubeVolume,
  setWorldMp3Volume: audio.setWorldMp3Volume,
  startCapture: cap.startCapture,
  stopCapture: cap.stopCapture,
  setCaptureVolume: cap.setCaptureVolume,
  toggleAutoMode,
  getActiveTrigger,
  setWorldTrigger: (key, value) => setWorldTrigger(key, value),
  setWorldTriggerMotion: (value) => setWorldTriggerMotion(value),
  setWorldTriggerSilence: (value) => setWorldTriggerSilence(value),
  state: state,
  setLang,
  // Common UI functions
  renderWorldSelect,
  renderVoicePresets,
  renderSourceList,
  renderTriggerList: () => {},
  updateTriggerIndicator,
  initCommonUI,
  syncAutoUI
  initCommonUI
});
// Debug: expose function to check module's state variable
window.__getAppState = () => state;
window.__getAppStateModule = async () => {
  const m = await import('./state.js');
  return m.state;
};

// Ao iniciar o sonho, ativa as mecânicas padrão (permissões exigem gesto).
const baseToggleMasterPlay = audio.toggleMasterPlay;
window.toggleMasterPlay = function() {
  if (!state.isPlaying) mechanics.activateDreamDefaults();
  return baseToggleMasterPlay();
};

// ============================================================
// Global Mode Functions
// ============================================================
window.setMode = function(modeId) {
  if (!modeId) {
    // Volta para "sem modo" - esconde botões
    const startBtn = document.getElementById('startModeBtn');
    if (startBtn) startBtn.style.display = 'none';
    const kickBtn = document.getElementById('kickBtn');
    if (kickBtn) kickBtn.style.display = 'none';
    return;
  }
  
  switchMode(modeId);
  
  // Mostra botão Iniciar e Chute quando modo selecionado
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'flex';
  const kickBtn = document.getElementById('kickBtn');
  if (kickBtn) kickBtn.style.display = 'flex';
};

window.startCurrentMode = function() {
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
  
  };

window.getCurrentMode = function() {
  return state.currentMode;
};

window.isPomodoroMode = function() {
  return isPomodoroMode();
};

window.isSleepMode = function() {
  return isSleepMode();
};

window.isNarrativeMode = function() {
  return isNarrativeMode();
};

window.isFreeMode = function() {
  return isFreeMode();
};

// Pomodoro globals
window.startPomodoro = function() {
  if (!state.pomodoro.enabled) {
    switchMode('pomodoro');
  } else {
    startPomodoroTimer();
  }
};

window.pausePomodoro = () => pausePomodoroTimer();
window.resumePomodoro = () => resumePomodoroTimer();
window.skipPomodoroPhase = () => skipPomodoroPhase();
window.resetPomodoro = () => resetPomodoroTimer();
window.setPomodoroDurations = (config) => pomodoroMode.setDurations(config);
window.setPomodoroActivityMp3 = (url) => pomodoroMode.setActivityMp3(url);
window.setPomodoroBreakMp3 = (url) => pomodoroMode.setBreakMp3(url);

// Sleep globals
window.setSleepAlarmTime = function(timeStr) {
  setSleepAlarmTime(timeStr);
};

window.setSleepWakeWindow = function(minutes) {
  state.sleep.wakeWindowMinutes = Math.max(5, Math.min(60, parseInt(minutes) || 15));
};

window.setSleepWakeWorld = function(index) {
  if (index >= 0 && index < 8) {
    state.sleep.wakeWorldIndex = index;
  }
};

window.cancelSleepAlarm = function() {
  cancelSleepAlarm();
};

window.testSleepAlarm = async function() {
  const { playAlarmSound } = await import('./modes/sleepMode.js');
  playAlarmSound();
};

// Service worker
if ('serviceWorker' in navigator) {
  // Se já havia um SW controlando a página, um SW novo assumindo indica
  // que houve deploy: recarrega uma única vez para evitar arquivos misturados
  // (index.html novo com JS antigo do cache).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    // updateViaCache 'none': o navegador não pode servir um sw.js antigo
    // do cache HTTP — é o que garantia versões misturadas após o deploy.
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
  });
}

// Try to lock orientation to portrait (PWA)
try {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(() => {});
  }
} catch (e) {}

// Init YouTube API (somente se o recurso estiver habilitado)
if (YOUTUBE_ENABLED) yt.initYouTube();

// YouTube desativado: mundos salvos como YouTube voltam para Synth.
if (state.worldSourceType) {
  state.worldSourceType = state.worldSourceType.map(normalizeSourceType);
}

// Desabilitar presets de voz inicialmente (mic off)
document.querySelectorAll('.mic-preset, #voicePanel input[type=range]').forEach(el => {
  el.style.opacity = '0.4';
  el.setAttribute('disabled', 'true');
});

// Render source list (vertical, one world at a time expanded)
let activeSourceWorld = 0;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// --- Gatilhos de Mundo (Modo Automático) ---
function triggerOptions(current, allowOff) {
  const off = allowOff
    ? `<option value="-1" ${current === -1 ? 'selected' : ''}>${t('trigger.disabled')}</option>`
    : '';
  return off + WORLD_NAMES.map((name, i) =>
    `<option value="${i}" ${current === i ? 'selected' : ''}>${name}</option>`
  ).join('');
}


function renderTriggerList() {
  const container = document.getElementById('triggerList');
  if (!container) return;
  if (!state.worldTriggers) state.worldTriggers = normalizeWorldTriggers(null);
  const t = state.worldTriggers;
  const active = getActiveTrigger();
  container.innerHTML = TRIGGER_DEFS.map((def, i) => {
    const current = (t[def.key] != null) ? t[def.key] : -1;
    const allowOff = def.key !== 'fallback';
    // Agrupamento visual por sensor (a ordem curada é preservada).
    const isActive = !!(active && active.key === def.key);
    return `
      <div style="display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px solid #151515; ${isActive ? 'background:#151515; border-radius:4px; padding-left:4px;' : ''}">
        <span style="font-size:0.62rem; color:var(--muted); font-family:monospace; width:14px;">${i + 1}</span>
        <span style="font-size:0.7rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${def.label}</span>
        <span style="font-size:0.55rem; color:var(--muted); font-family:monospace; flex-shrink:0;">${def.sensor}</span>
        <select onchange="setWorldTrigger('${def.key}', this.value)" aria-label="${def.label}" style="background:#0a0a0a; border:1px solid var(--border); color:#fff; padding:4px 6px; font-size:0.68rem; border-radius:6px; max-width:130px;">
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
  if (mEl) mEl.value = state.triggerMotion;
  if (mVal) mVal.textContent = Math.round(state.triggerMotion * 100) + '%';
  if (sEl) sEl.value = state.triggerSilenceSec;
  if (sVal) sVal.textContent = state.triggerSilenceSec + 's';
}
window.renderTriggerList = renderTriggerList;

function setWorldTrigger(key, value) {
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
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

function setWorldTriggerMotion(value) {
  const v = parseFloat(value);
  if (isNaN(v)) return;
  state.triggerMotion = Math.max(0, Math.min(1, v));
  const el = document.getElementById('triggerMotionVal');
  if (el) el.textContent = Math.round(state.triggerMotion * 100) + '%';
  if (state.autoMode && state.isPlaying) evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

function setWorldTriggerSilence(value) {
  const v = parseInt(value, 10);
  if (isNaN(v)) return;
  state.triggerSilenceSec = Math.max(5, Math.min(300, v));
  const el = document.getElementById('triggerSilenceVal');
  if (el) el.textContent = state.triggerSilenceSec + 's';
  if (state.autoMode && state.isPlaying) evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// Inicializa modo manager e seletor
initModeManager();
initModeSelector();

// Inicializa i18n
initI18n();

// Initial seed
seed.generateFullSeed(true);

// Modo não inicia automaticamente - usuário deve selecionar e clicar Iniciar

// Initialize UI comum
initCommonUI();

// Initialize mode-specific UIs
const pomodoroContainer = document.getElementById('pomodoroUI');
if (pomodoroContainer) {
  pomodoroContainer.innerHTML = '';
  pomodoroContainer.appendChild(createPomodoroUI());
}

const sleepContainer = document.getElementById('sleepUI');
if (sleepContainer) {
  sleepContainer.innerHTML = '';
  sleepContainer.appendChild(createSleepUI());
}

const narrativeContainer = document.getElementById('narrativeUI');
if (narrativeContainer) {
  narrativeContainer.innerHTML = '';
  narrativeContainer.appendChild(createNarrativeUI());
}

const freeContainer = document.getElementById('freeUI');
if (freeContainer) {
  freeContainer.innerHTML = '';
  freeContainer.appendChild(createFreeUI());
}

// Trigger initial UI update for current mode
updateModeSpecificUI(state.currentMode);

// ============================================================
// Accordion behavior: only one panel open at a time
// ============================================================
function toggleAccordion(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const isOpen = panel.classList.contains('open');

  // Close all other accordion panels
  document.querySelectorAll('.accordion-panel').forEach(p => {
    if (p !== panel) {
      p.classList.remove('open');
      // Update arrow
      const title = p.previousElementSibling;
      if (title) {
        const arrow = title.querySelector('.accordion-arrow');
        if (arrow) arrow.textContent = '▶';
      }
    }
  });

  // Toggle current panel
  panel.classList.toggle('open');

  // Update arrow for current panel
  const title = panel.previousElementSibling;
  if (title) {
    const arrow = title.querySelector('.accordion-arrow');
    if (arrow) arrow.textContent = panel.classList.contains('open') ? '▼' : '▶';
  }
}

// Expose globally
window.toggleAccordion = toggleAccordion;

// ============================================================
// Screensaver de inatividade (1 min) — overlay com SVG animado
// ============================================================
const SCREENSAVER_DELAY_MS = 60000; // 1 minuto
let screensaverTimer = null;
let screensaverEl = null;
let screensaverVisible = false;

function createScreensaver() {
  if (screensaverEl) return screensaverEl;
  const el = document.createElement('div');
  el.id = 'screensaverOverlay';
  el.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 1.2s ease;
  `;
  // SVG inline (animações CSS funcionam direto no DOM, ao contrário de <object>)
  el.innerHTML = SCREENSAVER_SVG;
  // Click no overlay esconde o screensaver (touchstart removido: click já cobre touch com passive)
  el.addEventListener('click', hideScreensaver);
  document.body.appendChild(el);
  screensaverEl = el;
  return el;
}

function showScreensaver() {
  if (screensaverVisible) return;
  const el = createScreensaver();
  // Force reflow para a transição funcionar
  el.offsetHeight;
  el.style.pointerEvents = 'auto';
  el.style.opacity = '1';
  screensaverVisible = true;
}

function hideScreensaver() {
  if (!screensaverVisible) return;
  const el = screensaverEl;
  if (!el) return;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  screensaverVisible = false;
  // Reset timer ao voltar
  resetScreensaverTimer();
}

function resetScreensaverTimer() {
  if (screensaverTimer) clearTimeout(screensaverTimer);
  // Só inicia o timer se o app estiver "ativo" (não em screensaver)
  if (!screensaverVisible) {
    screensaverTimer = setTimeout(showScreensaver, SCREENSAVER_DELAY_MS);
  }
}

// Eventos de atividade do usuário
const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'click'];
activityEvents.forEach(evt => {
  document.addEventListener(evt, resetScreensaverTimer, { passive: true });
});

// Pausar timer quando tab não visível (evita screensaver em background)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (screensaverTimer) clearTimeout(screensaverTimer);
  } else {
    resetScreensaverTimer();
  }
});

// Iniciar timer
resetScreensaverTimer();

// Expor para debug/teste
window.__screensaver = { show: showScreensaver, hide: hideScreensaver, reset: resetScreensaverTimer };
