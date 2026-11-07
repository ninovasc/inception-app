// @ts-nocheck
import { state } from './state.js';
import { WORLD_NAMES } from './config.js';
import { setSensorStatus } from './sensors.js';
import { t } from './i18n.js';

const WAITING_FOR_TRAIN_IDX = WORLD_NAMES.indexOf('Waiting for a Train'); // 9
const BINAURAL_PULSE_IDX = 4; // Binaural Pulse preset index

let memCatcherRuntime = false;
let spatialRuntime = false;
let deprivationRuntime = false;

function setMechanicUI(btnId, subId, on, onText, offText) {
  const btn = document.getElementById(btnId);
  const sub = document.getElementById(subId);
  if (btn) {
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  if (sub) sub.textContent = on ? onText : offText;
}

export function syncMechanicsUI() {
  setMechanicUI('btnMemCatcher', 'subMemCatcher', state.isMemCatcherOn, 'ON (Gravando Ecos)', t('btn.off'));
  setMechanicUI('btnAutoKick', 'subAutoKick', state.isAutoKickOn, 'ON (Sensor G)', t('btn.off'));
  setMechanicUI('btnSpatial3D', 'subSpatial3D', state.isSpatial3DOn, 'ON (3D Ativo)', 'OFF (Centro)');
  const deprOn = state.isDeprivationWatchOn;
  setMechanicUI('btnDeprivation', 'subDeprivation', deprOn, 'VIGIANDO (0/15s)', t('btn.off'));
  // Timer de Sonho Lúcido permanece OFF por padrão.
  const timer = document.getElementById('btnLucidTimer');
  if (timer && !state.lucidInterval) {
    timer.classList.remove('active');
    timer.setAttribute('aria-pressed', 'false');
    const sub = document.getElementById('subLucidTimer');
    if (sub) sub.textContent = t('btn.off');
  }
}

// --- Ecos do Ambiente (Memory Catcher) ---
export async function startMemoryCatcher() {
  if (memCatcherRuntime) {
    state.isMemCatcherOn = true;
    setMechanicUI('btnMemCatcher', 'subMemCatcher', true, 'ON (Gravando Ecos)', t('btn.off'));
    return true;
  }

  if (typeof MediaRecorder === 'undefined') {
    state.isMemCatcherOn = false;
    setMechanicUI('btnMemCatcher', 'subMemCatcher', false, 'ON (Gravando Ecos)', t('btn.off'));
    setSensorStatus('Memory Catcher não suportado neste navegador.');
    return false;
  }

  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();

  if (!state.isMicOn) await sensors.toggleMic();
  if (!state.isMicOn) {
    state.isMemCatcherOn = false;
    setMechanicUI('btnMemCatcher', 'subMemCatcher', false, 'ON (Gravando Ecos)', t('btn.off'));
    if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
    return false;
  }

  memCatcherRuntime = true;
  state.isMemCatcherOn = true;
  setMechanicUI('btnMemCatcher', 'subMemCatcher', true, 'ON (Gravando Ecos)', t('btn.off'));
  setSensorStatus('Memory Catcher ativo: capturando fragmentos do subconsciente.');

  const scheduleNext = () => {
    if (!memCatcherRuntime) return;
    const delay = 8000 + Math.random() * 16000; // 8s-24s variável
    state.memCatcherTimer = setTimeout(() => {
      if (state.isPlaying && state.isMicOn && memCatcherRuntime) audio.captureAndPlaySubconsciousMemory();
      scheduleNext();
    }, delay);
  };
  scheduleNext();
  return true;
}

export function stopMemoryCatcher() {
  memCatcherRuntime = false;
  state.isMemCatcherOn = false;
  if (state.memCatcherTimer) { clearTimeout(state.memCatcherTimer); state.memCatcherTimer = null; }
  setMechanicUI('btnMemCatcher', 'subMemCatcher', false, 'ON (Gravando Ecos)', t('btn.off'));
  setSensorStatus('Memory Catcher desligado.');
}

export async function toggleMemoryCatcher() {
  if (state.isMemCatcherOn) stopMemoryCatcher();
  else await startMemoryCatcher();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// --- Chute Automático (Auto-Kick) ---
export async function startAutoKick() {
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();

  if (!state.isMotionOn) await sensors.toggleMotion();
  if (!state.isMotionOn) {
    state.isAutoKickOn = false;
    setMechanicUI('btnAutoKick', 'subAutoKick', false, 'ON (Sensor G)', t('btn.off'));
    setSensorStatus('Auto-Kick requer o giroscópio. Ative o sensor Giro primeiro.');
    if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
    return false;
  }

  state.isAutoKickOn = true;
  setMechanicUI('btnAutoKick', 'subAutoKick', true, 'ON (Sensor G)', t('btn.off'));
  setSensorStatus('Auto-Kick ativo: solte ou sacuda o celular para disparar O Chute.');
  return true;
}

export function stopAutoKick() {
  state.isAutoKickOn = false;
  setMechanicUI('btnAutoKick', 'subAutoKick', false, 'ON (Sensor G)', t('btn.off'));
  setSensorStatus('Auto-Kick desligado.');
}

export async function toggleAutoKick() {
  if (state.isAutoKickOn) stopAutoKick();
  else await startAutoKick();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// --- Som 3D (Bússola) ---
export async function startSpatial3D() {
  if (spatialRuntime) {
    state.isSpatial3DOn = true;
    setMechanicUI('btnSpatial3D', 'subSpatial3D', true, 'ON (3D Ativo)', 'OFF (Centro)');
    return true;
  }
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();

  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') {
        state.isSpatial3DOn = false;
        setMechanicUI('btnSpatial3D', 'subSpatial3D', false, 'ON (3D Ativo)', 'OFF (Centro)');
        setSensorStatus('Permissão de orientação negada. Áudio 3D indisponível neste dispositivo.');
        if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
        return false;
      }
    } else if (typeof DeviceOrientationEvent === 'undefined') {
      state.isSpatial3DOn = false;
      setMechanicUI('btnSpatial3D', 'subSpatial3D', false, 'ON (3D Ativo)', 'OFF (Centro)');
      setSensorStatus('Orientação não suportada neste dispositivo.');
      if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
      return false;
    }
    state.baseCompassAlpha = null;
    sensors.startOrientationWatch();
    spatialRuntime = true;
    state.isSpatial3DOn = true;
    setMechanicUI('btnSpatial3D', 'subSpatial3D', true, 'ON (3D Ativo)', 'OFF (Centro)');
    setSensorStatus('Áudio 3D ligado: gire o celular para ouvir o som mudar de lado.');
    return true;
  } catch (e) {
    state.isSpatial3DOn = false;
    setMechanicUI('btnSpatial3D', 'subSpatial3D', false, 'ON (3D Ativo)', 'OFF (Centro)');
    setSensorStatus('Erro ao ativar bússola 3D.');
    return false;
  }
}

