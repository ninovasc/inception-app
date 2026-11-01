import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES, YOUTUBE_ENABLED, normalizeSourceType } from './config.js';
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
  stopAllYouTubeWorld: yt.stopAllYouTubeWorld,
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
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolume(${i}, this.value)">
              <span id="worldVolVal${i}" style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
            </div>
          </div>
        `;
      } else if (type === 'mp3') {
        const label = state.worldSources && state.worldSources.mp3 && state.worldSources.mp3[i] ? state.worldSources.mp3[i].slice(0,20) : '[Selecionar MP3]';
        controls = `
          <div style="margin-top:6px;">
            <label class="file-btn" for="mp3File${i}" style="margin:0; padding:6px 8px; font-size:0.7rem;">
              <span id="mp3Label${i}">${escapeHtml(label)}</span><span>📁</span>
            </label>
            <input type="file" id="mp3File${i}" accept="*" onchange="loadWorldMp3(${i}, this.files[0])" style="display:none;">
            <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
              <span style="font-size:0.65rem; color:var(--muted);">Vol</span>
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolume(${i}, this.value)">
              <span id="worldVolVal${i}" style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
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
              <input type="range" min="0" max="1" step="0.05" value="${vol}" style="flex:1;" oninput="setWorldVolume(${i}, this.value)">
              <span id="worldVolVal${i}" style="font-size:0.65rem; color:#fff; font-family:monospace; min-width:28px;">${Math.round(vol*100)}%</span>
            </div>
          </div>
        `;
      }
    }
    return `
      <div style="border-bottom:1px solid var(--border); padding:8px 0;">
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; flex-wrap:wrap;">
          <button onclick="toggleSourceRow(${i})" aria-label="${expanded ? 'Recolher' : 'Expandir'} ${w}" aria-expanded="${expanded}" style="flex:0 0 auto; width:20px; background:none; border:none; color:var(--muted); font-size:0.7rem; padding:0; cursor:pointer; line-height:1;">${expanded ? '▼' : '▶'}</button>
          <span style="font-size:0.75rem; font-weight:600; flex:1 1 60px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${w}</span>
          <div style="display:flex; gap:2px; flex-shrink:0;">
            <button class="src-type-btn ${type==='synth'?'active':''}" onclick="setWorldSourceType(${i},'synth')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='synth'?'#fff':'transparent'}; color:${type==='synth'?'#000':'#888'}; border-radius:4px; cursor:pointer;">Synth</button>
            <button class="src-type-btn ${type==='mp3'?'active':''}" onclick="setWorldSourceType(${i},'mp3')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='mp3'?'#fff':'transparent'}; color:${type==='mp3'?'#000':'#888'}; border-radius:4px; cursor:pointer;">MP3</button>
            ${YOUTUBE_ENABLED ? `<button class="src-type-btn ${type==='youtube'?'active':''}" onclick="setWorldSourceType(${i},'youtube')" style="font-size:0.6rem; padding:2px 6px; border:1px solid var(--border); background:${type==='youtube'?'#fff':'transparent'}; color:${type==='youtube'?'#000':'#888'}; border-radius:4px; cursor:pointer;">YT</button>` : ''}
          </div>
        </div>
        ${expanded ? controls : ''}
      </div>
    `;
  }).join('');
}

function syncSourceRow(idx) {
  activeSourceWorld = idx;
  renderSourceList();
}

window.renderSourceList = renderSourceList;
window.syncSourceRow = syncSourceRow;

window.toggleSourceRow = function(idx) {
  activeSourceWorld = (activeSourceWorld === idx) ? -1 : idx;
  renderSourceList();
};

window.selectWorldTab = function(idx) {
  window.currentWorldTab = idx;
  syncSourceRow(idx);
};

// Compatibilidade
window.currentWorldTab = 0;

window.setWorldSourceType = function(worldIdx, type) {
  if (!['synth', 'mp3', 'youtube'].includes(type)) return;
  // YouTube desativado: ignora qualquer chamada (inclusive links antigos).
  if (type === 'youtube' && !YOUTUBE_ENABLED) return;
  if (!state.worldSourceType) state.worldSourceType = ['synth', 'synth', 'synth', 'synth', 'synth', 'synth'];
  state.worldSourceType[worldIdx] = type;
  activeSourceWorld = worldIdx;

  if (worldIdx === state.currentLevel) {
    state.sourceMode = type;
    audio.restartWorldAudio();
  }

  // Garante que o player do YouTube exista quando há um link salvo.
  if (type === 'youtube' && window.loadYouTube) {
    const id = state.worldSources && state.worldSources.youtube && state.worldSources.youtube[worldIdx];
    if (id) window.loadYouTube(worldIdx, `https://youtu.be/${id}`);
  }

  renderSourceList();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
};

renderSourceList();

// Initial seed
seed.generateFullSeed(true);
