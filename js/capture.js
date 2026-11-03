import { state } from './state.js';
import { setSensorStatus } from './sensors.js';

let captureStream = null;
let captureSource = null;
let captureGain = null;

export async function startCapture() {
  if (captureStream) return true;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    setSensorStatus('Captura de tela não suportada neste navegador.');
    return false;
  }
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      preferCurrentTab: false,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include'
    });
    // keep only audio track
    const audioTracks = captureStream.getAudioTracks();
    if (audioTracks.length === 0) {
      captureStream.getTracks().forEach(t => t.stop());
      captureStream = null;
      setSensorStatus('Nenhum áudio capturado. Selecione a aba e marque "Compartilhar áudio".');
      return false;
    }
    // remove video tracks to save resources
    captureStream.getVideoTracks().forEach(t => t.stop());

    const audioCtx = state.audioCtx;
    captureSource = audioCtx.createMediaStreamSource(captureStream);
    captureGain = audioCtx.createGain();
    captureGain.gain.value = parseFloat(document.getElementById('capVol')?.value || 0.5);
    captureSource.connect(captureGain);
    captureGain.connect(state.masterFilter);

    captureStream.getAudioTracks()[0].addEventListener('ended', () => {
      stopCapture();
    });

    setSensorStatus('Captura ativa: áudio da aba roteado pelos efeitos.');
    return true;
  } catch (e) {
    captureStream = null;
    setSensorStatus('Captura cancelada ou não permitida.');
    return false;
  }
}

export function stopCapture() {
  if (captureSource) { try { captureSource.disconnect(); } catch (e) {} captureSource = null; }
  if (captureGain) { try { captureGain.disconnect(); } catch (e) {} captureGain = null; }
  if (captureStream) { captureStream.getTracks().forEach(t => t.stop()); captureStream = null; }
  setSensorStatus('Captura desativada.');
}

export function setCaptureVolume(val) {
  const v = parseFloat(val);
  const el = document.getElementById('capVolVal');
  if (el) el.textContent = Math.round(v * 100) + '%';
  if (captureGain) captureGain.gain.setTargetAtTime(v, state.audioCtx.currentTime, 0.1);
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function isCapturing() {
  return !!captureStream;
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
  const cap = document.getElementById('capStatus');
  if (cap) cap.textContent = msg;
}
// Re-export for local use with capStatus support
export { setSensorStatus };
