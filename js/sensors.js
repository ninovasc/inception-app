// js/sensors.js - Sensors Module with Dependency Injection
// @ts-nocheck
import { state } from './state.js';
import { t } from './i18n.js';
import {
  WORLD_NAMES, WORLD_VOICE_PRESETS,
  MIC_RAIN_INTENSE_DB, MIC_RAIN_INTENSE_HOLD_SEC, TRIGGER_CLAP_WINDOW_SEC,
  TRIGGER_INVERTED_DEG, TRIGGER_INVERTED_HOLD_SEC, TRIGGER_FLAT_DEG, TRIGGER_FLAT_HOLD_SEC
} from './config.js';
import { updateFromSliders } from './audio.js';
import * as browser from './browser.js';

let lastMotionTs = 0;
let lastGyroTs = 0;
let orientationWatching = false;
let micGateInterval = null;
let micPitchNode = null;
let micPitchBypass = null;
let prevMicDb = -90;
let lastClapTransientTs = 0;

export const MIC_PRESETS = JSON.parse(JSON.stringify(WORLD_VOICE_PRESETS));

// Create dependency context for injection
export function createSensorsContext(deps = {}) {
  const ctx = {
    state: deps.state || state,
    browser: deps.browser || browser,
    t: deps.t || t,
    WORLD_NAMES: deps.WORLD_NAMES || WORLD_NAMES,
    WORLD_VOICE_PRESETS: deps.WORLD_VOICE_PRESETS || WORLD_VOICE_PRESETS,
    MIC_RAIN_INTENSE_DB: deps.MIC_RAIN_INTENSE_DB || MIC_RAIN_INTENSE_DB,
    MIC_RAIN_INTENSE_HOLD_SEC: deps.MIC_RAIN_INTENSE_HOLD_SEC || MIC_RAIN_INTENSE_HOLD_SEC,
    TRIGGER_CLAP_WINDOW_SEC: deps.TRIGGER_CLAP_WINDOW_SEC || TRIGGER_CLAP_WINDOW_SEC,
    TRIGGER_INVERTED_DEG: deps.TRIGGER_INVERTED_DEG || TRIGGER_INVERTED_DEG,
    TRIGGER_INVERTED_HOLD_SEC: deps.TRIGGER_INVERTED_HOLD_SEC || TRIGGER_INVERTED_HOLD_SEC,
    TRIGGER_FLAT_DEG: deps.TRIGGER_FLAT_DEG || TRIGGER_FLAT_DEG,
    TRIGGER_FLAT_HOLD_SEC: deps.TRIGGER_FLAT_HOLD_SEC || TRIGGER_FLAT_HOLD_SEC,
    updateFromSliders: deps.updateFromSliders || updateFromSliders,
    MIC_PRESETS: deps.MIC_PRESETS || MIC_PRESETS,
    // Orchestrator functions
    toggleMic: () => toggleMic(ctx),
    toggleMotion: () => toggleMotion(ctx),
    toggleGPS: () => toggleGPS(ctx),
    startOrientationWatch: () => startOrientationWatch(ctx),
    motionHandler: (e) => motionHandler(e, ctx),
    orientationHandler: (e) => orientationHandler(e, ctx),
    startMicGate: () => startMicGate(ctx),
    stopMicGate: () => stopMicGate(ctx),
    applyMicPreset: (name) => applyMicPreset(name, ctx),
    setMicParam: (param, val) => setMicParam(param, val, ctx),
    startMicPitchShift: (semitones) => startMicPitchShift(semitones, ctx),
    stopMicPitchShift: () => stopMicPitchShift(ctx),
    setSensorStatus: (msg) => setSensorStatus(msg, ctx),
    syncSensorsUI: () => syncSensorsUI(ctx),
  };
  return ctx;
}

// Pure functions - testable without mocks
export function calculateForce(acceleration) {
  if (!acceleration) return 0;
  return Math.sqrt(
    (acceleration.x || 0) ** 2 + 
    (acceleration.y || 0) ** 2 + 
    (acceleration.z || 0) ** 2
  );
}

export function calculateIntensity(force) {
  return Math.min(1, Math.abs(force - 9.81) / 10);
}

export function mapSpeedFromIntensity(intensity) {
  return 0.5 + intensity * 0.8;
}

