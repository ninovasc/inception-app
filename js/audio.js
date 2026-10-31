import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS } from './config.js';

export function initAudio() {
  if (state.audioCtx) {
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  state.audioCtx = new AudioCtx();

  state.masterFilter = state.audioCtx.createBiquadFilter();
  state.masterFilter.type = 'lowpass';
  state.masterFilter.frequency.value = 18000;

  state.delayNode = state.audioCtx.createDelay(5.0);
  state.delayNode.delayTime.value = 0.45;
  state.feedbackGain = state.audioCtx.createGain();
  state.feedbackGain.gain.value = 0.12;

  state.convolverNode = state.audioCtx.createConvolver();
  state.convolverNode.buffer = createImpulse(3.5, 2.5);
  state.reverbGain = state.audioCtx.createGain();
  state.reverbGain.gain.value = 0.30;

  state.dryGain = state.audioCtx.createGain();
  state.dryGain.gain.value = 0.90;

  state.stereoPanner = state.audioCtx.createStereoPanner
    ? state.audioCtx.createStereoPanner()
    : state.audioCtx.createGain();

  state.compressor = state.audioCtx.createDynamicsCompressor();
  state.compressor.threshold.value = -15;

  state.synthMasterGain = state.audioCtx.createGain();
  state.synthMasterGain.gain.value = parseFloat(document.getElementById('volSynth').value);
  state.synthMasterGain.connect(state.masterFilter);

  for (let i = 0; i < 3; i++) {
    state.stemGains[i] = state.audioCtx.createGain();
    state.stemGains[i].gain.value = parseFloat(document.getElementById(`vol${i}`).value);
    state.stemGains[i].connect(state.masterFilter);
  }

  state.masterFilter.connect(state.dryGain);
  state.dryGain.connect(state.stereoPanner);

  state.masterFilter.connect(state.delayNode);
  state.delayNode.connect(state.feedbackGain);
  state.feedbackGain.connect(state.delayNode);
  state.delayNode.connect(state.stereoPanner);

  state.masterFilter.connect(state.convolverNode);
  state.convolverNode.connect(state.reverbGain);
  state.reverbGain.connect(state.stereoPanner);

  state.stereoPanner.connect(state.compressor);
  state.compressor.connect(state.audioCtx.destination);
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

export function setSourceMode(mode) {
  state.sourceMode = mode;
  const btnSynth = document.getElementById('btnSynth');
  const btnUpload = document.getElementById('btnUpload');
  btnSynth.classList.toggle('active', mode === 'synth');
  btnUpload.classList.toggle('active', mode === 'upload');
  btnSynth.setAttribute('aria-pressed', mode === 'synth' ? 'true' : 'false');
  btnUpload.setAttribute('aria-pressed', mode === 'upload' ? 'true' : 'false');
  document.getElementById('synthBox').style.display = mode === 'synth' ? 'flex' : 'none';
  document.getElementById('uploadBox').style.display = mode === 'upload' ? 'flex' : 'none';

  if (state.isPlaying) {
    if (mode === 'synth') { stopStems(); startSynth(); }
    else { stopSynth(); startStems(); }
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function selectSynthType(idx) {
  initAudio();
  state.currentSynthType = idx;
  for (let i = 0; i < 5; i++) {
    document.getElementById(`syn${i}`).classList.toggle('active', i === idx);
  }
  if (state.isPlaying && state.sourceMode === 'synth') startSynth();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setSynthVolume(val) {
  const v = parseFloat(val);
  document.getElementById('volValSynth').textContent = Math.round(v * 100) + '%';
  if (state.synthMasterGain && state.audioCtx) {
    state.synthMasterGain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function startSynth() {
  stopSynth();
  const preset = SYNTH_PRESETS[state.currentSynthType];
  const speed = parseFloat(document.getElementById('sliderSpeed').value);

  preset.freqs.forEach((freq, idx) => {
    const osc = state.audioCtx.createOscillator();
    const g = state.audioCtx.createGain();
    osc.type = preset.types[idx];
    osc.frequency.value = freq * speed;
    g.gain.value = preset.gains[idx];

    if (preset.lfo > 0) {
      const lfo = state.audioCtx.createOscillator();
      const lfoGain = state.audioCtx.createGain();
      lfo.frequency.value = preset.lfo;
      lfoGain.gain.value = freq * 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      state.synthNodes.push({ osc: lfo, base: preset.lfo, isLfo: true });
    }

    osc.connect(g);
    g.connect(state.synthMasterGain);
    osc.start();
    state.synthNodes.push({ osc, base: freq, isLfo: false });
  });
}

export function stopSynth() {
  state.synthNodes.forEach(s => { try { s.osc.stop(); } catch (e) {} });
  state.synthNodes = [];
}

export async function loadStem(index, file) {
  if (!file) return;
  initAudio();
  document.getElementById(`label${index}`).textContent = `Camada ${index + 1}: Lendo...`;
  try {
    const buf = await file.arrayBuffer();
    const decoded = await state.audioCtx.decodeAudioData(buf);
    state.stemBuffers[index] = decoded;
    document.getElementById(`label${index}`).textContent = `Camada ${index + 1}: ${file.name.slice(0, 14)}`;
    if (state.isPlaying && state.sourceMode === 'upload') startStems();
  } catch (e) {
    document.getElementById(`label${index}`).textContent = 'Erro ao carregar';
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
    if (state.sourceMode === 'synth') startSynth();
    else startStems();

    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    sub.textContent = 'ATIVO';
    topSt.textContent = 'SONHANDO';

    import('./power.js').then(p => {
      p.setupMediaSession();
      p.requestWakeLock();
      p.setMediaPlaybackState(true);
    });
  } else {
    state.isPlaying = false;
    stopStems();
    stopSynth();
    stopDeprivationHeartbeat();
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    sub.textContent = 'OFF';
    topSt.textContent = 'PARADO';

    import('./power.js').then(p => {
      p.releaseWakeLock();
      p.setMediaPlaybackState(false);
    });
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function selectLevel(idx) {
  initAudio();
  state.currentLevel = idx;
  for (let i = 0; i < 6; i++) {
    document.getElementById(`lvl${i}`).classList.toggle('active', i === idx);
  }
  const l = LEVELS[idx];
  document.getElementById('sliderSpeed').value = l.speed;
  document.getElementById('sliderFilter').value = l.filter;
  document.getElementById('sliderDelay').value = l.delay;
  document.getElementById('sliderReverb').value = l.reverb;

  syncXYPadFromSliders(l.speed, l.filter);
  applyParameters();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function syncXYPadFromSliders(speed, filter) {
  const x = Math.max(0, Math.min(1, (speed - 0.25) / 1.15));
  const y = Math.max(0, Math.min(1, 1 - (filter - 160) / (18000 - 160)));
  state.xyState = { x, y };
  const cursor = document.getElementById('xyCursor');
  cursor.style.left = (x * 100) + '%';
  cursor.style.top = (y * 100) + '%';
  document.getElementById('xyCoords').textContent = `X: ${Math.round(x * 100)}% | Y: ${Math.round((1 - y) * 100)}%`;
}

export function updateFromSliders(syncXY) {
  const speed = parseFloat(document.getElementById('sliderSpeed').value);
  const filter = parseFloat(document.getElementById('sliderFilter').value);
  if (syncXY) syncXYPadFromSliders(speed, filter);
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
    if (state.masterFilter) state.masterFilter.frequency.setTargetAtTime(filter, state.audioCtx.currentTime, 0.1);
    if (state.feedbackGain) state.feedbackGain.gain.setTargetAtTime(delay, state.audioCtx.currentTime, 0.1);
    if (state.reverbGain) state.reverbGain.gain.setTargetAtTime(reverb, state.audioCtx.currentTime, 0.1);
    state.stemSources.forEach(s => { if (s) s.playbackRate.setTargetAtTime(speed, state.audioCtx.currentTime, 0.1); });
    state.synthNodes.forEach(s => {
      if (!s.isLfo) s.osc.frequency.setTargetAtTime(s.base * speed, state.audioCtx.currentTime, 0.1);
    });
  }

  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function triggerKick(withPiafCue) {
  initAudio();
  const now = state.audioCtx.currentTime;

  if (withPiafCue) {
    [392.0, 440.0, 493.88, 523.25].forEach((nFreq, idx) => {
      const o = state.audioCtx.createOscillator();
      const g = state.audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(nFreq, now + idx * 0.14);
      g.gain.setValueAtTime(0.08, now + idx * 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.13);
      o.connect(state.masterFilter);
      o.start(now + idx * 0.14);
      o.stop(now + idx * 0.14 + 0.14);
    });
  }

  [55, 110, 164.81].forEach(freq => {
    const osc = state.audioCtx.createOscillator();
    const flt = state.audioCtx.createBiquadFilter();
    const g = state.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + 0.55);
    osc.frequency.linearRampToValueAtTime(freq * 0.95, now + 3.0);
    flt.type = 'lowpass';
    flt.frequency.setValueAtTime(180, now + 0.55);
    flt.frequency.exponentialRampToValueAtTime(2000, now + 0.95);
    g.gain.setValueAtTime(0.01, now + 0.55);
    g.gain.linearRampToValueAtTime(0.28, now + 0.75);
    g.gain.exponentialRampToValueAtTime(0.001, now + 3.1);
    osc.connect(flt);
    flt.connect(g);
    g.connect(state.compressor);
    osc.start(now + 0.55);
    osc.stop(now + 3.15);
  });

  selectLevel(4);
  setTimeout(() => selectLevel(0), 3100);
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
        try {
          const buffer = await state.audioCtx.decodeAudioData(arr);
          const reverse = Math.random() > 0.4;
          if (reverse) {
            for (let c = 0; c < buffer.numberOfChannels; c++) {
              Array.prototype.reverse.call(buffer.getChannelData(c));
            }
          }
          const src = state.audioCtx.createBufferSource();
          const g = state.audioCtx.createGain();
          src.buffer = buffer;
          src.playbackRate.value = 0.62;
          g.gain.value = 0.75;
          src.connect(g);
          g.connect(state.convolverNode);
          g.connect(state.delayNode);
          src.start();
          const status = document.getElementById('sensorStatus');
          if (status) status.textContent = reverse
            ? 'Memory Catcher: Eco reverso projetado no sonho.'
            : 'Memory Catcher: Fragmento desacelerado projetado.';
        } catch (e) {}
      } catch (e) {}
    };
    recorder.start();
    setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 2800);
  } catch (e) {}
}
