// js/audio.js - Audio Engine Orchestrator with Dependency Injection
// @ts-nocheck
import { state } from './state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from './config.js';
import { t } from './i18n.js';
import * as core from './audio/core.js';
import * as synth from './audio/synth.js';
import * as mp3 from './audio/mp3.js';
import * as stems from './audio/stems.js';
import * as world from './audio/world.js';
import * as effects from './audio/effects.js';
import * as mechanics from './mechanics.js';
import { renderSourceList } from './ui/commonUI.js';
import { startCapture, stopCapture } from './capture.js';
import * as browser from './browser.js';

// Re-exports from split modules
export { initAudio } from './audio/core.js';
export { selectSynthType, setSynthVolume, startSynth, stopSynth, restartSynth, startChordProgression, stopChordProgression, syncXYPadFromSliders, updateFromSliders, applyParameters } from './audio/synth.js';
export { loadStem, loadWorldMp3, computeAnchors, startMp3World, stopMp3World, stopAllMp3World, setWorldMp3Volume, crossfadeMp3Worlds } from './audio/mp3.js';
export { startStems, stopStems, setVolume } from './audio/stems.js';
export { setWorldSynth, setWorldVolume } from './audio/world.js';
export { playHeartbeatPulse, captureAndPlaySubconsciousMemory } from './audio/effects.js';

// Create dependency context for injection
export function createAudioContext(deps = {}) {
  const ctx = {
    state: deps.state || state,
    browser: deps.browser || browser,
    core: deps.core || core,
    synth: deps.synth || synth,
    mp3: deps.mp3 || mp3,
    stems: deps.stems || stems,
    world: deps.world || world,
    effects: deps.effects || effects,
    mechanics: deps.mechanics || mechanics,
    renderSourceList: deps.renderSourceList || renderSourceList,
    startCapture: deps.startCapture || startCapture,
    stopCapture: deps.stopCapture || stopCapture,
    t: deps.t || t,
    LEVELS: deps.LEVELS || LEVELS,
    WORLD_SYNTH: deps.WORLD_SYNTH || WORLD_SYNTH,
    WORLD_NAMES: deps.WORLD_NAMES || WORLD_NAMES,
    normalizeSourceType: deps.normalizeSourceType || normalizeSourceType,
    // Orchestrator functions
    setSourceMode: (worldIdx, mode) => setSourceMode(worldIdx, mode, ctx),
    triggerKick: (withPiafCue) => triggerKick(withPiafCue, ctx),
    toggleMasterPlay: () => toggleMasterPlay(ctx),
    selectLevel: (idx, preserveParams) => selectLevel(idx, preserveParams, ctx),
    restartWorldAudio: () => restartWorldAudio(ctx),
  };
  return ctx;
}

// Pure functions - testable without mocks
export function calculateCrossfadeGain(currentGain, targetGain, duration) {
  return { currentGain, targetGain, duration };
}

export function normalizeLevelIndex(idx, maxLevels) {
  return Math.max(0, Math.min(idx, maxLevels - 1));
}

export function getWorldVolume(worldVolume, idx, defaultVol = 0.2) {
  return (worldVolume && worldVolume[idx] != null) ? worldVolume[idx] : defaultVol;
}

export function getSourceMode(worldSourceType, idx, defaultMode = 'synth') {
  return (worldSourceType && worldSourceType[idx]) || defaultMode;
}

// Orchestrator functions with dependency injection
export function setSourceMode(worldIdx, mode, ctx) {
  const context = ctx || createAudioContext();
  const { state, WORLD_NAMES, normalizeSourceType, restartWorldAudio, renderSourceList } = context;
  
  // Backward compatibility: if called with just mode (worldIdx is the mode string)
  if (mode === undefined && typeof worldIdx === 'string') {
    mode = worldIdx;
    worldIdx = state.currentLevel;
  }
  const normalized = normalizeSourceType(mode);
  if (!state.worldSourceType) state.worldSourceType = Array(WORLD_NAMES.length).fill('synth');
  state.worldSourceType[worldIdx] = normalized;
  state.sourceMode = normalized;
  restartWorldAudio(context);
  renderSourceList();
}