export function stopSpatial3D() {
  spatialRuntime = false;
  state.isSpatial3DOn = false;
  if (state.stereoPanner && state.stereoPanner.pan && state.audioCtx) {
    state.stereoPanner.pan.setTargetAtTime(0, state.audioCtx.currentTime, 0.1);
  }
  setMechanicUI('btnSpatial3D', 'subSpatial3D', false, 'ON (3D Ativo)', 'OFF (Centro)');
  setSensorStatus('Áudio Espacial 3D desligado.');
}

export async function toggleSpatial3D() {
  if (state.isSpatial3DOn) stopSpatial3D();
  else await startSpatial3D();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

// --- Timer de Sonho Lúcido (não liga por padrão) ---
export async function cycleLucidTimer() {
  const audio = await import('./audio.js');
  audio.initAudio();
  state.lucidModeIdx = (state.lucidModeIdx + 1) % (await import('./config.js')).LUCID_MODES.length;
  const modes = (await import('./config.js')).LUCID_MODES;
  setLucidTimerMinutes(modes[state.lucidModeIdx]);
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function setLucidTimerMinutes(mins) {
  const btn = document.getElementById('btnLucidTimer');
  const sub = document.getElementById('subLucidTimer');
  if (state.lucidInterval) { clearInterval(state.lucidInterval); state.lucidInterval = null; }

  if (mins === 0) {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
    sub.textContent = t('btn.off');
    return;
  }

  state.lucidTotalSec = mins * 60;
  state.lucidRemainingSec = state.lucidTotalSec;
  btn.classList.add('active');
  btn.setAttribute('aria-pressed', 'true');
  updateLucidSub();

  state.lucidInterval = setInterval(async () => {
    if (!state.isPlaying) return;
    state.lucidRemainingSec--;
    updateLucidSub();

    const progress = 1 - (state.lucidRemainingSec / state.lucidTotalSec);
    const targetSpeed = 1.00 - (progress * 0.70);
    const targetFilter = 18000 - (progress * 17600);

    document.getElementById('sliderSpeed').value = targetSpeed;
    document.getElementById('sliderFilter').value = targetFilter;
    const audio = await import('./audio.js');
    audio.syncXYPadFromSliders(targetSpeed, targetFilter);
    audio.applyParameters();

    if (state.lucidRemainingSec <= 0) {
      clearInterval(state.lucidInterval);
      state.lucidInterval = null;
      state.lucidModeIdx = 0;
      btn.classList.remove('active');
      sub.textContent = t('mechanic.deprivation.triggered');
      audio.triggerKick(true);
    }
  }, 1000);
}

function updateLucidSub() {
  const m = Math.floor(state.lucidRemainingSec / 60);
  const s = String(state.lucidRemainingSec % 60).padStart(2, '0');
  document.getElementById('subLucidTimer').textContent = `${m}:${s}`;
}

// --- Privação Sensorial ---
export async function startDeprivationWatch() {
  if (deprivationRuntime) {
    state.isDeprivationWatchOn = true;
    setMechanicUI('btnDeprivation', 'subDeprivation', true, 'VIGIANDO (0/15s)', t('btn.off'));
    return true;
  }
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();

  if (!state.isMicOn) await sensors.toggleMic();
  if (!state.isMicOn) {
    state.isDeprivationWatchOn = false;
    setMechanicUI('btnDeprivation', 'subDeprivation', false, 'VIGIANDO (0/15s)', t('btn.off'));
    setSensorStatus('Privação Sensorial requer o microfone.');
    if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
    return false;
  }

  // Permissão de orientação no iOS para detectar o celular virado.
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      await DeviceOrientationEvent.requestPermission();
    }
  } catch (e) {}
  sensors.startOrientationWatch();

  deprivationRuntime = true;
  state.isDeprivationWatchOn = true;
  state.silenceSeconds = 0;
  setMechanicUI('btnDeprivation', 'subDeprivation', true, 'VIGIANDO (0/15s)', t('btn.off'));
  setSensorStatus('Privação Sensorial: vire o celular para baixo em silêncio por 15s.');

  if (state.deprivationCheckInterval) clearInterval(state.deprivationCheckInterval);
  state.deprivationCheckInterval = setInterval(checkSensoryDeprivation, 1000);
  return true;
}

