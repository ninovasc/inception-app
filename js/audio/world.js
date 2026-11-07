// @ts-nocheck
import { state } from '../state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from '../config.js';
import { restartSynth } from './synth.js';
import { startMp3World, stopMp3World, stopAllMp3World, crossfadeMp3Worlds } from './mp3.js';

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
  }
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// Crossfade suave entre dois mundos MP3 (overlap de 2s)