export function isFreefallDetected(force, freefallTimestamp, nowMs, lastKickTime, isAutoKickOn) {
  if (!isAutoKickOn || nowMs - lastKickTime <= 6000) return false;
  if (force < 3.2) return 'freefall_start';
  if (force > 21.0 || (freefallTimestamp > 0 && nowMs - freefallTimestamp < 900 && force > 13.5)) {
    return 'freefall_impact';
  }
  return false;
}

export function calculateGyroSliders(beta, gamma, alpha) {
  const bn = Math.abs(beta) / 180;
  const gn = Math.abs(gamma) / 90;
  const an = Math.abs(alpha) / 360;
  
  return {
    speed: 0.4 + 0.6 * Math.sin(bn * Math.PI) + 0.2 * (gn * gn),
    filter: 200 + ((1 - Math.cos(gn * Math.PI)) / 2) * (18000 - 200),
    delay: 0.05 + Math.abs(Math.sin(bn * gn * Math.PI)) * 0.8,
    reverb: 0.05 + bn * gn * 0.9,
    gate: -60 + 50 * Math.abs(Math.sin(beta * Math.PI / 180) * Math.cos(gamma * Math.PI / 90)),
    delayV: Math.abs(Math.sin(beta * gn * Math.PI)) * 1,
    feedback: bn * gn * 0.8,
    reverbV: (1 - Math.cos(gn * Math.PI)) / 2,
    dryWet: (Math.abs(alpha) / 360) * 0.5 + 0.5,
  };
}

export function calculatePanValue(alpha, baseCompassAlpha) {
  if (baseCompassAlpha === null) return 0;
  let diff = alpha - baseCompassAlpha;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return Math.max(-1, Math.min(1, diff / 65));
}

export function calculateMicDb(level) {
  return 20 * Math.log10(level / 255 + 1e-6);
}

export function isGateOpen(db, threshold) {
  return db > threshold;
}

export function detectClap(db, prevDb, nowTs, lastClapTs, windowSec) {
  if (db > -10 && prevDb < -18 && (nowTs - lastClapTs) > 150) {
    if (lastClapTs > 0 && (nowTs - lastClapTs) <= windowSec * 1000) {
      return true;
    }
  }
  return false;
}

export function updateOrientationTriggers(beta, gamma, now, ctx) {
  const { state, TRIGGER_INVERTED_DEG, TRIGGER_INVERTED_HOLD_SEC, TRIGGER_FLAT_DEG, TRIGGER_FLAT_HOLD_SEC } = ctx;
  
  const b = Math.abs(beta);
  const g = (gamma !== null) ? Math.abs(gamma) : null;
  
  const inverted = b > TRIGGER_INVERTED_DEG;
  if (inverted) {
    if (state.invertedSince == null) state.invertedSince = now;
    state.isInvertedHold = (now - state.invertedSince) >= TRIGGER_INVERTED_HOLD_SEC * 1000;
  } else {
    state.invertedSince = null;
    state.isInvertedHold = false;
  }
  
  const flat = b <= TRIGGER_FLAT_DEG && g !== null && g <= TRIGGER_FLAT_DEG;
  if (flat) {
    if (state.flatSince == null) state.flatSince = now;
    state.isFlatHold = (now - state.flatSince) >= TRIGGER_FLAT_HOLD_SEC * 1000;
  } else {
    state.flatSince = null;
    state.isFlatHold = false;
  }
  
  state.isPhoneFaceDown = (b > 145 && b <= 180);
}

// Orchestrator functions with dependency injection
export async function toggleMic(ctx = createSensorsContext()) {
  const { state, browser, t, WORLD_NAMES, startMicGate, applyMicPreset, stopMicPitchShift, stopMicGate } = ctx;
  
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = browser.getElement('btnMic');
  
  if (!state.isMicOn) {
    try {
      state.micStream = await browser.getUserMedia({ audio: true });
      state.micSource = state.audioCtx.createMediaStreamSource(state.micStream);
      state.micAnalyser = state.audioCtx.createAnalyser();
      state.micAnalyser.fftSize = 128;
      state.micSource.connect(state.micAnalyser);
      state.micSource.connect(state.micGainNode);
      state.isMicOn = true;
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = t('btn.mic') + ': ON';
      }
      setSensorStatus('Microfone ligado.', ctx);
      browser.querySelectorAll('.mic-preset, #voicePanel input[type=range]').forEach(el => {
        el.style.opacity = '1';
        el.removeAttribute('disabled');
      });
      startMicGate(ctx);
      applyMicPreset(state.micPreset || WORLD_NAMES[0], ctx);
    } catch (e) {
      setSensorStatus('Permissão de microfone negada.', ctx);
    }
  } else {
    if (state.micStream) state.micStream.getTracks().forEach(track => track.stop());
    if (state.micSource) { try { state.micSource.disconnect(); } catch (e) {} }
    stopMicPitchShift(ctx);
    stopMicGate(ctx);
    state.isMicOn = false;
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = t('btn.mic') + ': OFF';
    }
    setSensorStatus('Microfone desligado.', ctx);
    browser.querySelectorAll('.mic-preset, #voicePanel input[type=range]').forEach(el => {
      el.style.opacity = '0.4';
      el.setAttribute('disabled', 'true');
    });
  }
}

