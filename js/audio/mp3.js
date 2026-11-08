// @ts-nocheck
import { state } from '../state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from '../config.js';
import { initAudio } from './core.js';
import { startStems, stopStems } from './stems.js';
import { t } from '../i18n.js';

export async function loadStem(index, file) {
  if (!file) return;
  initAudio();
  const label = document.getElementById(`label${index}`);
  if (label) label.textContent = `Camada ${index + 1}: ${t('source.loading')}`;
  try {
    const buf = await file.arrayBuffer();
    state.audioCtx.decodeAudioData(buf, (decoded) => {
      state.stemBuffers[index] = decoded;
      if (label) label.textContent = `Camada ${index + 1}: ${file.name.slice(0, 14)}`;
      if (state.isPlaying && state.sourceMode === 'upload') startStems();
    }, () => {
      if (label) label.textContent = t('source.errorLoad');
    });
  } catch (e) {
    if (label) label.textContent = t('source.errorLoad');
  }
}

export async function loadWorldMp3(worldIdx, file) {
  if (!file) return;
  initAudio();
  const label = document.getElementById(`mp3Label_${worldIdx}`);
  if (label) label.textContent = t('source.loading');
  try {
    const buf = await file.arrayBuffer();
    state.audioCtx.decodeAudioData(buf, (decoded) => {
      state.worldMp3Buffers[worldIdx] = decoded;
      state.worldSources.mp3[worldIdx] = file.name;
      if (label) label.textContent = file.name.slice(0, 20);
      if (state.isPlaying && state.currentLevel === worldIdx &&
          state.worldSourceType[worldIdx] === 'mp3') {
        startMp3World();
      }
    }, () => {
      if (label) label.textContent = t('source.error');
    });
  } catch (e) {
    if (label) label.textContent = t('source.error');
  }
}

// --- Reprodução inteligente de MP3 (plano 2.9) ---
// Ao entrar/trocar de mundo a música NÃO recomeça do zero: escolhe-se uma
// âncora por energia (RMS por janelas de 1s) com aleatoriedade ponderada
// por menos-recentemente-usada. Ao chegar ao fim, a faixa não termina:
// com ~3s de antecedência salta para uma nova âncora com fade curto.
// ou sem envelope usam o comportamento antigo (loop do início).
const mp3Meta = new Map(); // worldIdx -> { buffer, anchors, used, jumpTimer, src, gain, curOffset }

// Calcula âncoras musicais do buffer (RMS por janelas de 1s; exporta para testes).
export function computeAnchors(buffer) {
  const sr = buffer.sampleRate;
  const data = buffer.getChannelData(0);
  const win = Math.floor(sr); // janela de 1s
  const nWin = Math.floor(data.length / win);
  if (nWin < 4) return [];
  const rms = new Float32Array(nWin);
  for (let w = 0; w < nWin; w++) {
    let sum = 0;
    const start = w * win;
    let n = 0;
    for (let i = start; i < start + win; i += 16) { sum += data[i] * data[i]; n++; }
    rms[w] = Math.sqrt(sum / Math.max(1, n));
  }
  let max = 0;
  for (let i = 0; i < nWin; i++) if (rms[i] > max) max = rms[i];
  if (max <= 0) return [];
  const thr = max * 0.25;
  const skipStart = Math.floor(nWin * 0.05); // ignora ~5% inicial
  const skipEnd = Math.ceil(nWin * 0.92);    // ignora ~8% final
  const anchors = [];
  for (let w = Math.max(1, skipStart); w < Math.min(skipEnd, nWin); w++) {
    if (rms[w] >= thr && rms[w - 1] < thr) anchors.push(w); // início de trecho musical
  }
  // Espaço mínimo de 5s entre âncoras; limite de 24 âncoras.
  const spaced = [];
  for (const w of anchors) {
    if (!spaced.length || (w - spaced[spaced.length - 1]) >= 5) spaced.push(w);
  }
  // Faixas contínuas têm poucos inícios claros: complementa com âncoras
  // uniformes (somente em janelas com energia) para circular a faixa toda.
  if (spaced.length < 6) {
    const start = Math.max(1, Math.floor(nWin * 0.05));
    const end = Math.min(nWin - 1, Math.ceil(nWin * 0.92));
    const span = Math.max(0, end - start);
    const count = Math.min(8, Math.max(3, Math.floor(span / 8)));
    const merged = spaced.slice();
    for (let k = 0; k < count; k++) {
      const w = start + Math.round((span * k) / count);
      if (rms[w] >= thr * 0.5) merged.push(w);
    }
    merged.sort((a, b) => a - b);
    const out = [];
    for (const w of merged) {
      if (!out.length || (w - out[out.length - 1]) >= 5) out.push(w);
    }
    return out.slice(0, 24);
  }
  return spaced.slice(0, 24);
}

