import { state } from './state.js';

export function generateFullSeed() {
  const mod = state.sourceMode === 'synth' ? 'S' : 'U';
  const syn = state.currentSynthType;
  const lvl = state.currentLevel;
  const xyX = Math.round(state.xyState.x * 100);
  const xyY = Math.round(state.xyState.y * 100);
  const v0 = Math.round(parseFloat(document.getElementById('vol0').value) * 100);
  const v1 = Math.round(parseFloat(document.getElementById('vol1').value) * 100);
  const v2 = Math.round(parseFloat(document.getElementById('vol2').value) * 100);
  const vs = Math.round(parseFloat(document.getElementById('volSynth').value) * 100);
  const spd = parseFloat(document.getElementById('sliderSpeed').value).toFixed(2);
  const flt = Math.round(parseFloat(document.getElementById('sliderFilter').value));
  const dly = parseFloat(document.getElementById('sliderDelay').value).toFixed(2);
  const rev = parseFloat(document.getElementById('sliderReverb').value).toFixed(2);
  const mch = `${state.isMemCatcherOn ? 1 : 0}${state.isAutoKickOn ? 1 : 0}${state.isSpatial3DOn ? 1 : 0}${(awaitSafeLucidMode())}${state.isDeprivationWatchOn ? 1 : 0}`;

  const seed = `MOD${mod}-SYN${syn}-LVL${lvl}-XY${xyX},${xyY}-VOL${v0},${v1},${v2},${vs}-SPD${spd}-FLT${flt}-DLY${dly}-REV${rev}-MCH${mch}`;
  const input = document.getElementById('seedInput');
  if (input) input.value = seed;
}

function awaitSafeLucidMode() {
  // LUCID_MODES imported lazily; default to current idx value stored as minutes not index.
  // We encode the minutes value (as original) using a lazy import cache.
  try {
    // original encoded LUCID_MODES[lucidModeIdx] (minutes), not index
    return window.__lucidModes ? window.__lucidModes[state.lucidModeIdx] : [0,15,30,60][state.lucidModeIdx];
  } catch (e) {
    return [0,15,30,60][state.lucidModeIdx];
  }
}

export async function copySeed() {
  const input = document.getElementById('seedInput');
  if (!input) return;
  input.select();
  try {
    await navigator.clipboard.writeText(input.value);
    setSensorStatus('Seed copiada para a área de transferência!');
  } catch (e) {
    document.execCommand && document.execCommand('copy');
    setSensorStatus('Seed copiada (fallback).');
  }
}

export async function applySeed() {
  const val = document.getElementById('seedInput').value.trim();
  if (!val) return;
  const audio = await import('./audio.js');
  audio.initAudio();

  try {
    const tokens = {};
    val.split('-').forEach(part => {
      const key = part.slice(0, 3);
      const data = part.slice(3);
      tokens[key] = data;
    });

    if (tokens.MOD) (await import('./audio.js')).setSourceMode(tokens.MOD === 'S' ? 'synth' : 'upload');
    if (tokens.SYN !== undefined) (await import('./audio.js')).selectSynthType(parseInt(tokens.SYN, 10));
    if (tokens.LVL !== undefined) {
      const lvl = parseInt(tokens.LVL, 10);
      (await import('./audio.js')).selectLevel(lvl);
    }
    if (tokens.VOL) {
      const [v0, v1, v2, vs] = tokens.VOL.split(',').map(n => parseInt(n, 10) / 100);
      if (!isNaN(v0)) { document.getElementById('vol0').value = v0; (await import('./audio.js')).setVolume(0, v0); }
      if (!isNaN(v1)) { document.getElementById('vol1').value = v1; (await import('./audio.js')).setVolume(1, v1); }
      if (!isNaN(v2)) { document.getElementById('vol2').value = v2; (await import('./audio.js')).setVolume(2, v2); }
      if (!isNaN(vs)) { document.getElementById('volSynth').value = vs; (await import('./audio.js')).setSynthVolume(vs); }
    }
    if (tokens.SPD) document.getElementById('sliderSpeed').value = parseFloat(tokens.SPD);
    if (tokens.FLT) document.getElementById('sliderFilter').value = parseFloat(tokens.FLT);
    if (tokens.DLY) document.getElementById('sliderDelay').value = parseFloat(tokens.DLY);
    if (tokens.REV) document.getElementById('sliderReverb').value = parseFloat(tokens.REV);

    if (tokens.XY) {
      const [xx, yy] = tokens.XY.split(',').map(n => parseInt(n, 10) / 100);
      if (!isNaN(xx) && !isNaN(yy)) {
        state.xyState = { x: xx, y: yy };
        document.getElementById('xyCursor').style.left = (xx * 100) + '%';
        document.getElementById('xyCursor').style.top = (yy * 100) + '%';
        document.getElementById('xyCoords').textContent = `X: ${Math.round(xx * 100)}% | Y: ${Math.round((1 - yy) * 100)}%`;
      }
    }

    // Restore mechanics from MCH token: MCH<mem><auto><spatial><lucidMinutes><deprivation>
    if (tokens.MCH) {
      const m = tokens.MCH;
      const mem = m.charAt(0) === '1';
      const auto = m.charAt(1) === '1';
      const spat = m.charAt(2) === '1';
      const lucidMin = parseInt(m.slice(3, m.length - 1), 10);
      const depr = m.charAt(m.length - 1) === '1';
      const mech = await import('./mechanics.js');
      if (mem !== state.isMemCatcherOn) await mech.toggleMemoryCatcher();
      if (auto !== state.isAutoKickOn) await mech.toggleAutoKick();
      if (spat !== state.isSpatial3DOn) await mech.toggleSpatial3D();
      if (depr !== state.isDeprivationWatchOn) await mech.toggleDeprivationWatch();
      if (!isNaN(lucidMin)) {
        const modes = (await import('./config.js')).LUCID_MODES;
        const idx = modes.indexOf(lucidMin);
        if (idx >= 0) {
          state.lucidModeIdx = idx;
          // apply without re-triggering seed storm: call setLucidTimerMinutes
          mech.setLucidTimerMinutes(lucidMin);
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