export async function toggleMotion(ctx = createSensorsContext()) {
  const { state, browser, t } = ctx;
  
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = browser.getElement('btnMotion');
  
  if (!state.isMotionOn) {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          setSensorStatus('Permissão de Giroscópio negada.', ctx);
          return;
        }
      }
      browser.addEventListener('devicemotion', (e) => motionHandler(e, ctx));
      state.isMotionOn = true;
      if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = t('btn.motion') + ': ON';
      }
      setSensorStatus('Giroscópio ligado.', ctx);
    } catch (e) {
      setSensorStatus('Erro ao ligar Giroscópio.', ctx);
    }
  } else {
    browser.removeEventListener('devicemotion', (e) => motionHandler(e, ctx));
    state.isMotionOn = false;
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = t('btn.motion') + ': OFF';
    }
    setSensorStatus('Giroscópio desligado.', ctx);
  }
}

export function motionHandler(e, ctx = createSensorsContext()) {
  const { state, browser, updateFromSliders } = ctx;
  
  if (!state.isMotionOn) return;
  if (!state.isPlaying) return;
  
  const nowMs = Date.now();
  if (nowMs - lastMotionTs < 100) return;
  lastMotionTs = nowMs;

  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  
  const force = calculateForce(acc);
  
  // Auto-Kick detection
  const freefallResult = isFreefallDetected(force, state.freefallTimestamp, nowMs, state.lastKickTime, state.isAutoKickOn);
  if (freefallResult === 'freefall_start') {
    state.freefallTimestamp = nowMs;
  } else if (freefallResult === 'freefall_impact') {
    state.freefallTimestamp = 0;
    state.lastKickTime = nowMs;
    setSensorStatus('QUEDA LIVRE DETECTADA: Disparando Auto-Kick!', ctx);
    import('./audio.js').then(a => a.triggerKick(true));
    return;
  }

  const intensity = calculateIntensity(force);
  state.motionIntensity = intensity;
  
  if (intensity > 0.05) {
    const mappedSpeed = mapSpeedFromIntensity(intensity);
    const speedEl = browser.getElement('sliderSpeed');
    if (speedEl) speedEl.value = mappedSpeed;
    import('./audio.js').then(a => {
      const filterEl = browser.getElement('sliderFilter');
      a.syncXYPadFromSliders(mappedSpeed, parseFloat(filterEl?.value || 0));
      a.applyParameters();
    });
  }
}

