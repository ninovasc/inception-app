import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, LUCID_MODES, YOUTUBE_ENABLED, normalizeSourceType, TRIGGER_DEFS, WORLD_NAMES, normalizeWorldTriggers } from './config.js';
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
  syncMechanicsUI: mechanics.syncMechanicsUI,
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
  toggleAutoMode: auto.toggleAutoMode,
  setWorldTrigger: (key, value) => setWorldTrigger(key, value),
  setWorldTriggerMotion: (value) => setWorldTriggerMotion(value),
  setWorldTriggerSilence: (value) => setWorldTriggerSilence(value)
});

// Ao iniciar o sonho, ativa as mecânicas padrão (permissões exigem gesto).
const baseToggleMasterPlay = audio.toggleMasterPlay;
window.toggleMasterPlay = function() {
  if (!state.isPlaying) mechanics.activateDreamDefaults();
  return baseToggleMasterPlay();
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

// --- Gatilhos de Mundo (Modo Automático) ---
function triggerOptions(current, allowOff) {
  const off = allowOff
    ? `<option value="-1" ${current === -1 ? 'selected' : ''}>— desativado</option>`
    : '';
  return off + WORLD_NAMES.map((name, i) =>
    `<option value="${i}" ${current === i ? 'selected' : ''}>${i}. ${name}</option>`
  ).join('');
}

function renderTriggerList() {
  const container = document.getElementById('triggerList');
  if (!container) return;
  if (!state.worldTriggers) state.worldTriggers = normalizeWorldTriggers(null);
  const t = state.worldTriggers;
  container.innerHTML = TRIGGER_DEFS.map((def, i) => {
    const current = (t[def.key] != null) ? t[def.key] : -1;
    const allowOff = def.key !== 'fallback';
    return `
      <div style="display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px solid #151515;">
        <span style="font-size:0.62rem; color:var(--muted); font-family:monospace; width:14px;">${i + 1}</span>
        <span style="font-size:0.7rem; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${def.label}</span>
        <select onchange="setWorldTrigger('${def.key}', this.value)" aria-label="${def.label}" style="background:#0a0a0a; border:1px solid var(--border); color:#fff; padding:4px 6px; font-size:0.68rem; border-radius:6px; max-width:130px;">
          ${triggerOptions(current, allowOff)}
        </select>
      </div>
    `;
  }).join('');

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
  if (state.autoMode && state.isPlaying) auto.evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

function setWorldTriggerMotion(value) {
  const v = parseFloat(value);
  if (isNaN(v)) return;
  state.triggerMotion = Math.max(0, Math.min(1, v));
  const el = document.getElementById('triggerMotionVal');
  if (el) el.textContent = Math.round(state.triggerMotion * 100) + '%';
  if (state.autoMode && state.isPlaying) auto.evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

function setWorldTriggerSilence(value) {
  const v = parseInt(value, 10);
  if (isNaN(v)) return;
  state.triggerSilenceSec = Math.max(5, Math.min(300, v));
  const el = document.getElementById('triggerSilenceVal');
  if (el) el.textContent = state.triggerSilenceSec + 's';
  if (state.autoMode && state.isPlaying) auto.evaluateAutoMode();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

renderSourceList();
renderTriggerList();
mechanics.syncMechanicsUI();
auto.startAutoMode();

// Initial seed
seed.generateFullSeed(true);
