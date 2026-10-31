import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES } from './config.js';
import * as audio from './audio.js';
import * as sensors from './sensors.js';
import * as mechanics from './mechanics.js';
import * as seed from './seed.js';
import * as ui from './ui.js';
import './power.js';
import * as yt from './youtube.js';

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
  triggerKick: audio.triggerKick,
  toggleMic: sensors.toggleMic,
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
  generateFullSeed: seed.generateFullSeed,
  copySeed: seed.copySeed,
  applySeed: seed.applySeed,
  togglePanel: ui.togglePanel,
  handleXYMove: ui.handleXYMove,
  toggleHelp: ui.toggleHelp,
  startYouTube: yt.startYouTube,
  stopYouTube: yt.stopYouTube,
  setYouTubeRate: yt.setYouTubeRate,
  loadYouTube: yt.loadYouTube,
  setYouTubeVolume: yt.setYouTubeVolume
});

// Wire X/Y pad
const xyPad = document.getElementById('xyPad');
let isDragging = false;
xyPad.addEventListener('pointerdown', (e) => { isDragging = true; xyPad.setPointerCapture(e.pointerId); ui.handleXYMove(e.clientX, e.clientY); });
window.addEventListener('pointermove', (e) => { if (isDragging) ui.handleXYMove(e.clientX, e.clientY); });
window.addEventListener('pointerup', () => { isDragging = false; });
window.addEventListener('pointercancel', () => { isDragging = false; });

// Deprivation checker interval registration is handled inside toggle; but interval callback needs global
// Ensure checkSensoryDeprivation runs if watch on (interval already set in toggle). Nothing extra.

// Service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Try to lock orientation to portrait (PWA)
try {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('portrait').catch(() => {});
  }
} catch (e) {}

// Init YouTube API
yt.initYouTube();

// Initial seed
seed.generateFullSeed();

// Prevent default touch behaviors on pad
xyPad.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
