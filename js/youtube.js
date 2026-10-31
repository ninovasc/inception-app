import { state } from './state.js';

const players = [null, null, null];
const ready = [false, false, false];
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
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
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
  // destroy previous
  if (players[index]) {
    try { players[index].destroy(); } catch (e) {}
    players[index] = null;
    ready[index] = false;
  }
  setLabel(index, 'Carregando...');
  const create = () => {
    const container = document.getElementById(`ytPlayer${index}`);
    if (!container) return;
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
          try { e.target.setVolume(Math.round(parseFloat(document.getElementById(`ytVol${index}`)?.value || 0.3) * 100)); } catch (err) {}
          setLabel(index, `YouTube ${index + 1}: ${id}`);
          if (state.isPlaying && state.sourceMode === 'youtube') {
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

export function startYouTube() {
  for (let i = 0; i < 3; i++) {
    if (players[i] && ready[i]) {
      try { players[i].playVideo(); } catch (e) {}
    }
  }
  const rate = parseFloat(document.getElementById('sliderSpeed')?.value || 1);
  setYouTubeRate(rate);
}

export function stopYouTube() {
  for (let i = 0; i < 3; i++) {
    if (players[i] && ready[i]) {
      try { players[i].pauseVideo(); } catch (e) {}
    }
  }
}

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
  for (let i = 0; i < 3; i++) {
    if (players[i] && ready[i]) {
      try { players[i].setPlaybackRate(rate); } catch (e) {}
    }
  }
}

export function hasYouTube() {
  return players.some((p, i) => p && ready[i]);
}
