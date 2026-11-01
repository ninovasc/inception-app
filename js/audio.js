import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES } from './config.js';

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
  const normalized = mode === 'upload' ? 'mp3' : mode;
  if (!state.worldSourceType) state.worldSourceType = ['synth', 'synth', 'synth', 'synth', 'synth', 'synth'];
  if (['synth', 'mp3', 'youtube'].includes(normalized)) {
    state.worldSourceType[state.currentLevel] = normalized;
  }
  state.sourceMode = normalized === 'upload' ? 'mp3' : normalized;
  restartWorldAudio();
  if (typeof window.renderSourceList === 'function') window.renderSourceList();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function selectSynthType(idx) {
  initAudio();
  const v = parseInt(idx, 10);
  if (isNaN(v)) return;
  if (!state.worldSynth) state.worldSynth = [0, 1, 2, 3, 4, 0];
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
  const preset = SYNTH_PRESETS[state.currentSynthType];
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
}

export function stopSynth(fadeMs = 60) {
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
  state.chordIndex = 0;
  // play first chord immediately (com fade, sem sobrepor camadas)
  if (state.sourceMode === 'synth' && state.isPlaying) {
    restartSynth(prog[0], 400);
  }
  state.chordInterval = setInterval(() => {
    if (!state.isPlaying || state.sourceMode !== 'synth') return;
    state.chordIndex = (state.chordIndex + 1) % prog.length;
    // Crossfade longo: evita o "pulo" a cada troca de acorde.
    restartSynth(prog[state.chordIndex], 1400);
  }, 8000);
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

export function startMp3World() {
  stopMp3World(state.currentLevel, 80);
  const idx = state.currentLevel;
  const buf = state.worldMp3Buffers[idx];
  if (!buf || !state.audioCtx) return;
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const now = state.audioCtx.currentTime;
  const src = state.audioCtx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.playbackRate.value = speed;
  const gain = state.audioCtx.createGain();
  const vol = (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2;
  // Fade-in curto: evita estalo ao iniciar/trocar de mundo.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(Math.max(0.0001, vol), now + 0.08);
  src.connect(gain);
  gain.connect(state.masterFilter);
  src.start(now);
  src.onended = () => { try { gain.disconnect(); } catch (e) {} };
  state.worldMp3Sources[idx] = src;
  state.worldMp3Gains = state.worldMp3Gains || [];
  state.worldMp3Gains[idx] = gain;
}

// worldIdx opcional: por padrão aplica ao mundo atual (compatibilidade).
export function setWorldSynth(worldIdx, val) {
  if (val === undefined) { val = worldIdx; worldIdx = state.currentLevel; }
  const v = parseInt(val, 10);
  if (isNaN(v)) return;
  if (!state.worldSynth) state.worldSynth = [0, 1, 2, 3, 4, 0];
  state.worldSynth[worldIdx] = v;
  if (worldIdx === state.currentLevel) {
    state.currentSynthType = v;
    if (state.isPlaying && state.sourceMode === 'synth') {
      restartSynth(0, 300);
    }
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function stopMp3World(index, fadeMs = 70) {
  const idx = (index === undefined) ? state.currentLevel : index;
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
      p.setValueAtTime(Math.max(0.0001, p.value), now);
      p.linearRampToValueAtTime(0.0001, now + fadeMs / 1000);
    } catch (e) {}
    setTimeout(() => {
      try { src.stop(); } catch (e) {}
      try { gain.disconnect(); } catch (e) {}
    }, fadeMs + 80);
  } else {
    try { src.stop(); } catch (e) {}
  }
}

export function stopAllMp3World() {
  for (let i = 0; i < 6; i++) stopMp3World(i);
}

export function setWorldMp3Volume(worldIdx, val) {
  setWorldVolume(worldIdx, val);
}

// Aplica volume por mundo: synth, MP3 e YouTube.
export function setWorldVolume(worldIdx, val) {
  if (val === undefined) { val = worldIdx; worldIdx = state.currentLevel; }
  const v = parseFloat(val);
  if (isNaN(v)) return;
  if (!state.worldVolume) state.worldVolume = [0.2, 0.2, 0.2, 0.2, 0.2, 0.2];
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

// Reinicia a fonte do mundo atual respeitando o tipo escolhido.
export function restartWorldAudio() {
  stopStems();
  stopSynth();
  stopChordProgression();
  stopAllMp3World();
  if (window.stopAllYouTubeWorld) window.stopAllYouTubeWorld();
  if (window.stopCapture) window.stopCapture();

  if (!state.isPlaying) return;
  const type = (state.worldSourceType && state.worldSourceType[state.currentLevel]) || 'synth';
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
    state.sourceMode = (state.worldSourceType && state.worldSourceType[idx]) || 'synth';

    // Volume do mundo atual no synth (o ganho é compartilhado entre mundos)
    if (state.synthMasterGain && state.audioCtx) {
      const vol = (state.worldVolume && state.worldVolume[idx] != null) ? state.worldVolume[idx] : 0.2;
      state.synthMasterGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
    }

    const _colors = ['#ffffff', '#88aaff', '#ffaa88', '#ff8888', '#888888', '#aaffaa'];
    for (let i = 0; i < 6; i++) {
      const _b = document.getElementById(`lvl${i}`);
      if (_b) {
        _b.classList.toggle('active', i === idx);
        _b.style.borderLeftColor = i === idx ? _colors[i] : '';
      }
    }
    const topSt = document.getElementById('topStatus');
    if (topSt) topSt.style.color = _colors[idx];

    const l = LEVELS[idx];
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
      stopAllMp3World();
      if (window.stopAllYouTubeWorld) window.stopAllYouTubeWorld();
      if (window.stopCapture) window.stopCapture();

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
  for (let i = 0; i < 6; i++) {
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
    state.stemSources.forEach(s => { if (s) s.playbackRate.setTargetAtTime(speed, now, 0.05); });
    state.worldMp3Sources.forEach(s => { if (s) s.playbackRate.setTargetAtTime(speed, now, 0.05); });
    state.synthNodes.forEach(s => {
      if (!s.isLfo) s.osc.frequency.setTargetAtTime(s.base * speed, now, 0.05);
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

  selectLevel(4);
  setTimeout(() => selectLevel(0), 3800);
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
          const reverseProb = state.currentLevel === 4 ? 0.8 : (state.currentLevel === 0 ? 0.2 : 0.4);
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
          g.connect(state.delayNode);
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
