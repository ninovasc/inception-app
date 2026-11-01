import { state } from './state.js';

let lastMotionTs = 0;

export async function toggleMic() {
  // initAudio provided by audio module; lazy import to avoid cycles
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = document.getElementById('btnMic');
  if (!state.isMicOn) {
    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.micSource = state.audioCtx.createMediaStreamSource(state.micStream);
      state.micAnalyser = state.audioCtx.createAnalyser();
      state.micAnalyser.fftSize = 128;
      // Canal independente do mic
      state.micSource.connect(state.micAnalyser);
      state.micSource.connect(state.micGainNode);
      state.isMicOn = true;
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = 'Mic: ON';
      setSensorStatus('Microfone ligado.');
      // Iniciar noise gate + LED
      startMicGate();
      applyMicPreset(state.micPreset);
    } catch (e) {
      setSensorStatus('Permissão de microfone negada.');
    }
  } else {
    if (state.micStream) state.micStream.getTracks().forEach(track => track.stop());
    if (state.micSource) { try { state.micSource.disconnect(); } catch (e) {} }
    stopMicPitchShift();
    stopMicGate();
    state.isMicOn = false;
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Mic: OFF';
    setSensorStatus('Microfone desligado.');
  }
}

export async function toggleMotion() {
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = document.getElementById('btnMotion');
  if (!state.isMotionOn) {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          setSensorStatus('Permissão de Giroscópio negada.');
          return;
        }
      }
      window.addEventListener('devicemotion', motionHandler);
      state.isMotionOn = true;
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = 'Giro: ON';
      setSensorStatus('Giroscópio ligado.');
    } catch (e) {
      setSensorStatus('Erro ao ligar Giroscópio.');
    }
  } else {
    window.removeEventListener('devicemotion', motionHandler);
    state.isMotionOn = false;
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Giro: OFF';
    setSensorStatus('Giroscópio desligado.');
  }
}

export function motionHandler(e) {
  if (!state.isMotionOn) return;
  const nowMs = Date.now();
  // throttle to ~10Hz
  if (nowMs - lastMotionTs < 100) return;
  lastMotionTs = nowMs;

  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const force = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

  // Auto-Kick detection
  if (state.isAutoKickOn && nowMs - state.lastKickTime > 6000) {
    if (force < 3.2) {
      state.freefallTimestamp = nowMs;
    } else if (force > 21.0 || (state.freefallTimestamp > 0 && nowMs - state.freefallTimestamp < 900 && force > 13.5)) {
      state.freefallTimestamp = 0;
      state.lastKickTime = nowMs;
      setSensorStatus('QUEDA LIVRE DETECTADA: Disparando Auto-Kick!');
      import('./audio.js').then(a => a.triggerKick(true));
      return;
    }
  }

  const intensity = Math.min(1, Math.abs(force - 9.81) / 10);
  if (intensity > 0.05) {
    const mappedSpeed = 0.5 + intensity * 0.8;
    document.getElementById('sliderSpeed').value = mappedSpeed;
    import('./audio.js').then(a => {
      a.syncXYPadFromSliders(mappedSpeed, parseFloat(document.getElementById('sliderFilter').value));
      a.applyParameters();
    });
  }
}

export function orientationHandler(e) {
  if (e.beta !== null) {
    const b = Math.abs(e.beta);
    state.isPhoneFaceDown = (b > 145 && b <= 180);
  }

  if (!state.isSpatial3DOn || !state.stereoPanner || !state.stereoPanner.pan) return;
  if (e.alpha !== null) {
    if (state.baseCompassAlpha === null) state.baseCompassAlpha = e.alpha;
    let diff = e.alpha - state.baseCompassAlpha;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const panVal = Math.max(-1, Math.min(1, diff / 65));
    state.stereoPanner.pan.setTargetAtTime(panVal, state.audioCtx.currentTime, 0.08);
    const sub = document.getElementById('subSpatial3D');
    if (sub) sub.textContent = `PAN: ${Math.round(panVal * 100)}%`;
  }
}

