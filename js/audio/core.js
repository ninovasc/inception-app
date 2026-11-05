import { state } from '../state.js';
import { LEVELS, SYNTH_PRESETS, CHORD_PROGRESSIONS, WORLD_SYNTH, WORLD_VOICE_PRESETS, WORLD_NAMES, normalizeSourceType } from '../config.js';

export function initAudio() {
  if (state.audioCtx) {
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  // 'playback' usa buffers maiores: evita estalos/queda de áudio no celular.
  try {
    state.audioCtx = new AudioCtx({ latencyHint: 'playback' });
  } catch (e) {
    state.audioCtx = new AudioCtx();
  }

  state.masterFilter = state.audioCtx.createBiquadFilter();
  state.masterFilter.type = 'lowpass';
  state.masterFilter.frequency.value = 18000;

  // Delay estéreo: left e right com tempos diferentes.
  // O slider controla a quantidade de eco (wet); o feedback fica fixo e seguro.
  state.delayLeft = state.audioCtx.createDelay(5.0);
  state.delayLeft.delayTime.value = 0.35;
  state.delayRight = state.audioCtx.createDelay(5.0);
  state.delayRight.delayTime.value = 0.50;
  state.delayWet = state.audioCtx.createGain();
  state.delayWet.gain.value = 0.06;
  state.feedbackLeft = state.audioCtx.createGain();
  state.feedbackLeft.gain.value = 0.32;
  state.feedbackRight = state.audioCtx.createGain();
  state.feedbackRight.gain.value = 0.28;

  state.convolverNode = state.audioCtx.createConvolver();
  state.convolverNode.buffer = createImpulse(2.4, 2.2);
  state.reverbGain = state.audioCtx.createGain();
  state.reverbGain.gain.value = 0.15;

  state.dryGain = state.audioCtx.createGain();
  state.dryGain.gain.value = 0.90;

  state.stereoPanner = state.audioCtx.createStereoPanner
    ? state.audioCtx.createStereoPanner()
    : state.audioCtx.createGain();

  // Crossfade gain para transição entre níveis
  state.crossfadeGain = state.audioCtx.createGain();
  state.crossfadeGain.gain.value = 1.0;

  state.compressor = state.audioCtx.createDynamicsCompressor();
  // Compressor suave: evita "bombeamento" quando o eco/reverb acumulam.
  state.compressor.threshold.value = -15;
  state.compressor.knee.value = 24;
  state.compressor.ratio.value = 4;
  state.compressor.attack.value = 0.01;
  state.compressor.release.value = 0.25;

  state.masterOut = state.audioCtx.createGain();
  state.masterOut.gain.value = 0.9;

  state.synthMasterGain = state.audioCtx.createGain();
  state.synthMasterGain.gain.value = (state.worldVolume && state.worldVolume[state.currentLevel] != null)
    ? state.worldVolume[state.currentLevel]
    : 0.2;
  state.synthMasterGain.connect(state.masterFilter);

  for (let i = 0; i < 3; i++) {
    state.stemGains[i] = state.audioCtx.createGain();
    const el = document.getElementById(`vol${i}`);
    state.stemGains[i].gain.value = el ? parseFloat(el.value) : 0.2;
    state.stemGains[i].connect(state.masterFilter);
  }

  // Conexões principais
  state.masterFilter.connect(state.dryGain);
  state.dryGain.connect(state.stereoPanner);

  // Delay estéreo com feedback (feedback fixo; volume do eco vem de delayWet)
  state.masterFilter.connect(state.delayLeft);
  state.delayLeft.connect(state.feedbackLeft);
  state.feedbackLeft.connect(state.delayLeft);
  state.delayLeft.connect(state.delayWet);

  state.masterFilter.connect(state.delayRight);
  state.delayRight.connect(state.feedbackRight);
  state.feedbackRight.connect(state.delayRight);
  state.delayRight.connect(state.delayWet);

  state.delayWet.connect(state.stereoPanner);

  state.masterFilter.connect(state.convolverNode);
  state.convolverNode.connect(state.reverbGain);
  state.reverbGain.connect(state.stereoPanner);

  state.stereoPanner.connect(state.crossfadeGain);
  state.crossfadeGain.connect(state.compressor);
  state.compressor.connect(state.masterOut);
  state.masterOut.connect(state.audioCtx.destination);

  // Evolução temporal: LFO lento (respiração) modulando filtro e volume
  state.breathLfo = state.audioCtx.createOscillator();
  state.breathLfo.frequency.value = 0.03; // ~33s por ciclo
  state.breathLfoGain = state.audioCtx.createGain();
  state.breathLfoGain.gain.value = 150; // ±150 Hz no filtro
  state.breathLfo.connect(state.breathLfoGain);
  state.breathLfoGain.connect(state.masterFilter.frequency);
  state.breathLfo.start();

  state.breathVolLfo = state.audioCtx.createOscillator();
  state.breathVolLfo.frequency.value = 0.02; // ~50s por ciclo
  state.breathVolGain = state.audioCtx.createGain();
  state.breathVolGain.gain.value = 0.03; // ±3% no volume
  state.breathVolLfo.connect(state.breathVolGain);
  state.breathVolGain.connect(state.synthMasterGain.gain);
  state.breathVolLfo.start();

  // Canal de mic independente (criado quando mic ligado, mas preparar nós)
  state.micFilter = state.audioCtx.createBiquadFilter();
  state.micFilter.type = 'lowpass';
  state.micFilter.frequency.value = 4000;
  state.micDelay = state.audioCtx.createDelay(2.0);
  state.micDelay.delayTime.value = 0.08;
  state.micFeedback = state.audioCtx.createGain();
  state.micFeedback.gain.value = 0.05;
  state.micReverbSend = state.audioCtx.createGain();
  state.micReverbSend.gain.value = 0.10;
  state.micDry = state.audioCtx.createGain();
  state.micDry.gain.value = 0.85;
  state.micWet = state.audioCtx.createGain();
  state.micWet.gain.value = 0.15;
  state.micGainNode = state.audioCtx.createGain();
  state.micGainNode.gain.value = 0.5;

  // Conectar canal de mic
  state.micGainNode.connect(state.micFilter);
  state.micFilter.connect(state.micDry);
  state.micFilter.connect(state.micDelay);
  state.micDelay.connect(state.micFeedback);
  state.micFeedback.connect(state.micDelay);
  state.micDelay.connect(state.micWet);
  state.micFilter.connect(state.micReverbSend);
  state.micReverbSend.connect(state.convolverNode);
  state.micDry.connect(state.stereoPanner);
  state.micWet.connect(state.stereoPanner);
}

function createImpulse(duration, decay) {
  if (state.impulseBuffer) return state.impulseBuffer;
  const len = state.audioCtx.sampleRate * duration;
  const buf = state.audioCtx.createBuffer(2, len, state.audioCtx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  state.impulseBuffer = buf;
  return buf;
}

// Compatibilidade: o tipo de fonte agora é definido por mundo em worldSourceType.
