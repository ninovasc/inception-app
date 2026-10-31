import { state } from './state.js';

let lastMotionTs = 0;

export async function toggleMic() {
  // initAudio provided by audio module; lazy import to avoid cycles
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = document.getElementById('btnMic');
  if (!state.isMicOn) {
    try {
      state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.micSource = state.audioCtx.createMediaStreamSource(state.micStream);
      state.micAnalyser = state.audioCtx.createAnalyser();
      state.micAnalyser.fftSize = 128;
      state.micGain = state.audioCtx.createGain();
      state.micGain.gain.value = 0.5;
      state.micSource.connect(state.micAnalyser);
      state.micSource.connect(state.micGain);
      state.micGain.connect(state.masterFilter);
      state.isMicOn = true;
      btn.classList.add('active');
      btn.textContent = 'Mic: ON';
      setSensorStatus('Microfone ligado.');
    } catch (e) {
      setSensorStatus('Permissão de microfone negada.');
    }
  } else {
    if (state.micStream) state.micStream.getTracks().forEach(track => track.stop());
    if (state.micSource) { try { state.micSource.disconnect(); } catch (e) {} }
    if (state.micGain) { try { state.micGain.disconnect(); } catch (e) {} }
    state.isMicOn = false;
    btn.classList.remove('active');
    btn.textContent = 'Mic: OFF';
    setSensorStatus('Microfone desligado.');
  }
}

export async function toggleMotion() {
  const audio = await import('./audio.js');
  audio.initAudio();
  const btn = document.getElementById('btnMotion');
  if (!state.isMotionOn) {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== 'granted') {
          setSensorStatus('Permissão de Giroscópio negada.');
          return;
        }
      }
      window.addEventListener('devicemotion', motionHandler);
      state.isMotionOn = true;
      btn.classList.add('active');
      btn.textContent = 'Giro: ON';
      setSensorStatus('Giroscópio ligado.');
    } catch (e) {
      setSensorStatus('Erro ao ligar Giroscópio.');
    }
  } else {
    window.removeEventListener('devicemotion', motionHandler);
    state.isMotionOn = false;
    btn.classList.remove('active');
    btn.textContent = 'Giro: OFF';
    setSensorStatus('Giroscópio desligado.');
  }
}

export function motionHandler(e) {
  if (!state.isMotionOn) return;
  const nowMs = Date.now();
  // throttle to ~10Hz
  if (nowMs - lastMotionTs < 100) return;
  lastMotionTs = nowMs;

  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const force = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);

  // Auto-Kick detection
  if (state.isAutoKickOn && nowMs - state.lastKickTime > 6000) {
    if (force < 3.2) {
      state.freefallTimestamp = nowMs;
    } else if (force > 21.0 || (state.freefallTimestamp > 0 && nowMs - state.freefallTimestamp < 900 && force > 13.5)) {
      state.freefallTimestamp = 0;
      state.lastKickTime = nowMs;
      setSensorStatus('QUEDA LIVRE DETECTADA: Disparando Auto-Kick!');
      import('./audio.js').then(a => a.triggerKick(true));
      return;
    }
  }

  const intensity = Math.min(1, Math.abs(force - 9.81) / 10);
  if (intensity > 0.05) {
    const mappedSpeed = 0.5 + intensity * 0.8;
    document.getElementById('sliderSpeed').value = mappedSpeed;
    import('./audio.js').then(a => {
      a.syncXYPadFromSliders(mappedSpeed, parseFloat(document.getElementById('sliderFilter').value));
      a.applyParameters();
    });
  }
}

export function orientationHandler(e) {
  if (e.beta !== null) {
    const b = Math.abs(e.beta);
    state.isPhoneFaceDown = (b > 145 && b <= 180);
  }

  if (!state.isSpatial3DOn || !state.stereoPanner || !state.stereoPanner.pan) return;
  if (e.alpha !== null) {
    if (state.baseCompassAlpha === null) state.baseCompassAlpha = e.alpha;
    let diff = e.alpha - state.baseCompassAlpha;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const panVal = Math.max(-1, Math.min(1, diff / 65));
    state.stereoPanner.pan.setTargetAtTime(panVal, state.audioCtx.currentTime, 0.08);
    const sub = document.getElementById('subSpatial3D');
    if (sub) sub.textContent = `PAN: ${Math.round(panVal * 100)}%`;
  }
}

export function toggleGPS() {
  const audio = null;
  const btn = document.getElementById('btnGps');

  if (!state.isGpsOn && state.gpsWatchId === null) {
    if (!('geolocation' in navigator)) {
      setSensorStatus('GPS não suportado.');
      return;
    }
    setSensorStatus('Ativando GPS...');
    state.gpsWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        state.isGpsOn = true;
        btn.classList.add('active');
        btn.textContent = 'GPS: ON';
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=rain,is_day`);
          const data = await res.json();
          if (data.current.rain > 0) (await import('./audio.js')).selectLevel(1);
          else if (data.current.is_day === 0) (await import('./audio.js')).selectLevel(2);
          else (await import('./audio.js')).selectLevel(0);
          setSensorStatus('GPS ligado e clima sincronizado.');
        } catch (e) {
          setSensorStatus('GPS ligado (sem conexão de clima).');
        }
      },
      () => {
        state.isGpsOn = false;
        if (state.gpsWatchId !== null) { navigator.geolocation.clearWatch(state.gpsWatchId); state.gpsWatchId = null; }
        btn.classList.remove('active');
        btn.textContent = 'GPS: OFF';
        setSensorStatus('GPS negado nos Ajustes do iOS.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  } else {
    if (state.gpsWatchId !== null) {
      navigator.geolocation.clearWatch(state.gpsWatchId);
      state.gpsWatchId = null;
    }
    state.isGpsOn = false;
    btn.classList.remove('active');
    btn.textContent = 'GPS: OFF';
    setSensorStatus('GPS desligado.');
  }
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}
