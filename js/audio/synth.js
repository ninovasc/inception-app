// @ts-nocheck
import { state } from '../state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from '../config.js';
import { initAudio } from './core.js';

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

export function startSynth(transposeSemitones = 0, fadeMs = 80) {
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
    pGain.gain.setValueAtTime(0.0001, now);
    pGain.gain.linearRampToValueAtTime(preset.pulse.gain / 2, now + Math.max(0.05, fade));
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

export function stopSynth(fadeMs = 100) {
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