export function orientationHandler(e, ctx = createSensorsContext()) {
  const { state, browser, t, updateFromSliders, TRIGGER_INVERTED_DEG, TRIGGER_INVERTED_HOLD_SEC, TRIGGER_FLAT_DEG, TRIGGER_FLAT_HOLD_SEC } = ctx;
  
  if (!state.isPlaying) return;
  
  if (e.beta !== null) {
    updateOrientationTriggers(e.beta, e.gamma, Date.now(), ctx);
    
    // Giroscópio → Sliders (modo opcional)
    if (state.isGyroSlidersOn && state.isPlaying) {
      const nowMs = Date.now();
      if (nowMs - lastGyroTs > 200) {
        lastGyroTs = nowMs;
        
        const sliders = calculateGyroSliders(e.beta || 0, e.gamma || 0, e.alpha || 0);
        
        const speedEl = browser.getElement('sliderSpeed');
        const filterEl = browser.getElement('sliderFilter');
        const delayEl = browser.getElement('sliderDelay');
        const reverbEl = browser.getElement('sliderReverb');
        
        if (speedEl) speedEl.value = Math.max(0.25, Math.min(1.4, sliders.speed)).toFixed(2);
        if (filterEl) filterEl.value = Math.round(Math.max(160, Math.min(18000, sliders.filter)));
        if (delayEl) delayEl.value = Math.max(0, Math.min(0.85, sliders.delay)).toFixed(2);
        if (reverbEl) reverbEl.value = Math.max(0, Math.min(1, sliders.reverb)).toFixed(2);
        
        updateFromSliders(false);
        
        if (typeof setMicParam === 'function') {
          setMicParam('gate', Math.max(-60, Math.min(-10, sliders.gate)));
          setMicParam('delay', Math.max(0, Math.min(1, sliders.delayV)));
          setMicParam('feedback', Math.max(0, Math.min(0.8, sliders.feedback)));
          setMicParam('reverb', Math.max(0, Math.min(1, sliders.reverbV)));
          setMicParam('dw', Math.max(0, Math.min(1, sliders.dryWet)));
        }
      }
    }
  }

  if (!state.isSpatial3DOn || !state.stereoPanner || !state.stereoPanner.pan) return;
  if (e.alpha !== null) {
    if (state.baseCompassAlpha === null) state.baseCompassAlpha = e.alpha;
    const panVal = calculatePanValue(e.alpha, state.baseCompassAlpha);
    state.stereoPanner.pan.setTargetAtTime(panVal, state.audioCtx.currentTime, 0.08);
    const sub = browser.getElement('subSpatial3D');
    if (sub) sub.textContent = `PAN: ${Math.round(panVal * 100)}%`;
  }
}

export function startOrientationWatch(ctx = createSensorsContext()) {
  const { browser } = ctx;
  if (orientationWatching) return;
  orientationWatching = true;
  browser.addEventListener('deviceorientation', (e) => orientationHandler(e, ctx));
}

