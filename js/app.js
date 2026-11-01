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
import * as auto from './automode.js';

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
  autoResizeSeed: ui.autoResizeSeed,
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

// Render source list (vertical, one world at a time expanded)
let activeSourceWorld = 0;

function renderSourceList() {
  const container = document.getElementById('sourceList');
  if (!container) return;
  const worlds = ['Realidade', 'Chuva', 'Hotel', 'Fortaleza', 'Limbo', 'Lúcido'];
  const synthNames = ['Zimmer Ambient', 'Brass Drone', 'Sub Limbo', 'Glass Choir', 'Binaural Pulse'];
  container.innerHTML = worlds.map((w, i) => {
    const type = (state.worldSourceType && state.worldSourceType[i]) || 'synth';
    const vol = (state.worldVolume && state.worldVolume[i]) || 0.2;
    const synthIdx = (state.worldSynth && state.worldSynth[i]) || 0;
    const expanded = i === activeSourceWorld;
    let controls = '';
    if (expanded) {
      if (type === 'synth') {
        controls = `
          <div style="margin-top:6px;">
            <select onchange="setWorldSynth(${i}, this.value)" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:6px 8px;font-size:0.72rem;border-radius:6px;width:100%;margin-bottom:4px;">
              ${synthNames.map((n, j) => `<option value="${j}" ${j === synthIdx ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.65rem; color:var(--muted);">Vol</span>
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolumeIdx(${i}, this.value)">
              <span style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
            </div>
          </div>
        `;
      } else if (type === 'mp3') {
        const label = state.worldSources && state.worldSources.mp3 && state.worldSources.mp3[i] ? state.worldSources.mp3[i].slice(0,20) : '[Selecionar MP3]';
        controls = `
          <div style="margin-top:6px;">
            <label class="file-btn" for="mp3File${i}" style="margin:0; padding:6px 8px; font-size:0.7rem;">
              <span id="mp3Label${i}">${label}</span><span>📁</span>
            </label>
            <input type="file" id="mp3File${i}" accept="*" onchange="loadWorldMp3(${i}, this.files[0])" style="display:none;">
            <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
              <span style="font-size:0.65rem; color:var(--muted);">Vol</span>
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolumeIdx(${i}, this.value)">
              <span style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
            </div>
          </div>
        `;
      } else if (type === 'youtube') {
        const url = state.worldSources && state.worldSources.youtube && state.worldSources.youtube[i] ? 'https://youtu.be/' + state.worldSources.youtube[i] : '';
        const label = state.worldSources && state.worldSources.youtube && state.worldSources.youtube[i] ? state.worldSources.youtube[i] : '[sem link]';
        controls = `
          <div style="margin-top:6px;">
            <input type="text" id="ytUrl${i}" placeholder="Link YouTube" value="${url}" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:6px 8px;font-size:0.72rem;border-radius:6px;width:100%;margin-bottom:4px;" onchange="loadYouTube(${i}, this.value)">
            <div style="font-size:0.65rem;color:var(--muted);font-family:monospace;margin-bottom:4px;" id="ytLabel${i}">${label}</div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.65rem; color:var(--muted);">Vol</span>
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolumeIdx(${i}, this.value)">
              <span style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
            </div>
          </div>
        `;
      }
    }
    return `
      <div style="border-bottom:1px solid var(--border); padding:8px 0;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
          <button class="menu-item" onclick="toggleSourceRow(${i})" style="flex:0 0 auto; background:none; border:none; color:var(--muted); font-size:0.7rem; padding:0; cursor:pointer;">${expanded ? '▼' : '▶'}</button>
          <span style="font-size:0.75rem; font-weight:600; flex:1;">${w}</span>
          <div style="display:flex; gap:2px;">
            <button class="src-type-btn ${type==='synth'?'active':''}" onclick="setWorldSourceType(${i},'synth')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='synth'?'#fff':'transparent'}; color:${type==='synth'?'#000':'#888'}; border-radius:4px; cursor:pointer;">Synth</button>
            <button class="src-type-btn ${type==='mp3'?'active':''}" onclick="setWorldSourceType(${i},'mp3')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='mp3'?'#fff':'transparent'}; color:${type==='mp3'?'#000':'#888'}; border-radius:4px; cursor:pointer;">MP3</button>
            <button class="src-type-btn ${type==='youtube'?'active':''}" onclick="setWorldSourceType(${i},'youtube')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='youtube'?'#fff':'transparent'}; color:${type==='youtube'?'#000':'#888'}; border-radius:4px; cursor:pointer;">YT</button>
          </div>
        </div>
        ${expanded ? controls : ''}
      </div>
    `;
  }).join('');
}

window.toggleSourceRow = function(idx) {
  activeSourceWorld = idx;
  renderSourceList();
};

window.setWorldSourceType = function(worldIdx, type) {
  if (!state.worldSourceType) state.worldSourceType = ['synth','synth','synth','synth','synth','synth'];
  state.worldSourceType[worldIdx] = type;
  activeSourceWorld = worldIdx;
  renderSourceList();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
};

// override selectWorldTab to use new render
window.selectWorldTab = function(idx) {
  activeSourceWorld = idx;
  renderSourceList();
};

renderSourceList();

// Initial seed
seed.generateFullSeed();

// Per-world source state
window.currentWorldTab = 0;

function renderWorldSource(worldIdx) {
  const container = document.getElementById('worldSourceContent');
  if (!container) return;
  const type = (state.worldSourceType && state.worldSourceType[worldIdx]) || 'synth';
  const vol = (state.worldVolume && state.worldVolume[worldIdx]) || 0.2;
  const synthIdx = (state.worldSynth && state.worldSynth[worldIdx]) || 0;
  const synthNames = ['Zimmer Ambient', 'Brass Drone', 'Sub Limbo', 'Glass Choir', 'Binaural Pulse'];
  let html = '';
  if (type === 'synth') {
    html = `
      <div class="slider-group">
        <div class="slider-header"><span>Sintetizador</span></div>
        <select id="worldSynthSelect" onchange="setWorldSynth(${worldIdx}, this.value)" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:6px 8px;font-size:0.72rem;border-radius:6px;width:100%;">
          ${synthNames.map((n, i) => `<option value="${i}" ${i === synthIdx ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
      </div>
      <div class="slider-group">
        <div class="slider-header"><span>Volume</span><span id="worldVolVal${worldIdx}">${Math.round(vol * 100)}%</span></div>
        <input type="range" id="worldVol${worldIdx}" min="0" max="1" step="0.05" value="${vol}" oninput="setWorldVolumeIdx(${worldIdx}, this.value)">
      </div>
    `;
  } else if (type === 'mp3') {
    html = `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
        <label class="file-btn" for="mp3File${worldIdx}" style="flex:1; margin:0; padding:6px 8px; font-size:0.7rem;">
          <span id="mp3Label${worldIdx}">[Selecionar MP3]</span><span>📁</span>
        </label>
        <input type="file" id="mp3File${worldIdx}" accept="*" onchange="loadWorldMp3(${worldIdx}, this.files[0])" style="display:none;">
      </div>
      <div class="slider-group">
        <div class="slider-header"><span>Volume</span><span id="worldVolVal${worldIdx}">${Math.round(vol * 100)}%</span></div>
        <input type="range" id="worldVol${worldIdx}" min="0" max="1" step="0.05" value="${vol}" oninput="setWorldVolumeIdx(${worldIdx}, this.value)">
      </div>
    `;
  } else if (type === 'youtube') {
    html = `
      <input type="text" id="ytUrl${worldIdx}" placeholder="Link YouTube" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:8px 10px;font-size:0.72rem;border-radius:6px;width:100%;margin-bottom:4px;" onchange="loadYouTube(${worldIdx}, this.value)">
      <div style="font-size:0.65rem;color:var(--muted);font-family:monospace;margin-bottom:4px;" id="ytLabel${worldIdx}">[sem link]</div>
      <div class="slider-group">
        <div class="slider-header"><span>Volume</span><span id="worldVolVal${worldIdx}">${Math.round(vol * 100)}%</span></div>
        <input type="range" id="worldVol${worldIdx}" min="0" max="1" step="0.05" value="${vol}" oninput="setWorldVolumeIdx(${worldIdx}, this.value)">
      </div>
    `;
  }
  container.innerHTML = html;
  // restore mp3 label if file loaded
  if (type === 'mp3' && state.worldSources.mp3[worldIdx]) {
    const label = document.getElementById(`mp3Label${worldIdx}`);
    if (label) label.textContent = state.worldSources.mp3[worldIdx].slice(0, 20);
  }
  if (type === 'youtube' && state.worldSources.youtube[worldIdx]) {
    const input = document.getElementById(`ytUrl${worldIdx}`);
    if (input) input.value = 'https://youtu.be/' + state.worldSources.youtube[worldIdx];
    const label = document.getElementById(`ytLabel${worldIdx}`);
    if (label) label.textContent = state.worldSources.youtube[worldIdx];
  }
}

window.selectWorldTab = function(idx) {
  window.currentWorldTab = idx;
  document.querySelectorAll('.world-tab').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
    b.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
  });
  // update type buttons
  const type = (state.worldSourceType && state.worldSourceType[idx]) || 'synth';
  document.querySelectorAll('.src-type').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
    b.setAttribute('aria-pressed', b.dataset.type === type ? 'true' : 'false');
  });
  renderWorldSource(idx);
};

window.setWorldSourceType = function(worldIdx, type) {
  if (!state.worldSourceType) state.worldSourceType = ['synth','synth','synth','synth','synth','synth'];
  state.worldSourceType[worldIdx] = type;
  // update type buttons
  document.querySelectorAll('.src-type').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
    b.setAttribute('aria-pressed', b.dataset.type === type ? 'true' : 'false');
  });
  renderWorldSource(worldIdx);
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
};

window.setWorldSynth = function(worldIdx, val) {
  if (!state.worldSynth) state.worldSynth = [0,1,2,3,4,0];
  state.worldSynth[worldIdx] = parseInt(val, 10);
  if (worldIdx === state.currentLevel && state.sourceMode === 'synth') {
    audio.startSynth();
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
};

window.setWorldVolumeIdx = function(worldIdx, val) {
  const v = parseFloat(val);
  if (!state.worldVolume) state.worldVolume = [0.2,0.2,0.2,0.2,0.2,0.2];
  state.worldVolume[worldIdx] = v;
  const el = document.getElementById(`worldVolVal${worldIdx}`);
  if (el) el.textContent = Math.round(v * 100) + '%';
  if (worldIdx === state.currentLevel && state.sourceMode === 'upload') {
    const gain = state.worldMp3Gains[worldIdx];
    if (gain) gain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
};

// render initial
renderWorldSource(0);

// Initial seed
seed.generateFullSeed();
