import { state } from '../state.js';
import { switchMode, modeModules } from '../modes/modeManager.js';
import * as mechanics from '../mechanics.js';
import * as audio from '../audio.js';
import * as audioCore from '../audio/core.js';
import * as audioSynth from '../audio/synth.js';
import * as audioMp3 from '../audio/mp3.js';
import * as audioStems from '../audio/stems.js';
import * as audioCapture from '../capture.js';
import * as narrativeMode from '../modes/narrativeMode.js';
import { updateGenerativeUIVisibility } from '../ui/generativeUI.js';
import { pauseScreensaver, resumeScreensaver } from '../screensaver.js';
import { toggleMic, toggleMotion, toggleGPS } from '../sensors.js';
import { t } from '../i18n.js';
import { updateFromSliders } from '../audio.js';

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
  if (!state.audioCtx) audio.initAudio();

  // Marca como tocando ANTES de ativar o modo, para que o áudio do mundo
  // (synth/MP3) comece imediatamente ao trocar de modo via gatilho
  state.isPlaying = true;

  // Ativa modo atual (inicia timer, alarme, etc)
  const module = modeModules?.[state.currentMode];
  if (module && typeof module.start === 'function') {
    module.start();
  } else if (module && module.activate) {
    module.activate();
  }

  // Inicia a reprodução de áudio do mundo atual (exceto no modo Sono, que fica em silêncio até o alarme)
  if (state.currentMode !== 'sleep' && typeof audio.restartWorldAudio === 'function') {
    audio.restartWorldAudio();
  }

  // Mantém a tela acesa e pausa o screensaver durante a reprodução
  requestWakeLock();
  pauseScreensaver();

  // Ativa mecânicas padrão
  mechanics.activateDreamDefaults();

  // Atualiza UI
  if (typeof updateFromSliders === 'function') updateFromSliders(true);

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
  if (state.isPlaying) {
    audioStems.stopStems?.();
    audioSynth.stopSynth?.();
    audioSynth.stopChordProgression?.();
    audioMp3.stopAllMp3World?.();
    audioCapture.stopCapture?.();
    // Note: stopDeprivationHeartbeat is internal, skip
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
  if (state.isMicOn) toggleMic();
  if (state.isMotionOn) toggleMotion();
  if (state.isGpsOn) toggleGPS();

  state.isPlaying = false;

  // Libera wake lock e retoma screensaver
  releaseWakeLock();
  resumeScreensaver();

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

// Funções acessíveis via import direto ou event delegation (data-action)
// Não expostas mais em window.* para evitar poluição global

// Re-adquire wake lock quando a aba volta a ficar visível durante reprodução
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.isPlaying && !state.wakeLock) {
      requestWakeLock();
    }
  });
}