export function triggerKick(withPiafCue, ctx = createAudioContext()) {
  const { state, core } = ctx;
  core.initAudio();
  const now = state.audioCtx.currentTime;

  if (withPiafCue) {
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
      o.type = 'sawtooth';
      f.type = 'lowpass';
      f.frequency.value = 600;
      f.Q.value = 1.2;
      o.frequency.setValueAtTime(n.f, now + n.t);
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

  // Note: selectLevel would need to be passed in or imported
  // This is a side effect that requires the full context
}

export function toggleMasterPlay(ctx = createAudioContext()) {
  const { state, browser, mechanics, stems, synth, mp3, t } = ctx;
  core.initAudio();
  
  const btn = browser.getElement('masterPlayBtn');
  const sub = browser.getElement('playSub');
  const topSt = browser.getElement('topStatus');

  if (!state.isPlaying) {
    state.isPlaying = true;
    mechanics.activateDreamDefaults();
    restartWorldAudio(ctx);

    if (btn) btn.classList.add('active');
    if (btn) btn.setAttribute('aria-pressed', 'true');
    if (sub) sub.textContent = t('status.dreaming');
    if (topSt) topSt.textContent = t('status.dreaming');
    const logo = browser.querySelector('.logo');
    if (logo) logo.classList.add('breathing');

    import('./power.js').then(p => {
      p.setupMediaSession();
      p.requestWakeLock();
      p.setMediaPlaybackState(true);
    });
  } else {
    state.isPlaying = false;
    stems.stopStems();
    synth.stopSynth();
    synth.stopChordProgression();
    mp3.stopAllMp3World();
    stopCapture();
    stopDeprivationHeartbeat();
    if (btn) btn.classList.remove('active');
    if (btn) btn.setAttribute('aria-pressed', 'false');
    if (sub) sub.textContent = t('status.stopped');
    if (topSt) topSt.textContent = t('status.stopped');
    const logo = browser.querySelector('.logo');
    if (logo) logo.classList.remove('breathing');

    import('./power.js').then(p => {
      p.releaseWakeLock();
      p.setMediaPlaybackState(false);
    });
  }
}

export function selectLevel(idx, preserveParams = false, ctx = createAudioContext()) {
  const { state, core, browser, synth, mp3, LEVELS, WORLD_SYNTH, WORLD_NAMES, normalizeSourceType, startCapture, stopCapture } = ctx;
  
  core.initAudio();

  const applyLevel = () => {
    state.currentLevel = idx;
    state.currentSynthType = (state.worldSynth && state.worldSynth[idx] != null)
      ? state.worldSynth[idx]
      : WORLD_SYNTH[idx];
    const rawType = (state.worldSourceType && state.worldSourceType[idx]) || 'synth';
    state.sourceMode = normalizeSourceType(rawType);
    if (state.worldSourceType) state.worldSourceType[idx] = state.sourceMode;

    if (state.synthMasterGain && state.audioCtx) {
      const vol = getWorldVolume(state.worldVolume, idx);
      state.synthMasterGain.gain.setTargetAtTime(vol, state.audioCtx.currentTime, 0.1);
    }

    const _colors = ['#ffffff', '#88aaff', '#ffaa88', '#ff8888', '#88ddaa', '#ddcc66',
      '#66dddd', '#cc99ff', '#999999', '#aaaaff', '#ff6699', '#ffdd88', '#88ffcc'];
    const topSt = browser.getElement('topStatus');
    if (topSt) topSt.style.color = _colors[idx];

    const worldSel = browser.getElement('worldSelect');
    if (worldSel) worldSel.value = idx;

    const l = LEVELS[idx];
    document.body.style.backgroundColor = l.bgColor;
    document.documentElement.style.backgroundColor = l.bgColor;

    const speedEl = browser.getElement('sliderSpeed');
    const filterEl = browser.getElement('sliderFilter');
    const delayEl = browser.getElement('sliderDelay');
    const reverbEl = browser.getElement('sliderReverb');
    if (!preserveParams) {
      if (speedEl) speedEl.value = l.speed;
      if (filterEl) filterEl.value = l.filter;
      if (delayEl) delayEl.value = l.delay;
      if (reverbEl) reverbEl.value = l.reverb;
    }
    const curSpeed = speedEl ? parseFloat(speedEl.value) : l.speed;
    const curFilter = filterEl ? parseFloat(filterEl.value) : l.filter;
    synth.syncXYPadFromSliders(curSpeed, curFilter);
    synth.applyParameters();

    if (state.isPlaying) {
      synth.stopSynth(500);
      synth.stopChordProgression();
      const oldMp3Idx = state.currentLevel !== idx ? state.currentLevel : -1;
      if (oldMp3Idx >= 0 && state.worldSourceType[oldMp3Idx] === 'mp3' && state.worldSourceType[idx] === 'mp3') {
        mp3.crossfadeMp3Worlds(oldMp3Idx, idx);
      } else {
        mp3.stopAllMp3World();
        stopCapture();
      }

      if (state.sourceMode === 'synth') {
        synth.startChordProgression();
      } else if (state.sourceMode === 'mp3') {
        mp3.startMp3World();
      } else if (state.sourceMode === 'capture') {
        startCapture();
      }
    }
  };

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

export function restartWorldAudio(ctx = createAudioContext()) {
  const { state, stems, synth, mp3, startCapture, stopCapture, normalizeSourceType } = ctx;
  
  stems.stopStems();
  synth.stopSynth();
  synth.stopChordProgression();
  mp3.stopAllMp3World();
  stopCapture();

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
    synth.startChordProgression();
  } else if (type === 'mp3') {
    mp3.startMp3World();
  } else if (type === 'capture') {
    startCapture();
  }
}

// Default export with standard context (for backward compatibility)
const defaultCtx = createAudioContext();
export default {
  setSourceMode: (worldIdx, mode) => setSourceMode(worldIdx, mode, defaultCtx),
  triggerKick: (withPiafCue) => triggerKick(withPiafCue, defaultCtx),
  toggleMasterPlay: () => toggleMasterPlay(defaultCtx),
  selectLevel: (idx, preserveParams) => selectLevel(idx, preserveParams, defaultCtx),
  restartWorldAudio: () => restartWorldAudio(defaultCtx),
  createAudioContext,
  // Pure functions
  calculateCrossfadeGain,
  normalizeLevelIndex,
  getWorldVolume,
  getSourceMode,
};