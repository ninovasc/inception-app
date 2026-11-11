import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES, normalizeSourceType, WORLD_SYNTH, POMODORO_LEVELS, POMODORO_WORLD_NAMES, SLEEP_LEVELS, SLEEP_WORLD_NAMES, MODES, MODE_ORDER } from './config.js';
import * as audio from './audio.js';
import { setSourceMode } from './audio.js';
import * as sensors from './sensors.js';
import * as mechanics from './mechanics.js';
import * as ui from './ui.js';
import './power.js';
import * as cap from './capture.js';

import './screensaver.js';
import './features/modeController.js';
import './features/triggerController.js';
import './features/pomodoroController.js';
import './features/sleepController.js';
import { testSleepAlarm } from './features/sleepController.js';
import './features/accordionController.js';
import { setMode, startCurrentMode, stopCurrentMode } from './features/modeController.js';
import { togglePomodoro } from './features/pomodoroController.js';
import { setWorldTrigger, setWorldTriggerMotion, setWorldTriggerSilence } from './features/triggerController.js';
import { toggleAccordion } from './features/accordionController.js';
import './eventDelegate.js';
import { registerAction } from './eventDelegate.js';
import { initI18n, t, setLang } from './i18n.js';
import { initModeManager, switchMode, isMode, isPomodoroMode, isSleepMode, isNarrativeMode, isFreeMode, updateModeSpecificUI, modeModules, updateTriggerIndicator, syncAutoUI, updatePanelVisibility } from './modes/modeManager.js';
import { initModeSelector } from './ui/modeSelector.js';
import { createPomodoroUI, updatePomodoroUI, togglePomodoroConfig } from './ui/pomodoroUI.js';
import { createSleepUI } from './ui/sleepUI.js';
import { createNarrativeUI, updateNarrativeUI } from './ui/narrativeUI.js';
import { createFreeUI, updateFreeUI } from './ui/freeUI.js';
import { initGenerativeUI, updateGenerativeUIVisibility, toggleGenerative, updateGenerativeVariation, generateNewVariation, saveGenerativeVariation, resetGenerative } from './ui/generativeUI.js';
import { initCommonUI, renderWorldSelect, renderVoicePresets, renderSourceList } from './ui/commonUI.js';
import { toggleAutoMode, getActiveTrigger } from './modes/narrativeMode.js';
import './pasivFile.js';

// Create dependency injection contexts
const audioCtx = audio.createAudioContext({ state });
const sensorsCtx = sensors.createSensorsContext({ state });

window.__lucidModes = LUCID_MODES;

// App version for cache busting verification
window.APP_VERSION = 50000;

// App version for cache busting verification
console.log('[PASIV] App version:', window.APP_VERSION);

// window.* não expõe mais lógica de negócio. Todas as funções são acessíveis
// via import direto nos módulos JS e via event delegation (data-action) no HTML.
// Apenas APIs do navegador e constantes de configuração permanecem em window.
window.__getAppState = () => state;
window.__getAppStateModule = async () => {
  const m = await import('./state.js');
  return m.state;
};
// Debug: expose function to check module's state variable
window.__getAppState = () => state;
window.__getAppStateModule = async () => {
  const m = await import('./state.js');
  return m.state;
};

// Ao iniciar o sonho, ativa as mecânicas padrão (permissões exigem gesto).
// A lógica de activateDreamDefaults já está incorporada em audio.toggleMasterPlay