export function toggleGPS(ctx = createSensorsContext()) {
  const { state, browser, t } = ctx;
  const btn = browser.getElement('btnGps');

  if (!state.isGpsOn && state.gpsWatchId === null) {
    if (!('geolocation' in navigator)) {
      setSensorStatus('GPS não suportado.', ctx);
      return;
    }
    setSensorStatus('Ativando GPS...', ctx);
    let lastGpsUpdate = 0;
    state.gpsWatchId = browser.watchPosition(
      async (pos) => {
        state.isGpsOn = true;
        if (btn) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          btn.textContent = t('btn.gps') + ': ON';
        }
        state.gpsSpeedMps = (pos.coords && typeof pos.coords.speed === 'number' && !isNaN(pos.coords.speed))
          ? Math.max(0, pos.coords.speed) : 0;
        const now = Date.now();
        if (now - lastGpsUpdate < 60000) return;
        lastGpsUpdate = now;
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=rain,is_day`);
          const data = await res.json();
          state.gpsRain = data.current.rain > 0;
          state.gpsNight = data.current.is_day === 0;
          setSensorStatus('GPS ligado e clima sincronizado.', ctx);
        } catch (e) {
          setSensorStatus('GPS ligado (sem conexão de clima).', ctx);
        }
      },
      () => {
        state.isGpsOn = false;
        state.gpsSpeedMps = 0;
        if (state.gpsWatchId !== null) { browser.clearWatch(); state.gpsWatchId = null; }
        if (btn) {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
          btn.textContent = t('btn.gps') + ': OFF';
        }
        setSensorStatus('GPS negado nos Ajustes do iOS.', ctx);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  } else {
    if (state.gpsWatchId !== null) {
      browser.clearWatch();
      state.gpsWatchId = null;
    }
    state.isGpsOn = false;
    state.gpsSpeedMps = 0;
    if (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = t('btn.gps') + ': OFF';
    }
    setSensorStatus('GPS desligado.', ctx);
  }
}

export function startMicGate(ctx = createSensorsContext()) {
  const { state, browser, MIC_RAIN_INTENSE_DB, TRIGGER_CLAP_WINDOW_SEC } = ctx;
  
  if (micGateInterval) clearInterval(micGateInterval);
  micGateInterval = setInterval(() => {
    if (!state.isMicOn || !state.micAnalyser) return;
    const arr = new Uint8Array(state.micAnalyser.frequencyBinCount);
    state.micAnalyser.getByteFrequencyData(arr);
    const level = arr.reduce((a, b) => a + b, 0) / arr.length;
    const db = calculateMicDb(level);
    const open = isGateOpen(db, state.micGateThreshold);
    state.micLedOn = open;
    
    if (open) state.micSilenceSec = 0;
    else state.micSilenceSec = Math.min(3600, state.micSilenceSec + 0.1);
    
    if (db > MIC_RAIN_INTENSE_DB) {
      state.micRainIntenseSec = Math.min(600, (state.micRainIntenseSec || 0) + 0.1);
    } else {
      state.micRainIntenseSec = 0;
    }
    
    const nowTs = Date.now();
    if (detectClap(db, prevMicDb, nowTs, lastClapTransientTs, TRIGGER_CLAP_WINDOW_SEC)) {
      state.lastClapTime = nowTs;
      setSensorStatus('Palmas detectadas: combinação 5-2-8-4-9-1.', ctx);
    }
    lastClapTransientTs = nowTs;
    prevMicDb = db;
    
    if (state.micGainNode) {
      const target = open ? 1.0 : 0.0;
      state.micGainNode.gain.setTargetAtTime(target, state.audioCtx.currentTime, 0.05);
    }
    
    const led = browser.getElement('micLed');
    if (led) led.classList.toggle('on', open);
    const ledLabel = browser.getElement('micLedLabel');
    if (ledLabel) ledLabel.textContent = open ? 'LED: capturando' : 'LED: silêncio';
  }, 100);
}

export function stopMicGate(ctx = createSensorsContext()) {
  const { browser } = ctx;
  if (micGateInterval) { clearInterval(micGateInterval); micGateInterval = null; }
  state.micLedOn = false;
  state.micSilenceSec = 0;
  state.micRainIntenseSec = 0;
  prevMicDb = -90;
  lastClapTransientTs = 0;
  const led = browser.getElement('micLed');
  if (led) led.classList.remove('on');
}

export function applyMicPreset(name, ctx = createSensorsContext()) {
  const { state, browser, t, WORLD_VOICE_PRESETS, MIC_PRESETS } = ctx;
  
  const p = MIC_PRESETS[name];
  if (!p) return;
  state.micPreset = name;
  state.micGateThreshold = p.gate;
  if (state.micDelay) state.micDelay.delayTime.setTargetAtTime(p.delay, state.audioCtx.currentTime, 0.1);
  if (state.micFeedback) state.micFeedback.gain.setTargetAtTime(p.feedback, state.audioCtx.currentTime, 0.1);
  if (state.micReverbSend) state.micReverbSend.gain.setTargetAtTime(p.reverb, state.audioCtx.currentTime, 0.1);
  if (state.micDry) state.micDry.gain.setTargetAtTime(p.dry, state.audioCtx.currentTime, 0.1);
  if (state.micWet) state.micWet.gain.setTargetAtTime(p.wet, state.audioCtx.currentTime, 0.1);
  
  if (p.pitch && p.pitch !== 0) {
    startMicPitchShift(p.pitch, ctx);
  } else {
    stopMicPitchShift(ctx);
  }
  
  const gateEl = browser.getElement('micGate');
  const delayEl = browser.getElement('micDelaySlider');
  const fbEl = browser.getElement('micFb');
  const revEl = browser.getElement('micRev');
  const dwEl = browser.getElement('micDw');
  
  if (gateEl) { gateEl.value = p.gate; browser.getElement('micGateVal').textContent = p.gate + ' dB'; }
  if (delayEl) { delayEl.value = p.delay; browser.getElement('micDelayVal').textContent = p.delay.toFixed(2) + 's'; }
  if (fbEl) { fbEl.value = p.feedback; browser.getElement('micFbVal').textContent = Math.round(p.feedback * 100) + '%'; }
  if (revEl) { revEl.value = p.reverb; browser.getElement('micRevVal').textContent = Math.round(p.reverb * 100) + '%'; }
  if (dwEl) { dwEl.value = p.wet; browser.getElement('micDwVal').textContent = Math.round(p.dry * 100) + '/' + Math.round(p.wet * 100); }
  
  const sel = browser.getElement('voicePresetSelect');
  if (sel) {
    const has = Array.from(sel.options).some(o => o.value === name);
    if (has) sel.value = name; else sel.value = 'custom';
  }
  browser.querySelectorAll('.mic-preset').forEach(b => b.classList.toggle('active', b.dataset.preset === name));
}

export function setMicParam(param, val, ctx = createSensorsContext()) {
  const { state, browser } = ctx;
  
  const v = parseFloat(val);
  state.micPreset = 'custom';
  browser.querySelectorAll('.mic-preset').forEach(b => b.classList.remove('active'));
  
  switch (param) {
    case 'gate':
      state.micGateThreshold = v;
      browser.getElement('micGateVal').textContent = v + ' dB';
      break;
    case 'delay':
      if (state.micDelay) state.micDelay.delayTime.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      browser.getElement('micDelayVal').textContent = v.toFixed(2) + 's';
      break;
    case 'feedback':
      if (state.micFeedback) state.micFeedback.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      browser.getElement('micFbVal').textContent = Math.round(v * 100) + '%';
      break;
    case 'reverb':
      if (state.micReverbSend) state.micReverbSend.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      browser.getElement('micRevVal').textContent = Math.round(v * 100) + '%';
      break;
    case 'dw':
      if (state.micDry) state.micDry.gain.setTargetAtTime(1 - v, state.audioCtx.currentTime, 0.1);
      if (state.micWet) state.micWet.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
      browser.getElement('micDwVal').textContent = Math.round((1 - v) * 100) + '/' + Math.round(v * 100);
      break;
  }
}

export function startMicPitchShift(semitones, ctx = createSensorsContext()) {
  const { state } = ctx;
  
  stopMicPitchShift(ctx);
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
  
  try { state.micSource.disconnect(state.micGainNode); } catch (e) {}
  state.micSource.connect(node);
  node.connect(state.micGainNode);
  micPitchNode = node;
}

export function stopMicPitchShift(ctx = createSensorsContext()) {
  const { state } = ctx;
  
  if (micPitchNode) {
    try { state.micSource.disconnect(micPitchNode); } catch (e) {}
    try { micPitchNode.disconnect(); } catch (e) {}
    micPitchNode = null;
    try { state.micSource.connect(state.micGainNode); } catch (e) {}
  }
}

export function setSensorStatus(msg, ctx = createSensorsContext()) {
  const { browser } = ctx;
  const el = browser.getElement('sensorStatus');
  if (el) el.textContent = msg;
}

export function syncSensorsUI(ctx = createSensorsContext()) {
  const { state, browser, t } = ctx;
  
  const btnMic = browser.getElement('btnMic');
  if (btnMic) btnMic.textContent = t('btn.mic') + ': ' + (state.isMicOn ? 'ON' : 'OFF');
  const btnMotion = browser.getElement('btnMotion');
  if (btnMotion) btnMotion.textContent = t('btn.motion') + ': ' + (state.isMotionOn ? 'ON' : 'OFF');
  const btnGps = browser.getElement('btnGps');
  if (btnGps) btnGps.textContent = t('btn.gps') + ': ' + (state.isGpsOn ? 'ON' : 'OFF');
  const ledLabel = browser.getElement('micLedLabel');
  if (ledLabel) ledLabel.textContent = state.micLedOn ? t('voice.led.capturing') : t('voice.led.silence');
}

// Default export with standard context (for backward compatibility)
const defaultCtx = createSensorsContext();
export default {
  toggleMic: () => toggleMic(defaultCtx),
  toggleMotion: () => toggleMotion(defaultCtx),
  toggleGPS: () => toggleGPS(defaultCtx),
  startOrientationWatch: () => startOrientationWatch(defaultCtx),
  motionHandler: (e) => motionHandler(e, defaultCtx),
  orientationHandler: (e) => orientationHandler(e, defaultCtx),
  startMicGate: () => startMicGate(defaultCtx),
  stopMicGate: () => stopMicGate(defaultCtx),
  applyMicPreset: (name) => applyMicPreset(name, defaultCtx),
  setMicParam: (param, val) => setMicParam(param, val, defaultCtx),
  startMicPitchShift: (semitones) => startMicPitchShift(semitones, defaultCtx),
  stopMicPitchShift: () => stopMicPitchShift(defaultCtx),
  setSensorStatus: (msg) => setSensorStatus(msg, defaultCtx),
  syncSensorsUI: () => syncSensorsUI(defaultCtx),
  createSensorsContext,
  // Pure functions
  calculateForce,
  calculateIntensity,
  mapSpeedFromIntensity,
  isFreefallDetected,
  calculateGyroSliders,
  calculatePanValue,
  calculateMicDb,
  isGateOpen,
  detectClap,
  updateOrientationTriggers,
};