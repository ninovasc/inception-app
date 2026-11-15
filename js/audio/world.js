// @ts-nocheck
import { state, getWorldVolume, getModeWorldCount } from '../state.js';
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
}

export function setWorldVolume(worldIdx, val) {
  if (val === undefined) { val = worldIdx; worldIdx = state.currentLevel; }
  const v = parseFloat(val);
  if (isNaN(v)) return;
  const modeName = state.currentMode || 'narrative';
  if (!state.worldVolume[modeName]) state.worldVolume[modeName] = Array(getModeWorldCount(modeName)).fill(0.5);
  state.worldVolume[modeName][worldIdx] = v;

  const label = document.getElementById(`worldVolVal${worldIdx}`);
  if (label) label.textContent = Math.round(v * 100) + '%';

  if (state.audioCtx) {
    const modeName = state.currentMode || 'narrative';
    if (state.worldMp3Gains[worldIdx]) {
      state.worldMp3Gains[worldIdx].gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
    }
    if (state.sourceMode === 'synth' && state.synthMasterGain) {
      state.synthMasterGain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
    }
  }
}

// Crossfade suave entre dois mundos MP3 (overlap de 2s)