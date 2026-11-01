import { state } from './state.js';

// Compact key mapping for cipher
const KEYMAP = {
  sourceMode: 'm',
  currentSynthType: 's',
  currentLevel: 'l',
  xyState: 'x',
  volumes: 'v',
  speed: 'p',
  filter: 'f',
  delay: 'd',
  reverb: 'r',
  mechanics: 'h',
  lucidModeIdx: 'i',
  ytLinks: 'y',
  worldSourceType: 't',
  worldSynth: 'w',
  worldVolume: 'o',
  worldSources: 'u'
};

// Pure encode: stateObj -> cipher string (base64 of compact JSON)
export function encodeState(s) {
  const compact = {};
  if (s.sourceMode !== undefined) compact[KEYMAP.sourceMode] = s.sourceMode === 'synth' ? 0 : (s.sourceMode === 'youtube' ? 1 : (s.sourceMode === 'capture' ? 2 : 3));
  if (s.currentSynthType !== undefined) compact[KEYMAP.currentSynthType] = s.currentSynthType;
  if (s.currentLevel !== undefined) compact[KEYMAP.currentLevel] = s.currentLevel;
  if (s.xyState) compact[KEYMAP.xyState] = [Math.round(s.xyState.x * 100), Math.round(s.xyState.y * 100)];
  if (s.volumes) compact[KEYMAP.volumes] = s.volumes.map(v => Math.round(v * 100));
  if (s.speed !== undefined) compact[KEYMAP.speed] = Math.round(s.speed * 100);
  if (s.filter !== undefined) compact[KEYMAP.filter] = Math.round(s.filter);
  if (s.delay !== undefined) compact[KEYMAP.delay] = Math.round(s.delay * 100);
  if (s.reverb !== undefined) compact[KEYMAP.reverb] = Math.round(s.reverb * 100);
  if (s.mechanics) {
    const m = s.mechanics;
    const lucidMin = (m.lucidMin != null) ? m.lucidMin : [0, 15, 30, 60][s.lucidModeIdx || 0];
    compact[KEYMAP.mechanics] = `${m.mem ? 1 : 0}${m.auto ? 1 : 0}${m.spatial ? 1 : 0}${lucidMin}${m.depr ? 1 : 0}`;
  }
  if (s.lucidModeIdx !== undefined) compact[KEYMAP.lucidModeIdx] = s.lucidModeIdx;
  if (s.ytLinks && s.ytLinks.some(x => x)) compact[KEYMAP.ytLinks] = s.ytLinks.map(x => x || '_').join(',');
  if (s.worldSourceType) compact[KEYMAP.worldSourceType] = s.worldSourceType.map(t => t === 'synth' ? 0 : (t === 'youtube' ? 1 : 2)).join('');
  if (s.worldSynth) compact[KEYMAP.worldSynth] = s.worldSynth.join('');
  if (s.worldVolume) compact[KEYMAP.worldVolume] = s.worldVolume.map(v => Math.round(v * 100));
  if (s.worldSources && s.worldSources.youtube && s.worldSources.youtube.some(x => x)) compact[KEYMAP.worldSources] = s.worldSources.youtube.map(x => x || '_').join(',');
  const json = JSON.stringify(compact);
  return btoa(json);
}

// Pure decode: cipher string -> object or null
export function decodeState(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  // Try base64 cipher first
  try {
    const json = atob(str);
    const c = JSON.parse(json);
    const out = {};
    if (c.m !== undefined) out.sourceMode = c.m === 0 ? 'synth' : (c.m === 1 ? 'youtube' : (c.m === 2 ? 'capture' : 'mp3'));
    if (c.s !== undefined) out.currentSynthType = c.s;
    if (c.l !== undefined) out.currentLevel = c.l;
    if (c.x) out.xyState = { x: c.x[0] / 100, y: c.x[1] / 100 };
    if (c.v) out.volumes = c.v.map(n => n / 100);
    if (c.p !== undefined) out.speed = c.p / 100;
    if (c.f !== undefined) out.filter = c.f;
    if (c.d !== undefined) out.delay = c.d / 100;
    if (c.r !== undefined) out.reverb = c.r / 100;
    if (c.h) {
      const m = c.h;
      out.mechanics = {
        mem: m.charAt(0) === '1',
        auto: m.charAt(1) === '1',
        spatial: m.charAt(2) === '1',
        lucidMin: parseInt(m.slice(3, m.length - 1), 10),
        depr: m.charAt(m.length - 1) === '1'
      };
    }
    if (c.i !== undefined) out.lucidModeIdx = c.i;
    if (c.y) out.ytLinks = c.y.split(',').map(x => (x === '_' ? '' : x));
    if (c.t) out.worldSourceType = c.t.split('').map(n => n === '0' ? 'synth' : (n === '1' ? 'youtube' : 'mp3'));
    if (c.w) out.worldSynth = c.w.split('').map(n => parseInt(n, 10));
    if (c.o) out.worldVolume = c.o.map(n => n / 100);
    if (c.u) {
      const ids = c.u.split(',').map(x => (x === '_' ? '' : x));
      if (!out.worldSources) out.worldSources = { mp3: ['', '', '', '', '', ''], youtube: ['', '', '', '', '', ''] };
      out.worldSources.youtube = ids;
    }
    return out;
  } catch (e) {
    return null;
  }
}

let seedTimer = null;

// Gera o código do sonho com throttle: durante o arrasto de sliders,
// evita reescrever o textarea (e refazer layout) dezenas de vezes por segundo.
export function generateFullSeed(immediate = false) {
  if (immediate) {
    if (seedTimer) { clearTimeout(seedTimer); seedTimer = null; }
    buildSeed();
    return;
  }
  if (seedTimer) return;
  seedTimer = setTimeout(() => { seedTimer = null; buildSeed(); }, 250);
}