export function toggleGPS() {
  const btn = document.getElementById('btnGps');

  if (!state.isGpsOn && state.gpsWatchId === null) {
    if (!('geolocation' in navigator)) {
      setSensorStatus('GPS não suportado.');
      return;
    }
    setSensorStatus('Ativando GPS...');
    let lastGpsUpdate = 0;
    state.gpsWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        state.isGpsOn = true;
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = 'GPS: ON';
        const now = Date.now();
        if (now - lastGpsUpdate < 60000) return;
        lastGpsUpdate = now;
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=rain,is_day`);
          const data = await res.json();
          if (data.current.rain > 0) (await import('./audio.js')).selectLevel(1);
          else if (data.current.is_day === 0) (await import('./audio.js')).selectLevel(2);
          else (await import('./audio.js')).selectLevel(0);
          setSensorStatus('GPS ligado e clima sincronizado.');
        } catch (e) {
          setSensorStatus('GPS ligado (sem conexão de clima).');
        }
      },
      () => {
        state.isGpsOn = false;
        if (state.gpsWatchId !== null) { navigator.geolocation.clearWatch(state.gpsWatchId); state.gpsWatchId = null; }
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = 'GPS: OFF';
        setSensorStatus('GPS negado nos Ajustes do iOS.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  } else {
    if (state.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(state.gpsWatchId);
      state.gpsWatchId = null;
    }
    state.isGpsOn = false;
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'GPS: OFF';
    setSensorStatus('GPS desligado.');
  }
}

let micGateInterval = null;
let micPitchNode = null;
let micPitchBypass = null;

export function startMicGate() {
  if (micGateInterval) clearInterval(micGateInterval);
  micGateInterval = setInterval(() => {
    if (!state.isMicOn || !state.micAnalyser) return;
    const arr = new Uint8Array(state.micAnalyser.frequencyBinCount);
    state.micAnalyser.getByteFrequencyData(arr);
    const level = arr.reduce((a, b) => a + b, 0) / arr.length;
    const db = 20 * Math.log10(level / 255 + 1e-6);
    const open = db > state.micGateThreshold;
    state.micLedOn = open;
    // Gate: reduzir gain quando fechado
    if (state.micGainNode) {
      const target = open ? 1.0 : 0.0;
      state.micGainNode.gain.setTargetAtTime(target, state.audioCtx.currentTime, 0.05);
    }
    // LED
    const led = document.getElementById('micLed');
    if (led) led.classList.toggle('on', open);
    const ledLabel = document.getElementById('micLedLabel');
    if (ledLabel) ledLabel.textContent = open ? 'LED: capturando' : 'LED: silêncio';
  }, 100);
}

export function stopMicGate() {
  if (micGateInterval) { clearInterval(micGateInterval); micGateInterval = null; }
  state.micLedOn = false;
  const led = document.getElementById('micLed');
  if (led) led.classList.remove('on');
}

export const MIC_PRESETS = {
  limpo: { gate: -30, delay: 0.08, feedback: 0.05, reverb: 0.10, dry: 0.90, wet: 0.10, pitch: 0 },
  onirico: { gate: -40, delay: 0.40, feedback: 0.30, reverb: 0.40, dry: 0.70, wet: 0.30, pitch: 1 },
  abismo: { gate: -50, delay: 0.70, feedback: 0.50, reverb: 0.70, dry: 0.50, wet: 0.50, pitch: 3 },
  fantasma: { gate: -35, delay: 0.12, feedback: 0.10, reverb: 0.25, dry: 0.80, wet: 0.20, pitch: 3 }
};

export function applyMicPreset(name) {
  const p = MIC_PRESETS[name];
  if (!p) return;
  state.micPreset = name;
  state.micGateThreshold = p.gate;
  if (state.micDelay) state.micDelay.delayTime.setTargetAtTime(p.delay, state.audioCtx.currentTime, 0.1);
  if (state.micFeedback) state.micFeedback.gain.setTargetAtTime(p.feedback, state.audioCtx.currentTime, 0.1);
  if (state.micReverbSend) state.micReverbSend.gain.setTargetAtTime(p.reverb, state.audioCtx.currentTime, 0.1);
  if (state.micDry) state.micDry.gain.setTargetAtTime(p.dry, state.audioCtx.currentTime, 0.1);
  if (state.micWet) state.micWet.gain.setTargetAtTime(p.wet, state.audioCtx.currentTime, 0.1);
  // pitch shift
  if (p.pitch && p.pitch !== 0) {
    startMicPitchShift(p.pitch);
  } else {
    stopMicPitchShift();
  }
  // update sliders to preset values
  const gateEl = document.getElementById('micGate');
  const delayEl = document.getElementById('micDelaySlider');
  const fbEl = document.getElementById('micFb');
  const revEl = document.getElementById('micRev');
  const dwEl = document.getElementById('micDw');
  if (gateEl) { gateEl.value = p.gate; document.getElementById('micGateVal').textContent = p.gate + ' dB'; }
  if (delayEl) { delayEl.value = p.delay; document.getElementById('micDelayVal').textContent = p.delay.toFixed(2) + 's'; }
  if (fbEl) { fbEl.value = p.feedback; document.getElementById('micFbVal').textContent = Math.round(p.feedback * 100) + '%'; }
  if (revEl) { revEl.value = p.reverb; document.getElementById('micRevVal').textContent = Math.round(p.reverb * 100) + '%'; }
  if (dwEl) { dwEl.value = p.wet; document.getElementById('micDwVal').textContent = Math.round(p.dry * 100) + '/' + Math.round(p.wet * 100); }
  // update UI
  document.querySelectorAll('.mic-preset').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setMicParam(param, val) {
  const v = parseFloat(val);
  // switch to custom (deactivate presets)
  state.micPreset = 'custom';
  document.querySelectorAll('.mic-preset').forEach(b => b.classList.remove('active'));
  switch (param) {
    case 'gate':
      state.micGateThreshold = v;
      document.getElementById('micGateVal').textContent = v + ' dB';
      break;
    case 'delay':
      if (state.micDelay) state.micDelay.delayTime.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      document.getElementById('micDelayVal').textContent = v.toFixed(2) + 's';
      break;
    case 'feedback':
      if (state.micFeedback) state.micFeedback.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      document.getElementById('micFbVal').textContent = Math.round(v * 100) + '%';
      break;
    case 'reverb':
      if (state.micReverbSend) state.micReverbSend.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      document.getElementById('micRevVal').textContent = Math.round(v * 100) + '%';
      break;
    case 'dw':
      if (state.micDry) state.micDry.gain.setTargetAtTime(1 - v, state.audioCtx.currentTime, 0.1);
      if (state.micWet) state.micWet.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      document.getElementById('micDwVal').textContent = Math.round((1 - v) * 100) + '/' + Math.round(v * 100);
      break;
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function startMicPitchShift(semitones) {
  stopMicPitchShift();
  if (!state.micSource || !state.audioCtx) return;
  const factor = Math.pow(2, semitones / 12);
  const bufferSize = 4096;
  const node = state.audioCtx.createScriptProcessor(bufferSize, 1, 1);
  const buffer = new Float32Array(bufferSize * 4);
  let writeIdx = 0;
  let readIdx = 0;
  node.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < input.length; i++) {
      buffer[writeIdx] = input[i];
      writeIdx = (writeIdx + 1) % buffer.length;
    }
    for (let i = 0; i < output.length; i++) {
      const idx = Math.floor(readIdx);
      const frac = readIdx - idx;
      const a = buffer[idx % buffer.length];
      const b = buffer[(idx + 1) % buffer.length];
      output[i] = a + (b - a) * frac;
      readIdx += factor;
      if (readIdx >= buffer.length) readIdx -= buffer.length;
    }
  };
  // reconnect: micSource -> pitchNode -> micGainNode
  try { state.micSource.disconnect(state.micGainNode); } catch (e) {}
  state.micSource.connect(node);
  node.connect(state.micGainNode);
  micPitchNode = node;
}

export function stopMicPitchShift() {
  if (micPitchNode) {
    try { state.micSource.disconnect(micPitchNode); } catch (e) {}
    try { micPitchNode.disconnect(); } catch (e) {}
    micPitchNode = null;
    // reconnect direct
    try { state.micSource.connect(state.micGainNode); } catch (e) {}
  }
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}
