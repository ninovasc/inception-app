import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES } from './config.js';
import * as audio from './audio.js';
import * as sensors from './sensors.js';
import * as mechanics from './mechanics.js';
import * as seed from './seed.js';
import * as ui from './ui.js';
import './power.js';
import * as yt from './youtube.js';
import * as cap from './capture.js';
import * as auto from './auto.js';

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
  generateFullSeed: seed.generateFullSeed,
  copySeed: seed.copySeed,
  applySeed: seed.applySeed,
  togglePanel: ui.togglePanel,
  handleXYMove: ui.handleXYMove,
  toggleHelp: ui.toggleHelp,
  startYouTube: yt.startYouTube,
  stopYouTube: yt.stopYouTube,
  startYouTubeWorld: yt.startYouTubeWorld,
  stopYouTubeWorld: yt.stopYouTubeWorld,
  setYouTubeRate: yt.setYouTubeRate,
  loadYouTube: yt.loadYouTube,
  loadWorldMp3: audio.loadWorldMp3,
  setYouTubeVolume: yt.setYouTubeVolume,
  setWorldMp3Volume: audio.setWorldMp3Volume,
  startCapture: cap.startCapture,
  stopCapture: cap.stopCapture,
  setCaptureVolume: cap.setCaptureVolume,
  toggleAutoMode: () => {
    if (auto.isAutoMode()) {
      auto.stopAutoMode();
      document.getElementById('btnAutoMode')?.classList.remove('active');
      document.getElementById('btnAutoMode')?.setAttribute('aria-pressed', 'false');
      const sub = document.getElementById('autoSub');
      if (sub) sub.textContent = 'OFF';
    } else {
      auto.startAutoMode();
      document.getElementById('btnAutoMode')?.classList.add('active');
      document.getElementById('btnAutoMode')?.setAttribute('aria-pressed', 'true');
      const sub = document.getElementById('autoSub');
      if (sub) sub.textContent = 'ON';
    }
  }
});

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

// Desabilitar presets de voz inicialmente (mic off)
document.querySelectorAll('.mic-preset, #voicePanel input[type=range]').forEach(el => {
  el.style.opacity = '0.4';
  el.setAttribute('disabled', 'true');
});

// Render per-world source inputs
function renderWorldSources() {
  const worlds = ['Realidade', 'Chuva', 'Hotel', 'Fortaleza', 'Limbo', 'Lúcido'];
  const mp3Container = document.getElementById('mp3Worlds');
  const ytContainer = document.getElementById('ytWorlds');
  if (mp3Container) {
    mp3Container.innerHTML = worlds.map((w, i) => `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <span style="font-size:0.7rem; color:var(--muted); width:70px;">${w}</span>
        <label class="file-btn" for="mp3File${i}" style="flex:1; margin:0; padding:6px 8px; font-size:0.7rem;">
          <span id="mp3Label${i}">[Selecionar MP3]</span><span>📁</span>
        </label>
        <input type="file" id="mp3File${i}" accept="*" onchange="loadWorldMp3(${i}, this.files[0])" style="display:none;">
        <input type="range" id="mp3Vol${i}" min="0" max="1" step="0.05" value="0.20" style="width:60px;" oninput="setWorldMp3Volume(${i}, this.value)">
      </div>
    `).join('');
  }
  if (ytContainer) {
    ytContainer.innerHTML = worlds.map((w, i) => `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <span style="font-size:0.7rem; color:var(--muted); width:70px;">${w}</span>
        <input type="text" id="ytUrl${i}" placeholder="Link YouTube" style="flex:1; background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:6px 8px;font-size:0.7rem;border-radius:6px;" onchange="loadYouTube(${i}, this.value)">
        <input type="range" id="ytVol${i}" min="0" max="1" step="0.05" value="0.30" style="width:60px;" oninput="setYouTubeVolume(${i}, this.value)">
      </div>
    `).join('');
  }
}
renderWorldSources();

// Initial seed
seed.generateFullSeed();
