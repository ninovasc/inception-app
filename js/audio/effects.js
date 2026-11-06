// @ts-nocheck
import { state } from '../state.js';

export function playHeartbeatPulse(offsetGain) {
  if (!state.audioCtx) return;
  const now = state.audioCtx.currentTime;
  const osc = state.audioCtx.createOscillator();
  const g = state.audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(52, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.16);
  g.gain.setValueAtTime(0.32 - offsetGain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
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
          const reverseProb = state.currentLevel === WAITING_FOR_TRAIN_IDX ? 0.8 : (state.currentLevel === HALF_REMEMBERED_DREAM_IDX ? 0.2 : 0.4);
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
          const now = state.audioCtx.currentTime;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(0.75, now + 0.05);
          src.connect(g);
          g.connect(state.convolverNode);
          g.connect(state.delayLeft);
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
