import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from './config.js';

// Índices de mundos especiais (evita hardcodes)
const WAITING_FOR_TRAIN_IDX = WORLD_NAMES.indexOf('Waiting for a Train'); // 9
const HALF_REMEMBERED_DREAM_IDX = WORLD_NAMES.indexOf('Half Remembered Dream'); // 0

export function initAudio() {
  if (state.audioCtx) {
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  // 'playback' usa buffers maiores: evita estalos/queda de áudio no celular.
  try {
    state.audioCtx = new AudioCtx({ latencyHint: 'playback' });
  } catch (e) {
    state.audioCtx = new AudioCtx();
  }

  state.masterFilter = state.audioCtx.createBiquadFilter();
  state.masterFilter.type = 'lowpass';
  state.masterFilter.frequency.value = 18000;

  // Delay estéreo: left e right com tempos diferentes.
  // O slider controla a quantidade de eco (wet); o feedback fica fixo e seguro.
  state.delayLeft = state.audioCtx.createDelay(5.0);
  state.delayLeft.delayTime.value = 0.35;
  state.delayRight = state.audioCtx.createDelay(5.0);
  state.delayRight.delayTime.value = 0.50;
  state.delayWet = state.audioCtx.createGain();
  state.delayWet.gain.value = 0.06;
  state.feedbackLeft = state.audioCtx.createGain();
  state.feedbackLeft.gain.value = 0.32;
  state.feedbackRight = state.audioCtx.createGain();
  state.feedbackRight.gain.value = 0.28;

  state.convolverNode = state.audioCtx.createConvolver();
  state.convolverNode.buffer = createImpulse(2.4, 2.2);
  state.reverbGain = state.audioCtx.createGain();
  state.reverbGain.gain.value = 0.15;

  state.dryGain = state.audioCtx.createGain();
  state.dryGain.gain.value = 0.90;

  state.stereoPanner = state.audioCtx.createStereoPanner
    ? state.audioCtx.createStereoPanner()
    : state.audioCtx.createGain();

  // Crossfade gain para transição entre níveis
  state.crossfadeGain = state.audioCtx.createGain();
  state.crossfadeGain.gain.value = 1.0;

  state.compressor = state.audioCtx.createDynamicsCompressor();
  // Compressor suave: evita "bombeamento" quando o eco/reverb acumulam.
  state.compressor.threshold.value = -15;
  state.compressor.knee.value = 24;
  state.compressor.ratio.value = 4;
  state.compressor.attack.value = 0.01;
  state.compressor.release.value = 0.25;

  state.masterOut = state.audioCtx.createGain();
  state.masterOut.gain.value = 0.9;

  state.synthMasterGain = state.audioCtx.createGain();
  state.synthMasterGain.gain.value = (state.worldVolume && state.worldVolume[state.currentLevel] != null)
    ? state.worldVolume[state.currentLevel]
    : 0.2;
  state.synthMasterGain.connect(state.masterFilter);

  for (let i = 0; i < 3; i++) {
    state.stemGains[i] = state.audioCtx.createGain();
    const el = document.getElementById(`vol${i}`);
    state.stemGains[i].gain.value = el ? parseFloat(el.value) : 0.2;
    state.stemGains[i].connect(state.masterFilter);
  }

  // Conexões principais
  state.masterFilter.connect(state.dryGain);
  state.dryGain.connect(state.stereoPanner);

  // Delay estéreo com feedback (feedback fixo; volume do eco vem de delayWet)
  state.masterFilter.connect(state.delayLeft);
  state.delayLeft.connect(state.feedbackLeft);
  state.feedbackLeft.connect(state.delayLeft);
  state.delayLeft.connect(state.delayWet);

  state.masterFilter.connect(state.delayRight);
  state.delayRight.connect(state.feedbackRight);
  state.feedbackRight.connect(state.delayRight);
  state.delayRight.connect(state.delayWet);

  state.delayWet.connect(state.stereoPanner);

  state.masterFilter.connect(state.convolverNode);
  state.convolverNode.connect(state.reverbGain);
  state.reverbGain.connect(state.stereoPanner);

  state.stereoPanner.connect(state.crossfadeGain);
  state.crossfadeGain.connect(state.compressor);
  state.compressor.connect(state.masterOut);
  state.masterOut.connect(state.audioCtx.destination);

  // Evolução temporal: LFO lento (respiração) modulando filtro e volume
  state.breathLfo = state.audioCtx.createOscillator();
  state.breathLfo.frequency.value = 0.03; // ~33s por ciclo
  state.breathLfoGain = state.audioCtx.createGain();
  state.breathLfoGain.gain.value = 150; // ±150 Hz no filtro
  state.breathLfo.connect(state.breathLfoGain);
  state.breathLfoGain.connect(state.masterFilter.frequency);
  state.breathLfo.start();

  state.breathVolLfo = state.audioCtx.createOscillator();
  state.breathVolLfo.frequency.value = 0.02; // ~50s por ciclo
  state.breathVolGain = state.audioCtx.createGain();
  state.breathVolGain.gain.value = 0.03; // ±3% no volume
  state.breathVolLfo.connect(state.breathVolGain);
  state.breathVolGain.connect(state.synthMasterGain.gain);
  state.breathVolLfo.start();

  // Canal de mic independente (criado quando mic ligado, mas preparar nós)
  state.micFilter = state.audioCtx.createBiquadFilter();
  state.micFilter.type = 'lowpass';
  state.micFilter.frequency.value = 4000;
  state.micDelay = state.audioCtx.createDelay(2.0);
  state.micDelay.delayTime.value = 0.08;
  state.micFeedback = state.audioCtx.createGain();
  state.micFeedback.gain.value = 0.05;
  state.micReverbSend = state.audioCtx.createGain();
  state.micReverbSend.gain.value = 0.10;
  state.micDry = state.audioCtx.createGain();
  state.micDry.gain.value = 0.85;
  state.micWet = state.audioCtx.createGain();
  state.micWet.gain.value = 0.15;
  state.micGainNode = state.audioCtx.createGain();
  state.micGainNode.gain.value = 0.5;

  // Conectar canal de mic
  state.micGainNode.connect(state.micFilter);
  state.micFilter.connect(state.micDry);
  state.micFilter.connect(state.micDelay);
  state.micDelay.connect(state.micFeedback);
  state.micFeedback.connect(state.micDelay);
  state.micDelay.connect(state.micWet);
  state.micFilter.connect(state.micReverbSend);
  state.micReverbSend.connect(state.convolverNode);
  state.micDry.connect(state.stereoPanner);
  state.micWet.connect(state.stereoPanner);
}

function createImpulse(duration, decay) {
  if (state.impulseBuffer) return state.impulseBuffer;
  const len = state.audioCtx.sampleRate * duration;
  const buf = state.audioCtx.createBuffer(2, len, state.audioCtx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  state.impulseBuffer = buf;
  return buf;
}

// Compatibilidade: o tipo de fonte agora é definido por mundo em worldSourceType.
export function setSourceMode(mode) {
  const normalized = normalizeSourceType(mode);
  if (!state.worldSourceType) state.worldSourceType = Array(WORLD_NAMES.length).fill('synth');
  state.worldSourceType[state.currentLevel] = normalized;
  state.sourceMode = normalized;
  restartWorldAudio();
  if (typeof window.renderSourceList === 'function') window.renderSourceList();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function selectSynthType(idx) {
  initAudio();
  const v = parseInt(idx, 10);
  if (isNaN(v)) return;
  if (!state.worldSynth) state.worldSynth = [...WORLD_SYNTH];
  state.worldSynth[state.currentLevel] = v;
  state.currentSynthType = v;
  if (state.isPlaying && state.sourceMode === 'synth') {
    startChordProgression();
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setSynthVolume(val) {
  const v = parseFloat(val);
  const label = document.getElementById('volValSynth');
  if (label) label.textContent = Math.round(v * 100) + '%';
  if (state.synthMasterGain && state.audioCtx) {
    state.synthMasterGain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function startSynth(transposeSemitones = 0, fadeMs = 40) {
  if (!state.audioCtx) return;
  const preset = SYNTH_PRESETS[state.currentSynthType] || SYNTH_PRESETS[0];
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const factor = Math.pow(2, transposeSemitones / 12);
  const now = state.audioCtx.currentTime;
  const fade = Math.max(0.01, fadeMs / 1000);

  preset.freqs.forEach((freq, idx) => {
    const osc = state.audioCtx.createOscillator();
    const g = state.audioCtx.createGain();
    osc.type = preset.types[idx];
    osc.frequency.value = freq * speed * factor;
    // Fade-in curto: evita o estalo do corte seco ao iniciar.
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(preset.gains[idx], now + fade);

    if (preset.lfo > 0) {
      const lfo = state.audioCtx.createOscillator();
      const lfoGain = state.audioCtx.createGain();
      lfo.frequency.value = preset.lfo;
      lfoGain.gain.value = freq * 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      state.synthNodes.push({ osc: lfo, base: preset.lfo, isLfo: true });
    }

    osc.connect(g);
    g.connect(state.synthMasterGain);
    osc.start(now);
    state.synthNodes.push({ osc, base: freq * factor, isLfo: false, gain: g });
  });

  // Camada opcional: drift (wobble lento de afinação, em cents).
  if (preset.drift > 0) {
    const dLfo = state.audioCtx.createOscillator();
    dLfo.frequency.value = 0.07;
    const dGain = state.audioCtx.createGain();
    dGain.gain.value = preset.drift * 1200;
    dLfo.connect(dGain);
    state.synthNodes.forEach(n => {
      if (!n.isLfo && n.osc.detune) dGain.connect(n.osc.detune);
    });
    dLfo.start(now);
    state.synthNodes.push({ osc: dLfo, base: 0.07, isLfo: true });
  }

  // Camada opcional: binaural (ΔHz entre canais, batimento no fone).
  if (preset.binaural > 0) {
    for (let i = 0; i < 2; i++) {
      const freq = preset.freqs[i] * speed * factor + preset.binaural;
      const osc = state.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = state.audioCtx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(preset.gains[i] * 0.5, now + fade);
      if (state.audioCtx.createStereoPanner) {
        const pan = state.audioCtx.createStereoPanner();
        pan.pan.value = (i === 0) ? -1 : 1;
        osc.connect(g);
        g.connect(pan);
        pan.connect(state.synthMasterGain);
      } else {
        osc.connect(g);
        g.connect(state.synthMasterGain);
      }
      osc.start(now);
      state.synthNodes.push({ osc, base: preset.freqs[i] * factor + preset.binaural, isLfo: false, gain: g });
    }
  }

  // Camada opcional: pulse (tom com gate rítmico no BPM do mundo).
  if (preset.pulse) {
    const bpm = preset.pulse.bpm || preset.bpm || 60;
    const beat = 60 / bpm;
    const pOsc = state.audioCtx.createOscillator();
    pOsc.type = 'square';
    pOsc.frequency.value = preset.freqs[0] * 2 * speed * factor;
    const pGain = state.audioCtx.createGain();
    pGain.gain.value = preset.pulse.gain / 2;
    const pLfo = state.audioCtx.createOscillator();
    pLfo.type = 'square';
    pLfo.frequency.value = 1 / beat;
    const pLfoGain = state.audioCtx.createGain();
    pLfoGain.gain.value = preset.pulse.gain / 2;
    pLfo.connect(pLfoGain);
    pLfoGain.connect(pGain.gain);
    pOsc.connect(pGain);
    pGain.connect(state.synthMasterGain);
    pOsc.start(now);
    // offbeat: o gate começa meio batida depois.
    pLfo.start(preset.pulse.offbeat ? (now + beat / 2) : now);
    state.synthNodes.push({ osc: pOsc, base: preset.freqs[0] * 2 * factor, isLfo: false, gain: pGain });
    state.synthNodes.push({ osc: pLfo, base: 1 / beat, isLfo: true });
  }

  // Camada opcional: noise (cama de ruído filtrada).
  if (preset.noise) {
    const len = 2 * state.audioCtx.sampleRate;
    const nBuf = state.audioCtx.createBuffer(1, len, state.audioCtx.sampleRate);
    const ch = nBuf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = state.audioCtx.createBufferSource();
    src.buffer = nBuf;
    src.loop = true;
    const filt = state.audioCtx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = preset.noise.freq || 500;
    const nGain = state.audioCtx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.linearRampToValueAtTime(preset.noise.gain, now + Math.max(fade, 0.3));
    src.connect(filt);
    filt.connect(nGain);
    nGain.connect(state.synthMasterGain);
    src.start(now);
    state.synthNodes.push({ osc: src, isNoise: true, gain: nGain });
  }

  // Camada opcional: pluck (notas curtas agendadas no BPM do mundo).
  if (preset.pluck) startPluckLayer(factor);
}

// Camada pluck: agenda notas curtas (colcheias no BPM do preset).
// Um timer por synth; parado junto com stopSynth.
let pluckTimer = null;

function startPluckLayer(factor) {
  if (pluckTimer) clearInterval(pluckTimer);
  const preset = SYNTH_PRESETS[state.currentSynthType] || SYNTH_PRESETS[0];
  const bpm = (preset.pluck && preset.pluck.bpm) || preset.bpm || 70;
  const stepMs = Math.max(150, Math.round(30000 / bpm)); // colcheias
  let stepIdx = 0;
  pluckTimer = setInterval(() => {
    if (!state.isPlaying || state.sourceMode !== 'synth') return;
    const p = SYNTH_PRESETS[state.currentSynthType];
    if (!p || !p.pluck) return;
    const speedNow = parseFloat(document.getElementById('sliderSpeed').value) || 1;
    const f = p.freqs[stepIdx % p.freqs.length] * 2 * speedNow * factor;
    playPluckNote(f, p.pluck.gain);
    stepIdx++;
  }, stepMs);
}

function playPluckNote(freq, gain) {
  if (!state.audioCtx) return;
  const now = state.audioCtx.currentTime;
  const osc = state.audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const filt = state.audioCtx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1600;
  const g = state.audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(filt);
  filt.connect(g);
  g.connect(state.synthMasterGain);
  osc.start(now);
  osc.stop(now + 0.55);
  osc.onended = () => { try { g.disconnect(); filt.disconnect(); } catch (e) {} };
}

export function stopSynth(fadeMs = 60) {
  if (pluckTimer) { clearInterval(pluckTimer); pluckTimer = null; }
  // Parar LFOs de respiração (vazam recursos se não parados)
  if (state.breathLfo) {
    try { state.breathLfo.stop(); state.breathLfo.disconnect(); } catch (e) {}
    state.breathLfo = null;
  }
  if (state.breathLfoGain) {
    try { state.breathLfoGain.disconnect(); } catch (e) {}
    state.breathLfoGain = null;
  }
  if (state.breathVolLfo) {
    try { state.breathVolLfo.stop(); state.breathVolLfo.disconnect(); } catch (e) {}
    state.breathVolLfo = null;
  }
  if (state.breathVolGain) {
    try { state.breathVolGain.disconnect(); } catch (e) {}
    state.breathVolGain = null;
  }
  const nodes = state.synthNodes;
  state.synthNodes = [];
  if (!nodes.length) return;
  const ctx = state.audioCtx;
  if (!ctx) {
    nodes.forEach(s => { try { s.osc.stop(); } catch (e) {} });
    return;
  }
  const now = ctx.currentTime;
  const fade = Math.max(0.01, fadeMs / 1000);
  nodes.forEach(s => {
    if (s.isLfo || !s.gain) return;
    try {
      const p = s.gain.gain;
      p.cancelScheduledValues(now);
      p.setValueAtTime(Math.max(0.0001, p.value), now);
      p.linearRampToValueAtTime(0.0001, now + fade);
    } catch (e) {}
  });
  setTimeout(() => {
    nodes.forEach(s => {
      try { s.osc.stop(); } catch (e) {}
      if (s.gain) { try { s.gain.disconnect(); } catch (e) {} }
    });
  }, Math.round(fade * 1000) + 80);
}

// Troca o synth atual por outro com fade (sem corte seco).
export function restartSynth(transposeSemitones = 0, fadeMs = 80) {
  stopSynth(fadeMs);
  startSynth(transposeSemitones, fadeMs);
}

export function startChordProgression() {
  stopChordProgression();
  const prog = CHORD_PROGRESSIONS[state.currentLevel] || CHORD_PROGRESSIONS[0];
  // Mundos com BPM mudam de acorde a cada compasso (4 tempos);
  // os demais mantêm os 8s estáveis da v2.7.
  const preset = SYNTH_PRESETS[state.currentSynthType] || {};
  const bpm = (preset.pulse && preset.pulse.bpm) || preset.bpm;
  const chordMs = bpm ? Math.max(3000, Math.min(12000, Math.round(240000 / bpm))) : 8000;
  state.chordIndex = 0;
  // play first chord immediately (com fade, sem sobrepor camadas)
  if (state.sourceMode === 'synth' && state.isPlaying) {
    restartSynth(prog[0], 400);
  }
  state.chordInterval = setInterval(() => {
    if (!state.isPlaying || state.sourceMode !== 'synth') return;
    state.chordIndex = (state.chordIndex + 1) % prog.length;
    // Crossfade longo: evita o "pulo" a cada troca de acorde.
    restartSynth(prog[state.chordIndex], Math.min(1400, Math.round(chordMs * 0.35)));
  }, chordMs);
}

export function stopChordProgression() {
  if (state.chordInterval) { clearInterval(state.chordInterval); state.chordInterval = null; }
}

export async function loadStem(index, file) {
  if (!file) return;
  initAudio();
  const label = document.getElementById(`label${index}`);
  if (label) label.textContent = `Camada ${index + 1}: Lendo...`;
  try {
    const buf = await file.arrayBuffer();
    state.audioCtx.decodeAudioData(buf, (decoded) => {
      state.stemBuffers[index] = decoded;
      if (label) label.textContent = `Camada ${index + 1}: ${file.name.slice(0, 14)}`;
      if (state.isPlaying && state.sourceMode === 'upload') startStems();
    }, () => {
      if (label) label.textContent = 'Erro ao carregar';
    });
  } catch (e) {
    if (label) label.textContent = 'Erro ao carregar';
  }
}

export async function loadWorldMp3(worldIdx, file) {
  if (!file) return;
  initAudio();
  const label = document.getElementById(`mp3Label${worldIdx}`);
  if (label) label.textContent = 'Lendo...';
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
      if (label) label.textContent = 'Erro';
    });
  } catch (e) {
    if (label) label.textContent = 'Erro';
  }
}

// --- Reprodução inteligente de MP3 (plano 2.9) ---
// Ao entrar/trocar de mundo a música NÃO recomeça do zero: escolhe-se uma
// âncora por energia (RMS por janelas de 1s) com aleatoriedade ponderada
// por menos-recentemente-usada. Ao chegar ao fim, a faixa não termina:
// com ~3s de antecedência salta para uma nova âncora com fade curto.
// Histórico fica em memória (não vai para a seed); faixas curtas (<20s)
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
export function setWorldSynth(worldIdx, val) {
  if (val === undefined) { val = worldIdx; worldIdx = state.currentLevel; }
  const v = parseInt(val, 10);
  if (isNaN(v)) return;
  if (!state.worldSynth) state.worldSynth = [...WORLD_SYNTH];
  state.worldSynth[worldIdx] = v;
  if (worldIdx === state.currentLevel) {
    state.currentSynthType = v;
    if (state.isPlaying && state.sourceMode === 'synth') {
      restartSynth(0, 300);
    }
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

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
export function setWorldVolume(worldIdx, val) {
  if (val === undefined) { val = worldIdx; worldIdx = state.currentLevel; }
  const v = parseFloat(val);
  if (isNaN(v)) return;
  if (!state.worldVolume) state.worldVolume = Array(WORLD_NAMES.length).fill(0.2);
  state.worldVolume[worldIdx] = v;

  const label = document.getElementById(`worldVolVal${worldIdx}`);
  if (label) label.textContent = Math.round(v * 100) + '%';

  if (worldIdx === state.currentLevel && state.audioCtx) {
    if (state.worldMp3Gains[worldIdx]) {
      state.worldMp3Gains[worldIdx].gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
    }
    if (state.sourceMode === 'synth' && state.synthMasterGain) {
      state.synthMasterGain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
    }
    if (state.sourceMode === 'youtube' && window.setYouTubeVolume) {
      window.setYouTubeVolume(worldIdx, v);
    }
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// Crossfade suave entre dois mundos MP3 (overlap de 2s)
function crossfadeMp3Worlds(fromIdx, toIdx) {
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
export function restartWorldAudio() {
  stopStems();
  stopSynth();
  stopChordProgression();
  stopAllMp3World();
  if (window.stopAllYouTubeWorld) window.stopAllYouTubeWorld();
  if (window.stopCapture) window.stopCapture();

  if (!state.isPlaying) return;
  const rawType = (state.worldSourceType && state.worldSourceType[state.currentLevel]) || 'synth';
  const type = normalizeSourceType(rawType);
  state.worldSourceType[state.currentLevel] = type;
  state.sourceMode = type;
  if (type === 'synth') {
    if (state.synthMasterGain && state.audioCtx) {
      state.synthMasterGain.gain.setTargetAtTime(
        state.worldVolume[state.currentLevel], state.audioCtx.currentTime, 0.1);
    }
    startChordProgression();
  } else if (type === 'mp3') {
    startMp3World();
  } else if (type === 'youtube') {
    if (window.startYouTubeWorld) window.startYouTubeWorld();
  } else if (type === 'capture') {
    if (window.startCapture) window.startCapture();
  }
}

export function startStems() {
  stopStems();
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  for (let i = 0; i < 3; i++) {
    if (state.stemBuffers[i]) {
      const src = state.audioCtx.createBufferSource();
      src.buffer = state.stemBuffers[i];
      src.loop = true;
      src.playbackRate.value = speed;
      src.connect(state.stemGains[i]);
      src.start(0);
      state.stemSources[i] = src;
    }
  }
}

export function stopStems() {
  for (let i = 0; i < 3; i++) {
    if (state.stemSources[i]) {
      try { state.stemSources[i].stop(); } catch (e) {}
      state.stemSources[i] = null;
    }
  }
}

export function setVolume(index, val) {
  const v = parseFloat(val);
  document.getElementById(`volVal${index}`).textContent = Math.round(v * 100) + '%';
  if (state.stemGains[index] && state.audioCtx) {
    state.stemGains[index].gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function toggleMasterPlay() {
  initAudio();
  const btn = document.getElementById('masterPlayBtn');
  const sub = document.getElementById('playSub');
  const topSt = document.getElementById('topStatus');

  if (!state.isPlaying) {
    state.isPlaying = true;
    restartWorldAudio();

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    sub.textContent = 'ATIVO';
    topSt.textContent = 'SONHANDO';
    const logo = document.querySelector('.logo');
    if (logo) logo.classList.add('breathing');

    import('./power.js').then(p => {
      p.setupMediaSession();
      p.requestWakeLock();
      p.setMediaPlaybackState(true);
    });
  } else {
    state.isPlaying = false;
    stopStems();
    stopSynth();
    stopChordProgression();
    stopAllMp3World();
    if (window.stopAllYouTubeWorld) window.stopAllYouTubeWorld();
    if (window.stopCapture) window.stopCapture();
    stopDeprivationHeartbeat();
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    sub.textContent = 'OFF';
    topSt.textContent = 'PARADO';
    const logo = document.querySelector('.logo');
    if (logo) logo.classList.remove('breathing');

    import('./power.js').then(p => {
      p.releaseWakeLock();
      p.setMediaPlaybackState(false);
    });
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function selectLevel(idx, preserveParams = false) {
  initAudio();

  const applyLevel = () => {
    state.currentLevel = idx;
    state.currentSynthType = (state.worldSynth && state.worldSynth[idx] != null)
      ? state.worldSynth[idx]
      : WORLD_SYNTH[idx];
    const rawType = (state.worldSourceType && state.worldSourceType[idx]) || 'synth';
    state.sourceMode = normalizeSourceType(rawType);
    if (state.worldSourceType) state.worldSourceType[idx] = state.sourceMode;

    // Volume do mundo atual no synth (o ganho é compartilhado entre mundos)
    if (state.synthMasterGain && state.audioCtx) {
      const vol = (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2;
      state.synthMasterGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
    }

    const _colors = ['#ffffff', '#88aaff', '#ffaa88', '#ff8888', '#88ddaa', '#ddcc66',
      '#66dddd', '#cc99ff', '#999999', '#aaaaff', '#ff6699', '#ffdd88', '#88ffcc'];
    const topSt = document.getElementById('topStatus');
    if (topSt) topSt.style.color = _colors[idx];

    // Atualiza dropdown de seleção de mundo
    const worldSel = document.getElementById('worldSelect');
    if (worldSel) worldSel.value = idx;

    const l = LEVELS[idx];
  // Aplica cor de fundo do mundo (app + screensaver transparente herda)
  document.body.style.backgroundColor = l.bgColor;
  document.documentElement.style.backgroundColor = l.bgColor;

  const speedEl = document.getElementById('sliderSpeed');
    const filterEl = document.getElementById('sliderFilter');
    const delayEl = document.getElementById('sliderDelay');
    const reverbEl = document.getElementById('sliderReverb');
    if (!preserveParams) {
      if (speedEl) speedEl.value = l.speed;
      if (filterEl) filterEl.value = l.filter;
      if (delayEl) delayEl.value = l.delay;
      if (reverbEl) reverbEl.value = l.reverb;
    }
    const curSpeed = speedEl ? parseFloat(speedEl.value) : l.speed;
    const curFilter = filterEl ? parseFloat(filterEl.value) : l.filter;
    syncXYPadFromSliders(curSpeed, curFilter);
    applyParameters();

    if (state.isPlaying) {
      stopSynth(500);
      stopChordProgression();
      // Crossfade suave entre mundos MP3
      const oldMp3Idx = state.currentLevel !== idx ? state.currentLevel : -1;
      if (oldMp3Idx >= 0 && state.worldSourceType[oldMp3Idx] === 'mp3' && state.worldSourceType[idx] === 'mp3') {
        // Ambos são MP3: crossfade suave
        crossfadeMp3Worlds(oldMp3Idx, idx);
      } else {
        // Transição normal (MP3 -> synth, synth -> MP3, etc)
        stopAllMp3World();
        if (window.stopAllYouTubeWorld) window.stopAllYouTubeWorld();
        if (window.stopCapture) window.stopCapture();
      }

      if (state.sourceMode === 'synth') {
        startChordProgression();
      } else if (state.sourceMode === 'mp3') {
        startMp3World();
      } else if (state.sourceMode === 'youtube') {
        if (window.startYouTubeWorld) window.startYouTubeWorld();
      } else if (state.sourceMode === 'capture') {
        if (window.startCapture) window.startCapture();
      }
    }

    if (typeof window.syncSourceRow === 'function') window.syncSourceRow(idx);
    if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
  };

  // Crossfade: fade out, apply, fade in
  if (state.crossfadeGain) {
    const now = state.audioCtx.currentTime;
    state.crossfadeGain.gain.cancelScheduledValues(now);
    state.crossfadeGain.gain.setValueAtTime(state.crossfadeGain.gain.value, now);
    state.crossfadeGain.gain.linearRampToValueAtTime(0, now + 0.75);
    setTimeout(() => {
      applyLevel();
      const now2 = state.audioCtx.currentTime;
      state.crossfadeGain.gain.cancelScheduledValues(now2);
      state.crossfadeGain.gain.setValueAtTime(0, now2);
      state.crossfadeGain.gain.linearRampToValueAtTime(1, now2 + 0.75);
    }, 750);
  } else {
    applyLevel();
  }
}

export function syncXYPadFromSliders(speed, filter) {
  // X/Y Pad removido; manter função como no-op para compatibilidade
  const x = Math.max(0, Math.min(1, (speed - 0.25) / 1.15));
  const y = Math.max(0, Math.min(1, 1 - (filter - 160) / (18000 - 160)));
  state.xyState = { x, y };
}

export function updateFromSliders(syncXY) {
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const filter = parseFloat(document.getElementById('sliderFilter').value);
  if (syncXY) syncXYPadFromSliders(speed, filter);
  // lose level highlight (custom override)
  for (let i = 0; i < LEVELS.length; i++) {
    const b = document.getElementById(`lvl${i}`);
    if (b) b.classList.remove('active');
  }
  applyParameters();
}

export function applyParameters() {
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const filter = parseFloat(document.getElementById('sliderFilter').value);
  const delay = parseFloat(document.getElementById('sliderDelay').value);
  const reverb = parseFloat(document.getElementById('sliderReverb').value);

  document.getElementById('valSpeed').textContent = speed.toFixed(2) + 'x';
  document.getElementById('valFilter').textContent = Math.round(filter) + ' Hz';
  document.getElementById('valDelay').textContent = Math.round(delay * 100) + '%';
  document.getElementById('valReverb').textContent = Math.round(reverb * 100) + '%';

  if (state.audioCtx) {
    const now = state.audioCtx.currentTime;
    if (state.masterFilter) state.masterFilter.frequency.setTargetAtTime(filter, now, 0.05);
    // Slider vira quantidade de eco (wet). O feedback permanece fixo e estável.
    if (state.delayWet) state.delayWet.gain.setTargetAtTime(Math.min(0.45, delay * 0.5), now, 0.08);
    if (state.reverbGain) state.reverbGain.gain.setTargetAtTime(Math.min(0.5, reverb * 0.5), now, 0.08);
    // Stems só se estiverem ativos (sourceMode === 'capture' que usa stems)
    if (state.sourceMode === 'capture') {
      state.stemSources.forEach(s => { if (s) s.playbackRate.setTargetAtTime(speed, now, 0.05); });
    }
    state.worldMp3Sources.forEach(s => { if (s) s.playbackRate.setTargetAtTime(speed, now, 0.05); });
    state.synthNodes.forEach(s => {
      if (!s.isLfo && s.osc.frequency) s.osc.frequency.setTargetAtTime(s.base * speed, now, 0.05);
    });
  }

  if (typeof window.setYouTubeRate === 'function') window.setYouTubeRate(speed);
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function triggerKick(withPiafCue) {
  initAudio();
  const now = state.audioCtx.currentTime;

  if (withPiafCue) {
    // Melodia de "Non, je ne regrette rien" (Piaf) em registro grave
    // G - A - B - C, com ritmo marchado (última nota sustentada)
    const notes = [
      { f: 98.0,  t: 0.00, dur: 0.22 },
      { f: 110.0, t: 0.28, dur: 0.22 },
      { f: 123.47,t: 0.56, dur: 0.22 },
      { f: 130.81,t: 0.84, dur: 0.45 }
    ];
    notes.forEach(n => {
      const o = state.audioCtx.createOscillator();
      const f = state.audioCtx.createBiquadFilter();
      const g = state.audioCtx.createGain();
      // sawtooth com filtro para timbre metálico grave
      o.type = 'sawtooth';
      f.type = 'lowpass';
      f.frequency.value = 600;
      f.Q.value = 1.2;
      o.frequency.setValueAtTime(n.f, now + n.t);
      // leve vibrato na última nota
      if (n.dur > 0.2) {
        const lfo = state.audioCtx.createOscillator();
        const lfoGain = state.audioCtx.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = n.f * 0.012;
        lfo.connect(lfoGain);
        lfoGain.connect(o.frequency);
        lfo.start(now + n.t);
        lfo.stop(now + n.t + n.dur + 0.05);
      }
      g.gain.setValueAtTime(0.001, now + n.t);
      g.gain.linearRampToValueAtTime(0.20, now + n.t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.dur);
      o.connect(f);
      f.connect(g);
      g.connect(state.masterFilter);
      o.start(now + n.t);
      o.stop(now + n.t + n.dur + 0.05);
    });
    // drone grave sustentado (lembrança do motivo)
    const drone = state.audioCtx.createOscillator();
    const dg = state.audioCtx.createGain();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(49.0, now);
    dg.gain.setValueAtTime(0.001, now);
    dg.gain.linearRampToValueAtTime(0.16, now + 0.1);
    dg.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    drone.connect(dg);
    dg.connect(state.masterFilter);
    drone.start(now);
    drone.stop(now + 1.35);
  }

  [55, 110, 164.81].forEach(freq => {
    const osc = state.audioCtx.createOscillator();
    const flt = state.audioCtx.createBiquadFilter();
    const g = state.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + 1.1);
    osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 3.6);
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(180, now + 1.1);
    flt.frequency.exponentialRampToValueAtTime(2000, now + 1.5);
    g.gain.setValueAtTime(0.01, now + 1.1);
    g.gain.linearRampToValueAtTime(0.45, now + 1.3);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.6);
    osc.connect(flt);
    flt.connect(g);
    g.connect(state.compressor);
    osc.start(now + 1.1);
    osc.stop(now + 3.7);
  });

  selectLevel(WAITING_FOR_TRAIN_IDX); // Waiting for a Train (sucessor do Limbo)
  setTimeout(() => selectLevel(HALF_REMEMBERED_DREAM_IDX), 3800);
}

export function playHeartbeatPulse(offsetGain) {
  if (!state.audioCtx) return;
  const now = state.audioCtx.currentTime;
  const osc = state.audioCtx.createOscillator();
  const g = state.audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(52, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.16);
  g.gain.setValueAtTime(0.32 - offsetGain, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(g);
  g.connect(state.compressor);
  osc.start(now);
  osc.stop(now + 0.19);
}

export function captureAndPlaySubconsciousMemory() {
  if (!state.micStream || !state.audioCtx || typeof MediaRecorder === 'undefined') return;
  try {
    const recorder = new MediaRecorder(state.micStream);
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks);
        const arr = await blob.arrayBuffer();
        state.audioCtx.decodeAudioData(arr, (buffer) => {
          const reverseProb = state.currentLevel === WAITING_FOR_TRAIN_IDX ? 0.8 : (state.currentLevel === HALF_REMEMBERED_DREAM_IDX ? 0.2 : 0.4);
          const reverse = Math.random() < reverseProb;
          if (reverse) {
            for (let c = 0; c < buffer.numberOfChannels; c++) {
              Array.prototype.reverse.call(buffer.getChannelData(c));
            }
          }
          const pitchShift = Math.random() < 0.5 ? (Math.random() < 0.5 ? 1 : -1) : 0;
          const pitchFactor = Math.pow(2, pitchShift / 12);
          const src = state.audioCtx.createBufferSource();
          const g = state.audioCtx.createGain();
          src.buffer = buffer;
          src.playbackRate.value = 0.62 * pitchFactor;
          g.gain.value = 0.75;
          src.connect(g);
          g.connect(state.convolverNode);
          g.connect(state.delayLeft);
          const varDelay = state.audioCtx.createDelay(2.0);
          varDelay.delayTime.value = 0.3 + Math.random() * 0.5;
          g.connect(varDelay);
          varDelay.connect(state.stereoPanner);
          src.start();
          const status = document.getElementById('sensorStatus');
          if (status) status.textContent = reverse
            ? 'Memory Catcher: Eco reverso projetado no sonho.'
            : 'Memory Catcher: Fragmento desacelerado projetado.';
        }, () => {});
      } catch (e) {}
    };
    recorder.start();
    setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 2800);
  } catch (e) {}
}