export function stopDeprivationWatch() {
  deprivationRuntime = false;
  state.isDeprivationWatchOn = false;
  if (state.deprivationCheckInterval) { clearInterval(state.deprivationCheckInterval); state.deprivationCheckInterval = null; }
  stopDeprivationHeartbeat();
  setMechanicUI('btnDeprivation', 'subDeprivation', false, 'VIGIANDO (0/15s)', t('btn.off'));
  setSensorStatus('Privação Sensorial desligada.');
}

export async function toggleDeprivationWatch() {
  if (state.isDeprivationWatchOn) stopDeprivationWatch();
  else await startDeprivationWatch();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed();
}

export function checkSensoryDeprivation() {
  if (!state.isDeprivationWatchOn) return;

  let noiseLevel = 0;
  if (state.isMicOn && state.micAnalyser) {
    const arr = new Uint8Array(state.micAnalyser.frequencyBinCount);
    state.micAnalyser.getByteFrequencyData(arr);
    noiseLevel = arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  const isSilent = noiseLevel < 18;
  if (isSilent && (state.isPhoneFaceDown || !state.isMotionOn)) {
    state.silenceSeconds++;
    const sub = document.getElementById('subDeprivation');
    if (state.silenceSeconds < 15) {
      sub.textContent = `${t('mechanic.silence')} (${state.silenceSeconds}/15s)`;
    } else if (!state.isDeprivationActive) {
      enterSensoryDeprivation();
    }
  } else {
    state.silenceSeconds = 0;
    if (state.isDeprivationActive) {
      stopDeprivationHeartbeat();
      document.getElementById('subDeprivation').textContent = t('mechanic.deprivation.watching');
    }
  }
}

export async function enterSensoryDeprivation() {
  state.isDeprivationActive = true;
  document.getElementById('subDeprivation').textContent = t('mechanic.deprivation.active');
  document.getElementById('topStatus').textContent = t('mechanic.deprivation');
  setSensorStatus('Estado oculto de Privação Sensorial ativado.');

  const audio = await import('./audio.js');
  audio.setWorldSynth(WAITING_FOR_TRAIN_IDX, BINAURAL_PULSE_IDX); // Waiting for a Train usa Binaural Pulse
  audio.selectLevel(WAITING_FOR_TRAIN_IDX);

  if (state.heartbeatInterval) clearInterval(state.heartbeatInterval);
  state.heartbeatInterval = setInterval(() => {
    if (!state.isPlaying || !state.isDeprivationActive) return;
    audio.playHeartbeatPulse(0);
    setTimeout(() => audio.playHeartbeatPulse(0.15), 240);
  }, 1250);
}

export function stopDeprivationHeartbeat() {
  state.isDeprivationActive = false;
  if (state.heartbeatInterval) { clearInterval(state.heartbeatInterval); state.heartbeatInterval = null; }
}

// Ativa as mecânicas padrão no primeiro play (gesto do usuário, necessário
// para permissões de mic/giroscópio/orientação). O timer fica de fora.
export async function activateDreamDefaults() {
  if (state.defaultsActivated) return;
  state.defaultsActivated = true;
  // Sensores primeiro: no iOS as permissões de movimento/orientação
  // precisam acontecer perto do gesto do usuário.
  if (state.isAutoKickOn) await startAutoKick();
  if (state.isSpatial3DOn) await startSpatial3D();
  if (state.isMemCatcherOn) await startMemoryCatcher();
  if (state.isDeprivationWatchOn) await startDeprivationWatch();
  if (typeof window.generateFullSeed === 'function') window.generateFullSeed(true);
}