// Escolhe a próxima âncora: entre as 4 menos usadas, uma aleatória
// (aleatório com lógica). avoidSec evita repetir o ponto atual.
function pickAnchor(idx, avoidSec) {
  const meta = mp3Meta.get(idx);
  if (!meta || !meta.anchors.length) return null;
  const order = meta.anchors.map((sec, i) => ({ i, sec, u: meta.used[i] || 0 }))
    .sort((a, b) => a.u - b.u);
  let pool = order.slice(0, Math.min(4, order.length));
  const filtered = pool.filter(c => Math.abs(c.sec - (avoidSec == null ? -999 : avoidSec)) > 1);
  pool = filtered.length ? filtered : pool;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  meta.used[chosen.i] = Date.now();
  return chosen.sec;
}

function startMp3Source(idx, offsetSec, smart) {
  const buf = state.worldMp3Buffers[idx];
  if (!buf || !state.audioCtx) return;
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const now = state.audioCtx.currentTime;
  const src = state.audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = !smart;
  src.playbackRate.value = speed;
  const gain = state.audioCtx.createGain();
  const vol = (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2;
  // Fade-in mais longo (200ms) para evitar clique no iOS
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(Math.max(0, vol), now + 0.25);
  src.connect(gain);
  gain.connect(state.masterFilter);
  const safeOffset = smart ? Math.max(0, Math.min(offsetSec, Math.max(0, buf.duration - 0.5))) : 0;
  // Tenta iniciar em zero-crossing para evitar clique
  src.start(now, safeOffset);
  src.onended = () => { try { gain.disconnect(); } catch (e) {} };
  state.worldMp3Sources[idx] = src;
  state.worldMp3Gains[idx] = gain;
  if (smart) {
    const meta = mp3Meta.get(idx);
    meta.src = src;
    meta.gain = gain;
    meta.curOffset = safeOffset;
    scheduleMp3Continue(idx, buf, safeOffset, speed);
  }
}

// Agenda o salto de fim de faixa: crossfade sobreposto (overlap) para evitar clique
function scheduleMp3Continue(idx, buf, offsetSec, speed) {
  const meta = mp3Meta.get(idx);
  if (!meta) return;
  if (meta.jumpTimer) clearTimeout(meta.jumpTimer);
  const remainingSec = Math.max(1, (buf.duration - offsetSec) / Math.max(0.1, speed));
  // Inicia o crossfade 4s antes do fim (overlap de 2s)
  const overlapSec = 2.0;
  const waitMs = Math.max(1000, (remainingSec - overlapSec) * 1000);
  meta.jumpTimer = setTimeout(() => {
    if (!state.isPlaying || state.worldMp3Sources[idx] !== meta.src) return;
    if (state.currentLevel !== idx || (state.worldSourceType[idx] !== 'mp3')) return;
    const nextOffset = pickAnchor(idx, meta.curOffset);
    if (nextOffset == null) return;
    // Crossfade sobreposto: inicia novo enquanto faz fade-out do antigo
    const now = state.audioCtx.currentTime;
    const oldGain = meta.gain;
    // Prepara novo source
    const nextBuf = state.worldMp3Buffers[idx];
    const nextSrc = state.audioCtx.createBufferSource();
    nextSrc.buffer = nextBuf;
    nextSrc.loop = false;
    nextSrc.playbackRate.value = parseFloat(document.getElementById('sliderSpeed').value);
    const nextGain = state.audioCtx.createGain();
    const vol = (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2;
    const safeOffset = Math.max(0, Math.min(meta.curOffset, Math.max(0, nextBuf.duration - 0.5)));
    nextSrc.connect(nextGain);
    nextGain.connect(state.masterFilter);
    // Fade-out do antigo (1.5s) + fade-in do novo (1.5s) = overlap de 1.5s
    const fadeDur = 1.5;
    const now2 = state.audioCtx.currentTime;
    // Fade-out do antigo
    try {
      oldGain.gain.cancelScheduledValues(now2);
      oldGain.gain.setValueAtTime(oldGain.gain.value, now2);
      oldGain.gain.linearRampToValueAtTime(0, now2 + fadeDur);
    } catch (e) {}
    // Fade-in do novo (começa do zero)
    nextGain.gain.setValueAtTime(0, now2);
    nextGain.gain.linearRampToValueAtTime(
      (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2,
      now2 + fadeDur
    );
    // Inicia novo source
    const safeNextOffset = Math.max(0, Math.min(nextOffset, Math.max(0, nextBuf.duration - 0.5)));
    nextSrc.start(now2, safeNextOffset);
    // Para o antigo após o fade
    setTimeout(() => {
      try { meta.src.stop(); } catch (e) {}
      try { oldGain.disconnect(); } catch (e) {}
    }, (fadeDur + 0.1) * 1000);
    // Atualiza meta
    meta.src = nextSrc;
    meta.gain = nextGain;
    meta.curOffset = safeNextOffset;
    // Agenda próximo salto
    scheduleMp3Continue(idx, nextBuf, safeNextOffset, parseFloat(document.getElementById('sliderSpeed').value));
  }, waitMs);
}

export function startMp3World() {
  stopMp3World(state.currentLevel, 80);
  const idx = state.currentLevel;
  const buf = state.worldMp3Buffers[idx];
  if (!buf || !state.audioCtx) return;
  // Âncoras calculadas uma única vez por buffer (lazy, no primeiro play).
  let meta = mp3Meta.get(idx);
  if (!meta || meta.buffer !== buf) {
    let anchors = [];
    try { anchors = (buf.duration >= 20) ? computeAnchors(buf) : []; } catch (e) { anchors = []; }
    meta = { buffer: buf, anchors, used: {}, jumpTimer: null, src: null, gain: null, curOffset: 0 };
    mp3Meta.set(idx, meta);
  }
  const smart = meta.anchors.length > 0;
  const offset = smart ? (pickAnchor(idx) || 0) : 0;
  startMp3Source(idx, offset, smart);
}

// worldIdx opcional: por padrão aplica ao mundo atual (compatibilidade).

export function stopMp3World(index, fadeMs = 300) {
  const idx = (index === undefined) ? state.currentLevel : index;
  const meta = mp3Meta.get(idx);
  if (meta) {
    if (meta.jumpTimer) { clearTimeout(meta.jumpTimer); meta.jumpTimer = null; }
    meta.src = null;
    meta.gain = null;
  }
  const src = state.worldMp3Sources[idx];
  if (!src) return;
  const gain = state.worldMp3Gains ? state.worldMp3Gains[idx] : null;
  state.worldMp3Sources[idx] = null;
  if (gain && state.audioCtx) {
    state.worldMp3Gains[idx] = null;
    const now = state.audioCtx.currentTime;
    try {
      const p = gain.gain;
      p.cancelScheduledValues(now);
      p.setValueAtTime(p.value, now);
      p.linearRampToValueAtTime(0, now + fadeMs / 1000);
    } catch (e) {}
    setTimeout(() => {
      try { src.stop(); } catch (e) {}
      try { gain.disconnect(); } catch (e) {}
    }, fadeMs + 50);
  } else {
    try { src.stop(); } catch (e) {}
  }
}

export function stopAllMp3World() {
  for (let i = 0; i < WORLD_NAMES.length; i++) stopMp3World(i);
}

export function setWorldMp3Volume(worldIdx, val) {
  setWorldVolume(worldIdx, val);
}

// Aplica volume por mundo: synth, MP3 e YouTube.

export function crossfadeMp3Worlds(fromIdx, toIdx) {
  const fromMeta = mp3Meta.get(fromIdx);
  const fromSrc = state.worldMp3Sources[fromIdx];
  const fromGain = state.worldMp3Gains ? state.worldMp3Gains[fromIdx] : null;
  const toBuf = state.worldMp3Buffers[toIdx];
  if (!fromSrc || !fromGain || !toBuf || !state.audioCtx) {
    // Fallback se não tiver tudo
    stopMp3World(fromIdx);
    startMp3World();
    return;
  }

  const fadeDur = 2.0; // 2s de crossfade

  // Prepara novo source
  const toSrc = state.audioCtx.createBufferSource();
  toSrc.buffer = toBuf;
  toSrc.loop = false;
  toSrc.playbackRate.value = parseFloat(document.getElementById('sliderSpeed').value);
  const toGain = state.audioCtx.createGain();
  const vol = (state.worldVolume && state.worldVolume[toIdx] != null) ? state.worldVolume[toIdx] : 0.2;

  // Obtém âncora para o novo mundo
  const toMeta = mp3Meta.get(toIdx);
  let toOffset = 0;
  if (toMeta && toMeta.anchors && toMeta.anchors.length > 0) {
    toOffset = pickAnchor(toIdx) || 0;
  }
  const safeOffset = Math.max(0, Math.min(toOffset, Math.max(0, toBuf.duration - 0.5)));

  toSrc.buffer = toBuf;
  toSrc.loop = false;
  toSrc.playbackRate.value = parseFloat(document.getElementById('sliderSpeed').value);
  toSrc.connect(toGain);
  toGain.connect(state.masterFilter);

  // Crossfade: fade-out antigo + fade-in novo (overlap)
  try {
    fromGain.gain.cancelScheduledValues(state.audioCtx.currentTime);
    fromGain.gain.setValueAtTime(fromGain.gain.value, state.audioCtx.currentTime);
    fromGain.gain.linearRampToValueAtTime(0, state.audioCtx.currentTime + 2.0);
  } catch (e) {}
  toGain.gain.setValueAtTime(0, state.audioCtx.currentTime);
  toGain.gain.linearRampToValueAtTime(
    (state.worldVolume && state.worldVolume[toIdx] != null) ? state.worldVolume[toIdx] : 0.2,
    state.audioCtx.currentTime + 2.0
  );

  toSrc.start(now, safeOffset);
  toMeta.src = toSrc;
  toMeta.gain = toGain;
  toMeta.curOffset = safeOffset;

  // Para o antigo após fade
  setTimeout(() => {
    try { fromSrc.stop(); } catch (e) {}
    try { fromGain.disconnect(); } catch (e) {}
    mp3Meta.get(fromIdx).src = null;
    mp3Meta.get(fromIdx).gain = null;
  }, 2100);

  // Agenda próximo salto para o novo mundo
  scheduleMp3Continue(toIdx, toBuf, safeOffset, parseFloat(document.getElementById('sliderSpeed').value));
}

// Reinicia a fonte do mundo atual respeitando o tipo escolhido.
