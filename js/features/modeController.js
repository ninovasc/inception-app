import { state } from '../state.js';
import { switchMode, modeModules } from '../modes/modeManager.js';
import * as mechanics from '../mechanics.js';
import * as audio from '../audio.js';
import * as narrativeMode from '../modes/narrativeMode.js';
import { updateGenerativeUIVisibility } from '../ui/generativeUI.js';
import { t } from '../i18n.js';

// Wake Lock: mantém a tela acesa durante a reprodução (iOS/Android)
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && navigator.wakeLock && typeof navigator.wakeLock.request === 'function') {
      state.wakeLock = await navigator.wakeLock.request('screen');
      if (state.wakeLock && typeof state.wakeLock.addEventListener === 'function') {
        state.wakeLock.addEventListener('release', () => { state.wakeLock = null; });
      }
    }
  } catch (e) {}
}
async function releaseWakeLock() {
  try {
    if (state.wakeLock && typeof state.wakeLock.release === 'function') {
      await state.wakeLock.release();
    }
  } catch (e) {}
  state.wakeLock = null;
}

// Troca de modo via seletor
export function setMode(modeId) {
  if (!modeId) {
    // Volta para "sem modo" - esconde botões e painéis
    const startBtn = document.getElementById('startModeBtn');
    if (startBtn) startBtn.style.display = 'none';
    const stopBtn = document.getElementById('stopModeBtn');
    if (stopBtn) stopBtn.style.display = 'none';
    switchMode(''); // Call switchMode to update panel visibility
    if (typeof updateGenerativeUIVisibility === 'function') updateGenerativeUIVisibility();
    return;
  }

  switchMode(modeId);

  if (typeof updateGenerativeUIVisibility === 'function') updateGenerativeUIVisibility();

  // Mostra botão Iniciar quando modo selecionado
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'flex';
  const stopBtn = document.getElementById('stopModeBtn');
  if (stopBtn) stopBtn.style.display = 'none';
}

// Inicia o modo atual selecionado
export function startCurrentMode() {
  if (!state.currentMode) return;

  // Inicia áudio se necessário
  if (!audio.audioCtx) audio.initAudio();

  // Ativa modo atual (inicia timer, alarme, etc)
  const module = modeModules?.[state.currentMode];
  if (module && typeof module.start === 'function') {
    module.start();
  } else if (module && module.activate) {
    module.activate();
  }

  // Marca como tocando
  state.isPlaying = true;

  // Inicia a reprodução de áudio do mundo atual (exceto no modo Sono, que fica em silêncio até o alarme)
  if (state.currentMode !== 'sleep' && typeof audio.restartWorldAudio === 'function') {
    audio.restartWorldAudio();
  }

  // Mantém a tela acesa e pausa o screensaver durante a reprodução
  requestWakeLock();
  if (window.__screensaver && typeof window.__screensaver.pause === 'function') {
    window.__screensaver.pause();
  }

  // Ativa mecânicas padrão
  mechanics.activateDreamDefaults();

  // Atualiza UI
  if (typeof window.updateFromSliders === 'function') window.updateFromSliders(true);

  // Esconde botão Iniciar, mostra botão Parar
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'none';
  const stopBtn = document.getElementById('stopModeBtn');
  if (stopBtn) stopBtn.style.display = 'flex';

  // Atualiza status
  const statusEl = document.getElementById('topStatus');
  if (statusEl) statusEl.textContent = t('status.dreaming');
}

// Para o modo atual em execução
export function stopCurrentMode() {
  if (!state.currentMode || !state.isPlaying) return;

  // Para áudio
  if (typeof window.toggleMasterPlay === 'function' && state.isPlaying) {
    window.toggleMasterPlay();
  }

  // Desativa módulo do modo
  const module = modeModules?.[state.currentMode];
  if (module && module.deactivate) {
    module.deactivate();
  }
  if (state.currentMode === 'narrative') {
    narrativeMode.stopAutoMode();
  }

  // Para os sensores em uso
  if (state.isMicOn && typeof window.toggleMic === 'function') window.toggleMic();
  if (state.isMotionOn && typeof window.toggleMotion === 'function') window.toggleMotion();
  if (state.isGpsOn && typeof window.toggleGPS === 'function') window.toggleGPS();

  state.isPlaying = false;

  // Libera wake lock e retoma screensaver
  releaseWakeLock();
  if (window.__screensaver && typeof window.__screensaver.resume === 'function') {
    window.__screensaver.resume();
  }

  // UI: mostra Iniciar, esconde Parar
  const startBtn = document.getElementById('startModeBtn');
  if (startBtn) startBtn.style.display = 'flex';
  const stopBtn = document.getElementById('stopModeBtn');
  if (stopBtn) stopBtn.style.display = 'none';

  const statusEl = document.getElementById('topStatus');
  if (statusEl) statusEl.textContent = t('status.ready');
}

export function getCurrentMode() {
  return state.currentMode;
}

// Expose to global scope for inline handlers
window.setMode = setMode;
window.startCurrentMode = startCurrentMode;
window.stopCurrentMode = stopCurrentMode;
window.getCurrentMode = getCurrentMode;

// Re-adquire wake lock quando a aba volta a ficar visível durante reprodução
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.isPlaying && !state.wakeLock) {
      requestWakeLock();
    }
  });
}
