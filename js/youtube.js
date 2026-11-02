import { state } from './state.js';
import { WORLD_COUNT } from './config.js';

const players = Array(WORLD_COUNT).fill(null);
const ready = Array(WORLD_COUNT).fill(false);
const playerIds = Array(WORLD_COUNT).fill('');
let apiLoaded = false;
let apiReady = false;
const pending = [];

function loadApi() {
  if (apiLoaded) return;
  apiLoaded = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    pending.forEach(fn => fn());
    pending.length = 0;
  };
}

function extractId(url) {
  if (!url) return null;
  const m = String(url).trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function worldVolume(index) {
  return (state.worldVolume && state.worldVolume[index] != null) ? state.worldVolume[index] : 0.2;
}

export function initYouTube() {
  loadApi();
}

export function loadYouTube(index, url) {
  loadApi();
  const id = extractId(url);
  if (!id) {
    setLabel(index, 'Link inválido');
    return;
  }

  // Guarda o vínculo do mundo (fonte da verdade para a seed e para o play).
  if (!state.worldSources.youtube) state.worldSources.youtube = ['', '', '', '', '', ''];
  state.worldSources.youtube[index] = id;

  // Já existe um player pronto para este vídeo: não recria.
  if (players[index] && playerIds[index] === id && ready[index]) {
    setLabel(index, `YouTube: ${id}`);
    return;
  }

  if (players[index]) {
    try { players[index].destroy(); } catch (e) {}
    players[index] = null;
    ready[index] = false;
  }
  playerIds[index] = id;
  setLabel(index, 'Carregando...');

  const create = () => {
    const container = document.getElementById(`ytPlayer${index}`);
    if (!container) {
      setLabel(index, 'Player indisponível');
      return;
    }
    container.innerHTML = '';
    players[index] = new YT.Player(container, {
      videoId: id,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        loop: 1,
        playlist: id
      },
      events: {
        onReady: (e) => {
          ready[index] = true;
          try { e.target.setVolume(Math.round(worldVolume(index) * 100)); } catch (err) {}
          setLabel(index, id);
          const isCurrentYouTube = state.isPlaying &&
            state.currentLevel === index &&
            state.worldSourceType[index] === 'youtube';
          if (isCurrentYouTube) {
            try { e.target.playVideo(); } catch (err) {}
          }
        },
        onStateChange: () => {}
      }
    });
  };
  if (apiReady) create();
  else pending.push(create);
}

function setLabel(index, text) {
  const el = document.getElementById(`ytLabel${index}`);
  if (el) el.textContent = text;
}

export function startYouTubeWorld() {
  const idx = state.currentLevel;
  const storedId = state.worldSources && state.worldSources.youtube && state.worldSources.youtube[idx];

  // Player ainda não criado, mas existe link salvo: cria (o onReady inicia).
  if (!players[idx] && storedId) {
    loadYouTube(idx, `https://youtu.be/${storedId}`);
    return;
  }

  const p = players[idx];
  if (!p || !ready[idx]) return;
  try { p.setVolume(Math.round(worldVolume(idx) * 100)); } catch (e) {}
  try { p.playVideo(); } catch (e) {}
  const rate = parseFloat(document.getElementById('sliderSpeed')?.value || 1);
  try { p.setPlaybackRate(rate); } catch (e) {}
}

export function stopYouTubeWorld(index) {
  const idx = (index === undefined) ? state.currentLevel : index;
  const p = players[idx];
  if (p && ready[idx]) {
    try { p.pauseVideo(); } catch (e) {}
  }
}

export function stopAllYouTubeWorld() {
  for (let i = 0; i < WORLD_COUNT; i++) stopYouTubeWorld(i);
}

// legacy wrappers
export function startYouTube() { startYouTubeWorld(); }
export function stopYouTube() { stopYouTubeWorld(); }

export function setYouTubeVolume(index, val) {
  const v = parseFloat(val);
  const el = document.getElementById(`ytVolVal${index}`);
  if (el) el.textContent = Math.round(v * 100) + '%';
  if (players[index] && ready[index]) {
    try { players[index].setVolume(Math.round(v * 100)); } catch (e) {}
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setYouTubeRate(rate) {
  for (let i = 0; i < 6; i++) {
    if (players[i] && ready[i]) {
      try { players[i].setPlaybackRate(rate); } catch (e) {}
    }
  }
}

export function hasYouTube() {
  return players.some((p, i) => p && ready[i]);
}
