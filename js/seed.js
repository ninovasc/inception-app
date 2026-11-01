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
    if (c.m !== undefined) out.sourceMode = c.m === 0 ? 'synth' : (c.m === 1 ? 'youtube' : (c.m === 2 ? 'capture' : 'upload'));
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
    if (c.t) out.worldSourceType = c.t.split('').map(n => n === '0' ? 'synth' : (n === '1' ? 'youtube' : 'upload'));
    if (c.w) out.worldSynth = c.w.split('').map(n => parseInt(n, 10));
    if (c.o) out.worldVolume = c.o.map(n => n / 100);
    if (c.u) {
      const ids = c.u.split(',').map(x => (x === '_' ? '' : x));
      if (!out.worldSources) out.worldSources = { mp3: ['', '', '', '', '', ''], youtube: ['', '', '', '', '', ''] };
      out.worldSources.youtube = ids;
    }
    return out;
  } catch (e) {
    // Fallback: try old token format
    return decodeLegacy(str);
  }
}

function decodeLegacy(str) {
  try {
    const tokens = {};
    str.trim().split('-').forEach(part => {
      let key, data;
      if (part.startsWith('XY')) { key = 'XY'; data = part.slice(2); }
      else if (part.startsWith('YT')) { key = 'YT'; data = part.slice(2); }
      else if (part.startsWith('WST')) { key = 'WST'; data = part.slice(3); }
      else if (part.startsWith('WSY')) { key = 'WSY'; data = part.slice(3); }
      else if (part.startsWith('WVL')) { key = 'WVL'; data = part.slice(3); }
      else if (part.startsWith('WSYU')) { key = 'WSYU'; data = part.slice(4); }
      else { key = part.slice(0, 3); data = part.slice(3); }
      tokens[key] = data;
    });
    const out = {};
    if (tokens.MOD) out.sourceMode = tokens.MOD === 'S' ? 'synth' : (tokens.MOD === 'Y' ? 'youtube' : (tokens.MOD === 'C' ? 'capture' : 'upload'));
    if (tokens.SYN !== undefined) out.currentSynthType = parseInt(tokens.SYN, 10);
    if (tokens.LVL !== undefined) out.currentLevel = parseInt(tokens.LVL, 10);
    if (tokens.XY) {
      const [xx, yy] = tokens.XY.split(',').map(n => parseInt(n, 10) / 100);
      if (!isNaN(xx) && !isNaN(yy)) out.xyState = { x: xx, y: yy };
    }
    if (tokens.VOL) {
      const parts = tokens.VOL.split(',').map(n => parseInt(n, 10) / 100);
      if (parts.length === 4 && parts.every(n => !isNaN(n))) out.volumes = parts;
    }
    if (tokens.SPD) out.speed = parseFloat(tokens.SPD);
    if (tokens.FLT) out.filter = parseFloat(tokens.FLT);
    if (tokens.DLY) out.delay = parseFloat(tokens.DLY);
    if (tokens.REV) out.reverb = parseFloat(tokens.REV);
    if (tokens.MCH) {
      const m = tokens.MCH;
      out.mechanics = {
        mem: m.charAt(0) === '1',
        auto: m.charAt(1) === '1',
        spatial: m.charAt(2) === '1',
        lucidMin: parseInt(m.slice(3, m.length - 1), 10),
        depr: m.charAt(m.length - 1) === '1'
      };
    }
    if (tokens.YT) {
      const ids = tokens.YT.split(',').map(x => (x === '_' ? '' : x));
      out.ytLinks = ids;
    }
    if (tokens.WST) out.worldSourceType = tokens.WST.split(',');
    if (tokens.WSY) out.worldSynth = tokens.WSY.split(',').map(n => parseInt(n, 10));
    if (tokens.WVL) out.worldVolume = tokens.WVL.split(',').map(n => parseInt(n, 10) / 100);
    if (tokens.WSYU) {
      const ids = tokens.WSYU.split(',').map(x => (x === '_' ? '' : x));
      if (!out.worldSources) out.worldSources = { mp3: ['', '', '', '', '', ''], youtube: ['', '', '', '', '', ''] };
      out.worldSources.youtube = ids;
    }
    return out;
  } catch (e) {
    return null;
  }
}

export function generateFullSeed() {
  const volSynthEl = document.getElementById('volSynth');
  const vs = (volSynthEl && volSynthEl.value != null) ? parseFloat(volSynthEl.value) : 0.2;
  const volumes = [
    state.worldVolume ? state.worldVolume[0] : 0.2,
    state.worldVolume ? state.worldVolume[1] : 0.2,
    state.worldVolume ? state.worldVolume[2] : 0.2,
    vs
  ];
  const worldYt = [0, 1, 2, 3, 4, 5].map(i => {
    const input = document.getElementById(`ytUrl${i}`);
    const url = input ? input.value.trim() : '';
    const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  });
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
    ytLinks: [0, 1, 2].map(i => {
      const input = document.getElementById(`ytUrl${i}`);
      const url = input ? input.value.trim() : '';
      const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      return m ? m[1] : '';
    }),
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
    if (parsed.sourceMode) audio.setSourceMode(parsed.sourceMode);
    if (parsed.currentSynthType !== undefined) audio.selectSynthType(parsed.currentSynthType);
    if (parsed.currentLevel !== undefined) audio.selectLevel(parsed.currentLevel);
    if (parsed.volumes) {
      const vs = parsed.volumes[3];
      const volSynthEl = document.getElementById('volSynth');
      if (volSynthEl && !isNaN(vs)) { volSynthEl.value = vs; audio.setSynthVolume(vs); }
    }
    if (parsed.speed !== undefined) document.getElementById('sliderSpeed').value = parsed.speed;
    if (parsed.filter !== undefined) document.getElementById('sliderFilter').value = parsed.filter;
    if (parsed.delay !== undefined) document.getElementById('sliderDelay').value = parsed.delay;
    if (parsed.reverb !== undefined) document.getElementById('sliderReverb').value = parsed.reverb;

    if (parsed.xyState) {
      state.xyState = parsed.xyState;
    }

    if (parsed.worldSourceType) state.worldSourceType = parsed.worldSourceType;
    if (parsed.worldSynth) state.worldSynth = parsed.worldSynth;
    if (parsed.worldVolume) state.worldVolume = parsed.worldVolume;
    if (parsed.worldSources && parsed.worldSources.youtube) {
      state.worldSources.youtube = parsed.worldSources.youtube;
      parsed.worldSources.youtube.forEach((id, i) => {
        const input = document.getElementById(`ytUrl${i}`);
        if (input) input.value = id ? `https://youtu.be/${id}` : '';
      });
    }

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
    setSensorStatus('Código restaurado com sucesso!');
  } catch (e) {
    alert('Formato de Código inválido.');
  }
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}