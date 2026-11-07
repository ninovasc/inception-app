import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES, YOUTUBE_ENABLED, normalizeSourceType, WORLD_SYNTH, POMODORO_LEVELS, POMODORO_WORLD_NAMES, SLEEP_LEVELS, SLEEP_WORLD_NAMES, MODES, MODE_ORDER } from './config.js';
import * as audio from './audio.js';
import * as sensors from './sensors.js';
import * as mechanics from './mechanics.js';
import * as seed from './seed.js';
import * as ui from './ui.js';
import './power.js';
import * as yt from './youtube.js';
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
import { initModeManager, switchMode, isMode, isPomodoroMode, isSleepMode, isNarrativeMode, isFreeMode, updateModeSpecificUI, modeModules, updateTriggerIndicator, syncAutoUI } from './modes/modeManager.js';
import { initModeSelector } from './ui/modeSelector.js';
import { createPomodoroUI, updatePomodoroUI } from './ui/pomodoroUI.js';
import { createSleepUI } from './ui/sleepUI.js';
import { createNarrativeUI, updateNarrativeUI } from './ui/narrativeUI.js';
import { createFreeUI, updateFreeUI } from './ui/freeUI.js';
import { initGenerativeUI, updateGenerativeUIVisibility, toggleGenerative, updateGenerativeVariation, generateNewVariation, saveGenerativeVariation, resetGenerative, applyGenerativeSeed } from './ui/generativeUI.js';
import { initCommonUI, renderWorldSelect, renderVoicePresets, renderSourceList } from './ui/commonUI.js';
import { toggleAutoMode, getActiveTrigger } from './modes/narrativeMode.js';

window.__lucidModes = LUCID_MODES;

// App version for cache busting verification
window.APP_VERSION = 19;

// App version for cache busting verification
console.log('[PASIV] App version:', window.APP_VERSION);

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
  updateTriggerIndicator,
  initCommonUI,
  syncAutoUI
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
// Event delegation: registra ações para data-action
// ============================================================
registerAction('setLang', function () { setLang(this.value); });
registerAction('toggleHelp', function () { ui.toggleHelp(); });
registerAction('triggerKick', function () { audio.triggerKick(this.dataset.arg === 'true'); });
registerAction('toggleMic', function () { sensors.toggleMic(); });
registerAction('toggleMotion', function () { sensors.toggleMotion(); });
registerAction('toggleGPS', function () { sensors.toggleGPS(); });
registerAction('setMode', function () { setMode(this.value); });
registerAction('startCurrentMode', function () { startCurrentMode(); });
registerAction('stopCurrentMode', function () { stopCurrentMode(); });
registerAction('togglePomodoro', function () { togglePomodoro(); });
registerAction('toggleAccordion', function () { toggleAccordion(this.dataset.arg); });
registerAction('selectLevel', function () { audio.selectLevel(parseInt(this.value)); });
registerAction('updateFromSliders', function () { audio.updateFromSliders(this.dataset.arg === 'true'); });
registerAction('applyMicPreset', function () { sensors.applyMicPreset(this.value); });
registerAction('setMicParam', function () { sensors.setMicParam(this.dataset.param, this.value); });
registerAction('setWorldTriggerMotion', function () { setWorldTriggerMotion(this.value); });
registerAction('setWorldTriggerSilence', function () { setWorldTriggerSilence(this.value); });
registerAction('setWorldTrigger', function () { setWorldTrigger(this.dataset.key, this.value); });
registerAction('toggleMemoryCatcher', function () { mechanics.toggleMemoryCatcher(); });
registerAction('toggleAutoKick', function () { mechanics.toggleAutoKick(); });
registerAction('toggleSpatial3D', function () { mechanics.toggleSpatial3D(); });
registerAction('cycleLucidTimer', function () { mechanics.cycleLucidTimer(); });
registerAction('toggleDeprivationWatch', function () { mechanics.toggleDeprivationWatch(); });
registerAction('autoResizeSeed', function () { ui.autoResizeSeed.call(this); });
registerAction('copySeed', function () { seed.copySeed(); });
registerAction('applySeed', function () { seed.applySeed(); });
registerAction('testSleepAlarm', function () { testSleepAlarm(); });
registerAction('toggleGenerative', function () { toggleGenerative(this.checked); });
registerAction('updateGenerativeVariation', function () { updateGenerativeVariation(this.value); });
registerAction('generateNewVariation', function () { generateNewVariation(); });
registerAction('saveGenerativeVariation', function () { saveGenerativeVariation(); });
registerAction('resetGenerative', function () { resetGenerative(); });
registerAction('applyGenerativeSeed', function () { applyGenerativeSeed(); });
registerAction('toggleHelpBackdrop', function (e) { if (e.target === this) ui.toggleHelp(); });

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

// Initialize generative UI
initGenerativeUI();
window.updateGenerativeUIVisibility = updateGenerativeUIVisibility;
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