// ============================================================
// Event delegation: registra ações para data-action
// ============================================================
registerAction('setLang', function () { setLang(this.value); });
registerAction('toggleHelp', function () { ui.toggleHelp(); });
registerAction('triggerKick', function () { audio.triggerKick(this.dataset.arg === 'true', audioCtx); });
registerAction('toggleMic', function () { sensors.toggleMic(sensorsCtx); });
registerAction('toggleMotion', function () { sensors.toggleMotion(sensorsCtx); });
registerAction('toggleGPS', function () { sensors.toggleGPS(sensorsCtx); });
registerAction('setMode', function () { setMode(this.value); });
registerAction('startCurrentMode', function () { startCurrentMode(); });
registerAction('stopCurrentMode', function () { stopCurrentMode(); });
registerAction('togglePomodoro', function () { togglePomodoro(); });
registerAction('togglePomodoroConfig', function () { togglePomodoroConfig(); });
registerAction('toggleAccordion', function () { toggleAccordion(this.dataset.arg); });
registerAction('selectLevel', function () { audio.selectLevel(parseInt(this.value), false, audioCtx); });
registerAction('setSourceMode', function () { audio.setSourceMode(parseInt(this.dataset.arg), this.value); });
registerAction('setWorldSynth', function () { audio.setWorldSynth(parseInt(this.dataset.arg), parseInt(this.value)); });
registerAction('setWorldVolume', function () { 
  const worldIdx = parseInt(this.dataset.arg);
  const val = parseFloat(this.value);
  audio.setWorldVolume(worldIdx, val);
  const label = document.getElementById('worldVolVal' + worldIdx);
  if (label) label.textContent = Math.round(val * 100) + '%';
});
registerAction('loadWorldMp3', function () { 
  const worldIdx = parseInt(this.dataset.arg);
  const file = this.files[0];
  if (file) audio.loadWorldMp3(worldIdx, file);
});
registerAction('updateFromSliders', function () { audio.updateFromSliders(this.dataset.arg === 'true'); });
registerAction('applyMicPreset', function () { sensors.applyMicPreset(this.value, sensorsCtx); });
registerAction('setMicParam', function () { sensors.setMicParam(this.dataset.param, this.value, sensorsCtx); });
registerAction('setWorldTriggerMotion', function () { setWorldTriggerMotion(this.value); });
registerAction('setWorldTriggerSilence', function () { setWorldTriggerSilence(this.value); });
registerAction('setWorldTrigger', function () { setWorldTrigger(this.dataset.key, this.value); });
registerAction('toggleMemoryCatcher', function () { mechanics.toggleMemoryCatcher(); });
registerAction('toggleAutoKick', function () { mechanics.toggleAutoKick(); });
registerAction('toggleSpatial3D', function () { mechanics.toggleSpatial3D(); });
registerAction('toggleGyroSliders', function () { mechanics.toggleGyroSliders(); });
registerAction('cycleLucidTimer', function () { mechanics.cycleLucidTimer(); });
registerAction('toggleDeprivationWatch', function () { mechanics.toggleDeprivationWatch(); });
registerAction('testSleepAlarm', function () { testSleepAlarm(); });
registerAction('toggleGenerative', function () { toggleGenerative(this.checked); });
registerAction('updateGenerativeVariation', function () { updateGenerativeVariation(this.value); });
registerAction('generateNewVariation', function () { generateNewVariation(); });
registerAction('saveGenerativeVariation', function () { saveGenerativeVariation(); });
registerAction('resetGenerative', function () { resetGenerative(); });
registerAction('toggleHelpBackdrop', function (e) { if (e.target === this) ui.toggleHelp(); });

// PASIV file actions
registerAction('exportPasivFile', function () { exportPasivFile(); });
registerAction('importPasivFile', function () { document.getElementById('pasivFileInput').click(); });
registerAction('handlePasivFileInput', function () { handlePasivFileInput(event); });

// Service worker:
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

// YouTube removido: mundos salvos como YouTube voltam para Synth.
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


// Inicializa modo manager e seletor
initModeManager();
initModeSelector();

// Inicializa i18n
initI18n();

// Modo não inicia automaticamente - usuário deve selecionar e clicar Iniciar

// Initialize UI comum
initCommonUI();

// Initialize generative UI
initGenerativeUI();
updateGenerativeUIVisibility();

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

// Garante que todos os painéis estejam escondidos quando nenhum modo está selecionado
updatePanelVisibility();


