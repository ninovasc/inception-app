import { state } from './state.js';

// Pure encode: stateObj -> seed string
export function encodeState(s) {
  const mod = s.sourceMode === 'synth' ? 'S' : (s.sourceMode === 'youtube' ? 'Y' : (s.sourceMode === 'capture' ? 'C' : 'U'));
  const syn = s.currentSynthType;
  const lvl = s.currentLevel;
  const xyX = Math.round(s.xyState.x * 100);
  const xyY = Math.round(s.xyState.y * 100);
  const v = s.volumes || [0.9, 0.3, 0.3, 0.8];
  const v0 = Math.round(v[0] * 100);
  const v1 = Math.round(v[1] * 100);
  const v2 = Math.round(v[2] * 100);
  const vs = Math.round(v[3] * 100);
  const spd = Number(s.speed).toFixed(2);
  const flt = Math.round(s.filter);
  const dly = Number(s.delay).toFixed(2);
  const rev = Number(s.reverb).toFixed(2);
  const m = s.mechanics || {};
  const lucidMin = (m.lucidMin != null) ? m.lucidMin : [0, 15, 30, 60][s.lucidModeIdx || 0];
  const mch = `${m.mem ? 1 : 0}${m.auto ? 1 : 0}${m.spatial ? 1 : 0}${lucidMin}${m.depr ? 1 : 0}`;
  let seed = `MOD${mod}-SYN${syn}-LVL${lvl}-XY${xyX},${xyY}-VOL${v0},${v1},${v2},${vs}-SPD${spd}-FLT${flt}-DLY${dly}-REV${rev}-MCH${mch}`;
  if (s.ytLinks && s.ytLinks.some(x => x)) {
    seed += `-YT${s.ytLinks.map(x => x || '_').join(',')}`;
  }
  // per-world source types
  if (s.worldSourceType) {
    seed += `-WST${s.worldSourceType.join(',')}`;
  }
  if (s.worldSynth) {
    seed += `-WSY${s.worldSynth.join(',')}`;
  }
  if (s.worldVolume) {
    seed += `-WVL${s.worldVolume.map(v => Math.round(v * 100)).join(',')}`;
  }
  if (s.worldSources && s.worldSources.youtube && s.worldSources.youtube.some(x => x)) {
    seed += `-WSYU${s.worldSources.youtube.map(x => x || '_').join(',')}`;
  }
  return seed;
}

// Pure decode: seed string -> object or null
export function decodeState(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    const tokens = {};
    str.trim().split('-').forEach(part => {
      // XY is a 2-char key; YT is a 2-char key; all others are 3-char
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
    if (tokens.WST) {
      out.worldSourceType = tokens.WST.split(',');
    }
    if (tokens.WSY) {
      out.worldSynth = tokens.WSY.split(',').map(n => parseInt(n, 10));
    }
    if (tokens.WVL) {
      out.worldVolume = tokens.WVL.split(',').map(n => parseInt(n, 10) / 100);
    }
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
  const audio = null;
  const volSynthEl = document.getElementById('volSynth');
  const vs = (volSynthEl && volSynthEl.value != null) ? parseFloat(volSynthEl.value) : 0.2;
  const volumes = [
    state.worldVolume ? state.worldVolume[0] : 0.2,
    state.worldVolume ? state.worldVolume[1] : 0.2,
    state.worldVolume ? state.worldVolume[2] : 0.2,
    vs
  ];
  const ytLinks = [0, 1, 2].map(i => {
    const input = document.getElementById(`ytUrl${i}`);
    const url = input ? input.value.trim() : '';
    const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : '';
  });
  // per-world youtube urls
  const worldYt = [0,1,2,3,4,5].map(i => {
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
    ytLinks,
    worldSourceType: state.worldSourceType,
    worldSynth: state.worldSynth,
    worldVolume: state.worldVolume,
    worldSources: { mp3: state.worldSources.mp3, youtube: worldYt }
  });
  const input = document.getElementById('seedInput');
  if (input) input.value = seed;
}

export async function copySeed() {
  const input = document.getElementById('seedInput');
  if (!input) return;
  input.select();
  try {
    await navigator.clipboard.writeText(input.value);
    setSensorStatus('Seed copiada para a área de transferência!');
  } catch (e) {
    try { document.execCommand('copy'); } catch (e2) {}
    setSensorStatus('Seed copiada (fallback).');
  }
}

export async function applySeed() {
  const val = document.getElementById('seedInput').value.trim();
  if (!val) return;
  const audio = await import('./audio.js');
  audio.initAudio();

  const parsed = decodeState(val);
  if (!parsed) {
    alert('Formato de Seed inválido.');
    return;
  }

  try {
    if (parsed.sourceMode) audio.setSourceMode(parsed.sourceMode);
    if (parsed.currentSynthType !== undefined) audio.selectSynthType(parsed.currentSynthType);
    if (parsed.currentLevel !== undefined) audio.selectLevel(parsed.currentLevel);
    if (parsed.volumes) {
      const [v0, v1, v2, vs] = parsed.volumes;
      if (!isNaN(v0)) { document.getElementById('vol0').value = v0; audio.setVolume(0, v0); }
      if (!isNaN(v1)) { document.getElementById('vol1').value = v1; audio.setVolume(1, v1); }
      if (!isNaN(v2)) { document.getElementById('vol2').value = v2; audio.setVolume(2, v2); }
      if (!isNaN(vs)) { document.getElementById('volSynth').value = vs; audio.setSynthVolume(vs); }
    }
    if (parsed.speed !== undefined) document.getElementById('sliderSpeed').value = parsed.speed;
    if (parsed.filter !== undefined) document.getElementById('sliderFilter').value = parsed.filter;
    if (parsed.delay !== undefined) document.getElementById('sliderDelay').value = parsed.delay;
    if (parsed.reverb !== undefined) document.getElementById('sliderReverb').value = parsed.reverb;

    if (parsed.ytLinks) {
      const yt = await import('./youtube.js');
      parsed.ytLinks.forEach((id, i) => {
        const input = document.getElementById(`ytUrl${i}`);
        if (input) input.value = id ? `https://youtu.be/${id}` : '';
        if (id) yt.loadYouTube(i, `https://youtu.be/${id}`);
      });
    }
    if (parsed.worldSourceType) state.worldSourceType = parsed.worldSourceType;
    if (parsed.worldSynth) state.worldSynth = parsed.worldSynth;
    if (parsed.worldVolume) state.worldVolume = parsed.worldVolume;
    if (parsed.worldSources && parsed.worldSources.youtube) {
      state.worldSources.youtube = parsed.worldSources.youtube;
      // restore inputs
      parsed.worldSources.youtube.forEach((id, i) => {
        const input = document.getElementById(`ytUrl${i}`);
        if (input) input.value = id ? `https://youtu.be/${id}` : '';
      });
    }

    if (parsed.xyState) {
      const { x, y } = parsed.xyState;
      state.xyState = { x, y };
      const cursor = document.getElementById('xyCursor');
      if (cursor) {
        cursor.style.left = (x * 100) + '%';
        cursor.style.top = (y * 100) + '%';
      }
      const coords = document.getElementById('xyCoords');
      if (coords) coords.textContent = `X: ${Math.round(x * 100)}% | Y: ${Math.round((1 - y) * 100)}%`;
    }

    // Restore mechanics
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
    setSensorStatus('Seed restaurada com sucesso!');
  } catch (e) {
    alert('Formato de Seed inválido.');
  }
}

function setSensorStatus(msg) {
  const el = document.getElementById('sensorStatus');
  if (el) el.textContent = msg;
}
