import { state } from './state.js';

export async function toggleMemoryCatcher() {
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();
  const btn = document.getElementById('btnMemCatcher');
  const sub = document.getElementById('subMemCatcher');

  if (!state.isMemCatcherOn) {
    if (!state.isMicOn) await sensors.toggleMic();
    if (!state.isMicOn) {
      (await import('./seed.js')).generateFullSeed();
      return;
    }

    state.isMemCatcherOn = true;
    btn.classList.add('active');
    sub.textContent = 'ON (Gravando Ecos)';
    setSensorStatus('Memory Catcher ativo: capturando fragmentos do subconsciente.');

    state.memCatcherTimer = setInterval(() => {
      if (state.isPlaying && state.isMicOn && state.isMemCatcherOn) audio.captureAndPlaySubconsciousMemory();
    }, 16000);
  } else {
    state.isMemCatcherOn = false;
    if (state.memCatcherTimer) { clearInterval(state.memCatcherTimer); state.memCatcherTimer = null; }
    btn.classList.remove('active');
    sub.textContent = 'OFF';
    setSensorStatus('Memory Catcher desligado.');
  }
  (await import('./seed.js')).generateFullSeed();
}

export async function toggleAutoKick() {
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();
  const btn = document.getElementById('btnAutoKick');
  const sub = document.getElementById('subAutoKick');

  if (!state.isAutoKickOn) {
    if (!state.isMotionOn) await sensors.toggleMotion();
    if (!state.isMotionOn) {
      setSensorStatus('Auto-Kick requer o giroscópio. Ative o sensor Giro primeiro.');
      (await import('./seed.js')).generateFullSeed();
      return;
    }
    state.isAutoKickOn = true;
    btn.classList.add('active');
    sub.textContent = 'ON (Sensor G)';
    setSensorStatus('Auto-Kick ativo: solte ou sacuda o celular para disparar O Chute.');
  } else {
    state.isAutoKickOn = false;
    btn.classList.remove('active');
    sub.textContent = 'OFF';
    setSensorStatus('Auto-Kick desligado.');
  }
  (await import('./seed.js')).generateFullSeed();
}

export async function toggleSpatial3D() {
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = document.getElementById('btnSpatial3D');
  const sub = document.getElementById('subSpatial3D');

  if (!state.isSpatial3DOn) {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const res = await DeviceOrientationEvent.requestPermission();
        if (res !== 'granted') {
          (await import('./seed.js')).generateFullSeed();
          return;
        }
      }
      state.baseCompassAlpha = null;
      window.addEventListener('deviceorientation', (await import('./sensors.js')).orientationHandler);
      state.isSpatial3DOn = true;
      btn.classList.add('active');
      sub.textContent = 'ON (3D Ativo)';
      setSensorStatus('Áudio 3D ligado: gire o celular para ouvir o som mudar de lado.');
    } catch (e) {
      setSensorStatus('Erro ao ativar bússola 3D.');
    }
  } else {
    state.isSpatial3DOn = false;
    if (state.stereoPanner && state.stereoPanner.pan) {
      state.stereoPanner.pan.setTargetAtTime(0, state.audioCtx.currentTime, 0.1);
    }
    btn.classList.remove('active');
    sub.textContent = 'OFF (Centro)';
    setSensorStatus('Áudio Espacial 3D desligado.');
  }
  (await import('./seed.js')).generateFullSeed();
}

export async function cycleLucidTimer() {
  const audio = await import('./audio.js');
  audio.initAudio();
  state.lucidModeIdx = (state.lucidModeIdx + 1) % (await import('./config.js')).LUCID_MODES.length;
  const modes = (await import('./config.js')).LUCID_MODES;
  setLucidTimerMinutes(modes[state.lucidModeIdx]);
  (await import('./seed.js')).generateFullSeed();
}

export function setLucidTimerMinutes(mins) {
  const btn = document.getElementById('btnLucidTimer');
  const sub = document.getElementById('subLucidTimer');
  if (state.lucidInterval) { clearInterval(state.lucidInterval); state.lucidInterval = null; }

  if (mins === 0) {
    btn.classList.remove('active');
    sub.textContent = 'OFF';
    return;
  }

  state.lucidTotalSec = mins * 60;
  state.lucidRemainingSec = state.lucidTotalSec;
  btn.classList.add('active');
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
      sub.textContent = 'DESPERTAR!';
      audio.triggerKick(true);
    }
  }, 1000);
}

function updateLucidSub() {
  const m = Math.floor(state.lucidRemainingSec / 60);
  const s = String(state.lucidRemainingSec % 60).padStart(2, '0');
  document.getElementById('subLucidTimer').textContent = `${m}:${s}`;
}

export async function toggleDeprivationWatch() {
  const audio = await import('./audio.js');
  const sensors = await import('./sensors.js');
  audio.initAudio();
  const btn = document.getElementById('btnDeprivation');
  const sub = document.getElementById('subDeprivation');

  if (!state.isDeprivationWatchOn) {
    if (!state.isMicOn) await sensors.toggleMic();
    // Request orientation permission on iOS for face-down detection
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        await DeviceOrientationEvent.requestPermission();
      }
    } catch (e) {}
    window.addEventListener('deviceorientation', sensors.orientationHandler);

    state.isDeprivationWatchOn = true;
    state.silenceSeconds = 0;
    btn.classList.add('active');
    sub.textContent = 'VIGIANDO (0/15s)';
    setSensorStatus('Privação Sensorial: vire o celular para baixo em silêncio por 15s.');

    state.deprivationCheckInterval = setInterval(checkSensoryDeprivation, 1000);
  } else {
    state.isDeprivationWatchOn = false;
    if (state.deprivationCheckInterval) { clearInterval(state.deprivationCheckInterval); state.deprivationCheckInterval = null; }
    stopDeprivationHeartbeat();
    btn.classList.remove('active');
    sub.textContent = 'OFF';
    setSensorStatus('Privação Sensorial desligada.');
  }
  (await import('./seed.js')).generateFullSeed();
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
      sub.textContent = `SILÊNCIO (${state.silenceSeconds}/15s)`;
    } else if (!state.isDeprivationActive) {
      enterSensoryDeprivation();
    }
  } else {
    state.silenceSeconds = 0;
    if (state.isDeprivationActive) {
      stopDeprivationHeartbeat();
      document.getElementById('subDeprivation').textContent = 'VIGIANDO (0/15s)';
    }
  }
}

export async function enterSensoryDeprivation() {
  state.isDeprivationActive = true;
  document.getElementById('subDeprivation').textContent = 'ATIVO (Batimento)';
  document.getElementById('topStatus').textContent = 'PRIVAÇÃO SENSORIAL';
  setSensorStatus('Estado oculto de Privação Sensorial ativado.');

  const audio = await import('./audio.js');
  audio.selectSynthType(4);
  audio.selectLevel(4);

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

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}
