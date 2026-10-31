import { state } from './state.js';

// Pure encode: stateObj -> seed string
export function encodeState(s) {
  const mod = s.sourceMode === 'synth' ? 'S' : 'U';
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
  return `MOD${mod}-SYN${syn}-LVL${lvl}-XY${xyX},${xyY}-VOL${v0},${v1},${v2},${vs}-SPD${spd}-FLT${flt}-DLY${dly}-REV${rev}-MCH${mch}`;
}

// Pure decode: seed string -> object or null
export function decodeState(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    const tokens = {};
    str.trim().split('-').forEach(part => {
      // XY is a 2-char key; all others are 3-char
      let key, data;
      if (part.startsWith('XY')) { key = 'XY'; data = part.slice(2); }
      else { key = part.slice(0, 3); data = part.slice(3); }
      tokens[key] = data;
    });
    const out = {};
    if (tokens.MOD) out.sourceMode = tokens.MOD === 'S' ? 'synth' : 'upload';
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
    return out;
  } catch (e) {
    return null;
  }
}

export function generateFullSeed() {
  const audio = null;
  const volumes = [
    parseFloat(document.getElementById('vol0').value),
    parseFloat(document.getElementById('vol1').value),
    parseFloat(document.getElementById('vol2').value),
    parseFloat(document.getElementById('volSynth').value)
  ];
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
    lucidModeIdx: state.lucidModeIdx
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
