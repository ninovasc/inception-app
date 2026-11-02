import { state } from './state.js';
import {
  normalizeSourceType,
  normalizeWorldTriggers,
  DEFAULT_TRIGGER_MOTION,
  DEFAULT_TRIGGER_SILENCE_SEC,
  WORLD_SYNTH,
  SYNTH_PRESETS,
  TRIGGER_DEFS,
  OLD6_TO_NEW13,
  LEGACY_TRIGGER_KEYS
} from './config.js';

// v3.0.0: seeds carregam a versão do schema (V:3) e arrays de 13 mundos.
// Seeds legadas (sem V) são migradas automaticamente ao decodificar.
const SCHEMA_VERSION = 3;
const N = 13;

// Compact key mapping for cipher
const KEYMAP = {
  schemaVersion: 'V',
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
  worldSources: 'u',
  autoMode: 'a',
  worldTriggers: 'g'
};

// worldSynth em base36 com 2 caracteres por mundo (suporta >9 presets).
function encodeSynthString13(arr) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const v = (arr && Number.isInteger(arr[i])) ? arr[i] : WORLD_SYNTH[i];
    out.push(Math.max(0, v).toString(36).padStart(2, '0'));
  }
  return out.join('');
}

function decodeSynthString13(str) {
  if (typeof str !== 'string' || str.length !== N * 2) return [...WORLD_SYNTH];
  const out = [];
  for (let i = 0; i < N; i++) {
    const v = parseInt(str.substr(i * 2, 2), 36);
    out.push((Number.isInteger(v) && v >= 0 && v < SYNTH_PRESETS.length) ? v : WORLD_SYNTH[i]);
  }
  return out;
}

function encodeTypeString13(arr) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const t = (arr && arr[i]) || 'synth';
    out.push(t === 'synth' ? '0' : (t === 'youtube' ? '1' : '2'));
  }
  return out.join('');
}

function decodeTypeString13(str) {
  if (typeof str !== 'string') return null;
  const out = [];
  for (let i = 0; i < N; i++) {
    const ch = str[i] || '0';
    out.push(ch === '1' ? 'youtube' : (ch === '2' ? 'mp3' : 'synth'));
  }
  return out;
}

function padArray(arr, len, fill) {
  const out = Array.isArray(arr) ? arr.slice(0, len) : [];
  while (out.length < len) out.push(fill);
  return out;
}

// Remapeia um array legado de 6 mundos para 13 (posições novas recebem o padrão).
function remapLegacyArray(oldArr, defaultFor) {
  const out = [];
  for (let i = 0; i < N; i++) out.push(defaultFor(i));
  if (Array.isArray(oldArr)) {
    const len = Math.min(oldArr.length, OLD6_TO_NEW13.length);
    for (let j = 0; j < len; j++) out[OLD6_TO_NEW13[j]] = oldArr[j];
  }
  return out;
}

// Pure encode: stateObj -> cipher string (base64 of compact JSON)
export function encodeState(s) {
  const compact = {};
  compact[KEYMAP.schemaVersion] = SCHEMA_VERSION;
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
  if (s.worldSourceType) compact[KEYMAP.worldSourceType] = encodeTypeString13(s.worldSourceType);
  if (s.worldSynth) compact[KEYMAP.worldSynth] = encodeSynthString13(s.worldSynth);
  if (s.worldVolume) compact[KEYMAP.worldVolume] = padArray(s.worldVolume, N, 0.2).map(v => Math.round(v * 100));
  if (s.worldSources && s.worldSources.youtube && s.worldSources.youtube.some(x => x)) {
    compact[KEYMAP.worldSources] = padArray(s.worldSources.youtube, N, '').map(x => x || '_').join(',');
  }
  if (s.autoMode !== undefined) compact[KEYMAP.autoMode] = s.autoMode ? 1 : 0;
  if (s.worldTriggers) {
    const t = s.worldTriggers;
    const motion = (s.triggerMotion != null) ? s.triggerMotion : DEFAULT_TRIGGER_MOTION;
    const silence = (s.triggerSilenceSec != null) ? s.triggerSilenceSec : DEFAULT_TRIGGER_SILENCE_SEC;
    compact[KEYMAP.worldTriggers] = [
      ...TRIGGER_DEFS.map(def => {
        const v = t[def.key];
        return (v === undefined) ? -1 : v;
      }),
      Math.round(motion * 100), Math.round(silence)
    ];
  }
  const json = JSON.stringify(compact);
  return btoa(json);
}