function buildSeed() {
  const volSynthEl = document.getElementById('volSynth');
  const vs = (volSynthEl && volSynthEl.value != null) ? parseFloat(volSynthEl.value) : 0.2;
  const volumes = [
    state.worldVolume ? state.worldVolume[0] : 0.2,
    state.worldVolume ? state.worldVolume[1] : 0.2,
    state.worldVolume ? state.worldVolume[2] : 0.2,
    vs
  ];
  const worldYt = [0, 1, 2, 3, 4, 5].map(i => {
    // Se o campo do mundo está aberto, ele é a fonte mais recente.
    const input = document.getElementById(`ytUrl${i}`);
    if (input) {
      const m = input.value.trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : '';
    }
    // Caso contrário, preserva o link salvo (o campo não existe para mundos recolhidos).
    return (state.worldSources && state.worldSources.youtube && state.worldSources.youtube[i]) || '';
  });
  if (!state.worldSources.youtube) state.worldSources.youtube = ['', '', '', '', '', ''];
  state.worldSources.youtube = worldYt;
  const seed = encodeState({
    sourceMode: state.sourceMode,
    currentSynthType: state.currentSynthType,
    currentLevel: state.currentLevel,
    xyState: state.xyState,
    volumes,
    speed: parseFloat(document.getElementById('sliderSpeed').value),
    filter: parseFloat(document.getElementById('sliderFilter').value),
    delay: parseFloat(document.getElementById('sliderDelay').value),
    reverb: parseFloat(document.getElementById('sliderReverb').value),
    mechanics: {
      mem: state.isMemCatcherOn,
      auto: state.isAutoKickOn,
      spatial: state.isSpatial3DOn,
      lucidMin: [0, 15, 30, 60][state.lucidModeIdx],
      depr: state.isDeprivationWatchOn
    },
    lucidModeIdx: state.lucidModeIdx,
    ytLinks: worldYt.slice(0, 3),
    worldSourceType: state.worldSourceType,
    worldSynth: state.worldSynth,
    worldVolume: state.worldVolume,
    worldSources: { mp3: state.worldSources.mp3, youtube: worldYt }
  });
  const input = document.getElementById('seedInput');
  if (input) {
    input.value = seed;
    if (typeof window.autoResizeSeed === 'function') window.autoResizeSeed();
  }
}

export async function copySeed() {
  const input = document.getElementById('seedInput');
  if (!input) return;
  input.select();
  try {
    await navigator.clipboard.writeText(input.value);
    setSensorStatus('Código copiado para a área de transferência!');
  } catch (e) {
    try { document.execCommand('copy'); } catch (e2) {}
    setSensorStatus('Código copiado (fallback).');
  }
}

export async function applySeed() {
  const val = document.getElementById('seedInput').value.trim();
  if (!val) return;
  const audio = await import('./audio.js');
  audio.initAudio();

  const parsed = decodeState(val);
  if (!parsed) {
    alert('Formato de Código inválido.');
    return;
  }

  try {
    // Estado por mundo (fonte da verdade do novo modelo)
    if (parsed.worldSourceType) state.worldSourceType = parsed.worldSourceType;
    if (parsed.worldSynth) state.worldSynth = parsed.worldSynth;
    if (parsed.worldVolume) state.worldVolume = parsed.worldVolume;
    if (parsed.worldSources && parsed.worldSources.youtube) {
      state.worldSources.youtube = parsed.worldSources.youtube;
    }

    // Sliders antes do nível: selectLevel(..., true) preserva os valores salvos.
    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null && !isNaN(value)) el.value = value;
    };
    setVal('sliderSpeed', parsed.speed);
    setVal('sliderFilter', parsed.filter);
    setVal('sliderDelay', parsed.delay);
    setVal('sliderReverb', parsed.reverb);
    if (parsed.xyState) state.xyState = parsed.xyState;

    const levelIdx = (parsed.currentLevel !== undefined) ? parsed.currentLevel : state.currentLevel;
    audio.selectLevel(levelIdx, true);

    // Reflete o estado na UI imediatamente (o áudio aplica após o crossfade).
    if (typeof window.syncSourceRow === 'function') window.syncSourceRow(levelIdx);

    // Recria os players de YouTube que tenham link salvo.
    state.worldSources.youtube.forEach((id, i) => {
      if (id && window.loadYouTube) window.loadYouTube(i, `https://youtu.be/${id}`);
    });

    if (parsed.mechanics) {
      const m = parsed.mechanics;
      const mech = await import('./mechanics.js');
      if (m.mem !== state.isMemCatcherOn) await mech.toggleMemoryCatcher();
      if (m.auto !== state.isAutoKickOn) await mech.toggleAutoKick();
      if (m.spatial !== state.isSpatial3DOn) await mech.toggleSpatial3D();
      if (m.depr !== state.isDeprivationWatchOn) await mech.toggleDeprivationWatch();
      if (!isNaN(m.lucidMin)) {
        const modes = (await import('./config.js')).LUCID_MODES;
        const idx = modes.indexOf(m.lucidMin);
        if (idx >= 0) {
          state.lucidModeIdx = idx;
          mech.setLucidTimerMinutes(m.lucidMin);
        }
      }
    }

    audio.applyParameters();
    // Atualiza o código na hora após restaurar (sem esperar o throttle).
    generateFullSeed(true);
    setSensorStatus('Código restaurado com sucesso!');
  } catch (e) {
    console.error('applySeed:', e);
    alert('Formato de Código inválido.');
  }
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}