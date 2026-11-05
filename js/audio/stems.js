import { state } from '../state.js';

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