// Pure decode: cipher string -> object (sempre no modelo de 13 mundos) or null
export function decodeState(str) {
  if (!str || typeof str !== 'string') return null;
  str = str.trim();
  // Try base64 cipher first
  try {
    const json = atob(str);
    const c = JSON.parse(json);
    const out = {};
    const isV3 = c.V === SCHEMA_VERSION;

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
    if (c.a !== undefined) out.autoMode = !!c.a;

    if (isV3) {
      if (c.t !== undefined) out.worldSourceType = decodeTypeString13(c.t);
      if (c.w !== undefined) out.worldSynth = decodeSynthString13(c.w);
      if (c.o) out.worldVolume = padArray(c.o, N, 20).map(n => n / 100);
      if (c.u) {
        const ids = padArray(c.u.split(',').map(x => (x === '_' ? '' : x)), N, '');
        if (!out.worldSources) out.worldSources = { mp3: Array(N).fill(''), youtube: Array(N).fill('') };
        out.worldSources.youtube = ids;
      }
      if (Array.isArray(c.g)) {
        const raw = {};
        TRIGGER_DEFS.forEach((def, i) => { if (i < c.g.length) raw[def.key] = c.g[i]; });
        out.worldTriggers = normalizeWorldTriggers(raw);
        const motion = Number(c.g[TRIGGER_DEFS.length]);
        if (!isNaN(motion)) out.triggerMotion = Math.max(0, Math.min(1, motion / 100));
        const silence = Number(c.g[TRIGGER_DEFS.length + 1]);
        if (!isNaN(silence)) out.triggerSilenceSec = Math.max(5, Math.min(300, silence));
      }
      return out;
    }

    // ---- Seeds legadas (v2.x, 6 mundos): decodifica e migra para 13 ----
    if (c.t) out.worldSourceType = remapLegacyArray(
      c.t.split('').map(n => n === '0' ? 'synth' : (n === '1' ? 'youtube' : 'mp3')),
      () => 'synth'
    );
    if (c.w) {
      out.worldSynth = remapLegacyArray(
        c.w.split('').map(n => parseInt(n, 10)),
        (i) => WORLD_SYNTH[i]
      ).map((v, i) => (Number.isInteger(v) && v >= 0 && v < SYNTH_PRESETS.length) ? v : WORLD_SYNTH[i]);
    }
    if (c.o) out.worldVolume = remapLegacyArray(c.o, () => 20).map(n => n / 100);
    if (c.u) {
      const ids = c.u.split(',').map(x => (x === '_' ? '' : x));
      if (!out.worldSources) out.worldSources = { mp3: Array(N).fill(''), youtube: Array(N).fill('') };
      out.worldSources.youtube = remapLegacyArray(ids, () => '');
    }
    // Nível atual legado aponta para o mundo novo equivalente.
    if (Number.isInteger(out.currentLevel) && out.currentLevel >= 0 && out.currentLevel < OLD6_TO_NEW13.length) {
      out.currentLevel = OLD6_TO_NEW13[out.currentLevel];
    } else if (out.currentLevel !== undefined && (!Number.isInteger(out.currentLevel) || out.currentLevel < 0 || out.currentLevel >= N)) {
      delete out.currentLevel;
    }
    // Gatilhos legados: destinos 0–5 → mundos novos; regras novas ficam no padrão.
    if (Array.isArray(c.g)) {
      const mapped = {};
      for (let i = 0; i < LEGACY_TRIGGER_KEYS.length; i++) {
        const v = c.g[i];
        if (v === -1) { mapped[LEGACY_TRIGGER_KEYS[i]] = -1; continue; }
        mapped[LEGACY_TRIGGER_KEYS[i]] = (Number.isInteger(v) && v >= 0 && v < OLD6_TO_NEW13.length)
          ? OLD6_TO_NEW13[v] : v;
      }
      out.worldTriggers = normalizeWorldTriggers(mapped);
      const motion = Number(c.g[6]);
      if (!isNaN(motion)) out.triggerMotion = Math.max(0, Math.min(1, motion / 100));
      const silence = Number(c.g[7]);
      if (!isNaN(silence)) out.triggerSilenceSec = Math.max(5, Math.min(300, silence));
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
  // Salva volumes de todos os 13 mundos (não só 4 fixos)
  const volumes = state.worldVolume ? [...state.worldVolume] : Array(N).fill(0.2);
  // Garante que o volume global do synth (vs) esteja sincronizado se for o mundo atual
  if (state.currentLevel >= 0 && state.currentLevel < N) {
    volumes[state.currentLevel] = vs;
  }
  const ytCount = (state.worldSources && state.worldSources.youtube && state.worldSources.youtube.length) || N;
  const worldYt = [];
  for (let i = 0; i < ytCount; i++) {
    // Se o campo do mundo está aberto, ele é a fonte mais recente.
    const input = document.getElementById(`ytUrl${i}`);
    if (input) {
      const m = input.value.trim().match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      worldYt.push(m ? m[1] : '');
    } else {
      // Caso contrário, preserva o link salvo (o campo não existe para mundos recolhidos).
      worldYt.push((state.worldSources && state.worldSources.youtube && state.worldSources.youtube[i]) || '');
    }
  }
  if (!state.worldSources.youtube) state.worldSources.youtube = Array(N).fill('');
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
    worldSources: { mp3: state.worldSources.mp3, youtube: worldYt },
    autoMode: state.autoMode,
    worldTriggers: state.worldTriggers,
    triggerMotion: state.triggerMotion,
    triggerSilenceSec: state.triggerSilenceSec
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
    if (parsed.worldSourceType) {
      state.worldSourceType = parsed.worldSourceType.map(normalizeSourceType);
    }
    if (parsed.worldSynth) state.worldSynth = parsed.worldSynth;
    if (parsed.worldVolume) state.worldVolume = parsed.worldVolume;
    if (parsed.worldSources && parsed.worldSources.youtube) {
      state.worldSources.youtube = parsed.worldSources.youtube;
    }
    if (parsed.worldTriggers) {
      state.worldTriggers = normalizeWorldTriggers(parsed.worldTriggers);
    } else {
      state.worldTriggers = normalizeWorldTriggers(state.worldTriggers);
    }
    if (parsed.triggerMotion !== undefined) state.triggerMotion = parsed.triggerMotion;
    if (parsed.triggerSilenceSec !== undefined) state.triggerSilenceSec = parsed.triggerSilenceSec;
    if (typeof window.renderTriggerList === 'function') window.renderTriggerList();

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
    audio.selectLevel(Math.max(0, Math.min(N - 1, levelIdx)), true);

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

    // Modo Automático (sensores) - agora modo Narrativo
    if (parsed.autoMode !== undefined) {
      const narrative = await import('./modes/narrativeMode.js');
      narrative.setAutoModeEnabled(parsed.autoMode);
    }
    if (typeof window.syncMechanicsUI === 'function') window.syncMechanicsUI();

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
