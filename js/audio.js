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

// Re-exports from split modules
export { initAudio } from './audio/core.js';
export { selectSynthType, setSynthVolume, startSynth, stopSynth, restartSynth, startChordProgression, stopChordProgression, syncXYPadFromSliders, updateFromSliders, applyParameters } from './audio/synth.js';
export { loadStem, loadWorldMp3, computeAnchors, startMp3World, stopMp3World, stopAllMp3World, setWorldMp3Volume, crossfadeMp3Worlds } from './audio/mp3.js';
export { startStems, stopStems, setVolume } from './audio/stems.js';
export { setWorldSynth, setWorldVolume } from './audio/world.js';
export { playHeartbeatPulse, captureAndPlaySubconsciousMemory } from './audio/effects.js';

export function setSourceMode(worldIdx, mode) {
  if (worldIdx === undefined) {
    // Backward compatibility: if called with just mode
    mode = worldIdx;
    worldIdx = state.currentLevel;
  }
  const normalized = normalizeSourceType(mode);
  if (!state.worldSourceType) state.worldSourceType = Array(WORLD_NAMES.length).fill('synth');
  state.worldSourceType[worldIdx] = normalized;
  state.sourceMode = normalized;
  restartWorldAudio();
  renderSourceList();
}

export function triggerKick(withPiafCue) {
  core.initAudio();
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

export function toggleMasterPlay() {
  core.initAudio();
  const btn = document.getElementById('masterPlayBtn');
  const sub = document.getElementById('playSub');
  const topSt = document.getElementById('topStatus');

  if (!state.isPlaying) {
    state.isPlaying = true;
    mechanics.activateDreamDefaults();
    restartWorldAudio();

    if (btn) btn.classList.add('active');
    if (btn) btn.setAttribute('aria-pressed', 'true');
    if (sub) sub.textContent = t('status.dreaming');
    if (topSt) topSt.textContent = t('status.dreaming');
    const logo = document.querySelector('.logo');
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
    const logo = document.querySelector('.logo');
    if (logo) logo.classList.remove('breathing');

    import('./power.js').then(p => {
      p.releaseWakeLock();
      p.setMediaPlaybackState(false);
    });
  }
}

export function selectLevel(idx, preserveParams = false) {
  core.initAudio();

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
    synth.syncXYPadFromSliders(curSpeed, curFilter);
    synth.applyParameters();

    if (state.isPlaying) {
      synth.stopSynth(500);
      synth.stopChordProgression();
      // Crossfade suave entre mundos MP3
      const oldMp3Idx = state.currentLevel !== idx ? state.currentLevel : -1;
      if (oldMp3Idx >= 0 && state.worldSourceType[oldMp3Idx] === 'mp3' && state.worldSourceType[idx] === 'mp3') {
        // Ambos são MP3: crossfade suave
        mp3.crossfadeMp3Worlds(oldMp3Idx, idx);
      } else {
        // Transição normal (MP3 -> synth, synth -> MP3, etc)
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

export function restartWorldAudio() {
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
