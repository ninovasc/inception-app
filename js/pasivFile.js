// ============================================================
// PASIV Engine — Persistência de Arquivo .PASIV
// Schema: PASIV-1 (JSON)
// ============================================================

import { state } from './state.js';
import { DEFAULTS } from './config.js';
import { t } from './i18n.js';
import { updateGenerativeUIVisibility } from './ui/generativeUI.js';
import { updatePomodoroUI } from './ui/pomodoroUI.js';
import { updateSleepUI } from './ui/sleepUI.js';
import { syncMechanicsUI } from './mechanics.js';
import { syncSensorsUI } from './sensors.js';
import { updateModeUI } from './modes/uiUpdater.js';
import { updateGenerativeVariation } from './ui/generativeUI.js';
import { renderWorldSelect, renderVoicePresets, renderSourceList } from './ui/commonUI.js';
import { renderTriggerList } from './features/triggerController.js';

// ============================================================
// Estado interno
// ============================================================
let _isDirty = false;

// ============================================================
// Utilitários de comparação profunda
// ============================================================

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function getStateSnapshot() {
  // Retorna apenas campos serializáveis do state (exclui AudioNodes, buffers, intervals, etc.)
  return {
    sourceMode: state.sourceMode,
    currentSynthType: state.currentSynthType,
    autoMode: state.autoMode,
    worldTriggers: { ...state.worldTriggers },
    triggerMotion: state.triggerMotion,
    triggerSilenceSec: state.triggerSilenceSec,
    worldSourceType: [...state.worldSourceType],
    worldSynth: [...state.worldSynth],
    worldVolume: [...state.worldVolume],
    worldSources: { mp3: [...state.worldSources.mp3] },
    gpsRain: state.gpsRain,
    gpsNight: state.gpsNight,
    gpsSpeedMps: state.gpsSpeedMps,
    motionIntensity: state.motionIntensity,
    currentLevel: state.currentLevel,
    xyState: { ...state.xyState },
    micPreset: state.micPreset,
    micGateThreshold: state.micGateThreshold,
    isMemCatcherOn: state.isMemCatcherOn,
    isAutoKickOn: state.isAutoKickOn,
    isSpatial3DOn: state.isSpatial3DOn,
    isGyroSlidersOn: state.isGyroSlidersOn,
    lucidModeIdx: state.lucidModeIdx,
    isDeprivationWatchOn: state.isDeprivationWatchOn,
    pomodoro: { ...state.pomodoro },
    sleep: { ...state.sleep }
  };
}

// ============================================================
// Detecção de isDirty
// ============================================================

export function isDirty() {
  return _isDirty;
}

export function markDirty() {
  if (!_isDirty) {
    _isDirty = true;
    updateExportButtonState();
  }
}

export function clearDirty() {
  _isDirty = false;
  updateExportButtonState();
}

function updateExportButtonState() {
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btnExportPasiv'));
  if (btn) btn.disabled = !_isDirty;
}

// ============================================================
// Serialização / Exportação
// ============================================================

export function collectPasivState() {
  const snapshot = getStateSnapshot();
  return {
    schema: 'PASIV-1',
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: /** @type {any} */ (window).APP_VERSION || 50000,
    state: snapshot
  };
}

export function validatePasivJson(json) {
  if (!json || typeof json !== 'object') {
    return { valid: false, error: t('pasiv.error.invalidJson') };
  }
  if (json.schema !== 'PASIV-1') {
    return { valid: false, error: t('pasiv.error.unknownSchema').replace('{schema}', json.schema || 'unknown') };
  }
  if (!json.state || typeof json.state !== 'object') {
    return { valid: false, error: t('pasiv.error.missingState') };
  }
  return { valid: true };
}

async function exportViaFileSystemAccess(pasivObj, filename) {
  if (!/** @type {any} */ (window).showSaveFilePicker) return false;
  
  try {
    const handle = await /** @type {any} */ (window).showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'PASIV Config',
        accept: { 'application/json': ['.PASIV'] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(pasivObj, null, 2));
    await writable.close();
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false; // user cancelled
    throw err;
  }
}

function exportViaBlobDownload(pasivObj, filename) {
  const blob = new Blob([JSON.stringify(pasivObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportPasivFile() {
  if (!_isDirty) {
    alert(t('pasiv.export.noChanges'));
    return false;
  }
  
  const pasivObj = collectPasivState();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `pasiv-config-${timestamp}.PASIV`;
  
  const success = await exportViaFileSystemAccess(pasivObj, filename);
  if (!success) {
    exportViaBlobDownload(pasivObj, filename);
  }
  
  clearDirty();
  return true;
}

// ============================================================
// Importação
// ============================================================

export async function importPasivFile(file) {
  if (!file.name.endsWith('.PASIV')) {
    throw new Error(t('pasiv.import.invalidExtension'));
  }
  
  let json;
  try {
    const text = await file.text();
    json = JSON.parse(text);
  } catch {
    throw new Error(t('pasiv.error.invalidJson'));
  }
  
  const validation = validatePasivJson(json);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Aplica estado
  applyPasivState(json.state);
  
  clearDirty();
  return true;
}

function applyPasivState(savedState) {
  if (!savedState) return;
  
  // Restaura campos simples
  const simpleFields = [
    'sourceMode', 'currentSynthType', 'autoMode', 'triggerMotion',
    'triggerSilenceSec', 'currentLevel', 'micPreset', 'micGateThreshold',
    'isMemCatcherOn', 'isAutoKickOn', 'isSpatial3DOn', 'isGyroSlidersOn',
    'lucidModeIdx', 'isDeprivationWatchOn', 'micGateThreshold'
  ];
  
  for (const field of simpleFields) {
    if (savedState[field] !== undefined) {
      state[field] = savedState[field];
    }
  }
  
  // Arrays e objetos
  if (savedState.worldTriggers) state.worldTriggers = { ...savedState.worldTriggers };
  if (savedState.worldSourceType) state.worldSourceType = [...savedState.worldSourceType];
  if (savedState.worldSynth) state.worldSynth = [...savedState.worldSynth];
  if (savedState.worldVolume) state.worldVolume = [...savedState.worldVolume];
  if (savedState.worldSources?.mp3) state.worldSources.mp3 = [...savedState.worldSources.mp3];
  if (savedState.xyState) state.xyState = { ...savedState.xyState };
  
  // Pomodoro
  if (savedState.pomodoro) {
    state.pomodoro = { ...state.pomodoro, ...savedState.pomodoro };
  }
  
  // Sleep
  if (savedState.sleep) {
    state.sleep = { ...state.sleep, ...savedState.sleep };
  }
  
  // worldTriggers e gatilhos
  if (savedState.worldTriggers) state.worldTriggers = { ...savedState.worldTriggers };
  if (savedState.triggerMotion !== undefined) state.triggerMotion = savedState.triggerMotion;
  if (savedState.triggerSilenceSec !== undefined) state.triggerSilenceSec = savedState.triggerSilenceSec;
  
  // GPS
  if (savedState.gpsRain !== undefined) state.gpsRain = savedState.gpsRain;
  if (savedState.gpsNight !== undefined) state.gpsNight = savedState.gpsNight;
  if (savedState.gpsSpeedMps !== undefined) state.gpsSpeedMps = savedState.gpsSpeedMps;
  if (savedState.motionIntensity !== undefined) state.motionIntensity = savedState.motionIntensity;
  
  // Motion
  if (savedState.motionIntensity !== undefined) state.motionIntensity = savedState.motionIntensity;
  if (savedState.micPreset !== undefined) state.micPreset = savedState.micPreset;
  if (savedState.micGateThreshold !== undefined) state.micGateThreshold = savedState.micGateThreshold;
  
  // Booleans
  if (savedState.isMemCatcherOn !== undefined) state.isMemCatcherOn = savedState.isMemCatcherOn;
  if (savedState.isAutoKickOn !== undefined) state.isAutoKickOn = savedState.isAutoKickOn;
  if (savedState.isSpatial3DOn !== undefined) state.isSpatial3DOn = savedState.isSpatial3DOn;
  if (savedState.isGyroSlidersOn !== undefined) state.isGyroSlidersOn = savedState.isGyroSlidersOn;
  if (savedState.isDeprivationWatchOn !== undefined) state.isDeprivationWatchOn = savedState.isDeprivationWatchOn;
  
  // Lucid
  if (savedState.lucidModeIdx !== undefined) state.lucidModeIdx = savedState.lucidModeIdx;
  
  // currentLevel
  if (savedState.currentLevel !== undefined) state.currentLevel = savedState.currentLevel;
  
  // xyState
  if (savedState.xyState) state.xyState = { ...savedState.xyState };
  
  // Sincroniza UI
  renderWorldSelect();
  renderVoicePresets();
  renderSourceList();
  renderTriggerList();
  updatePomodoroUI();
  updateSleepUI();
  syncMechanicsUI();
  syncSensorsUI();
  updateGenerativeUIVisibility();
  updateModeUI();
  updateGenerativeVariation();
}

// ============================================================
// File input handler
// ============================================================

export function handlePasivFileInput(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  importPasivFile(file)
    .then(() => {
      alert(t('pasiv.import.success'));
      event.target.value = '';
    })
    .catch(err => {
      alert(t('pasiv.import.error').replace('{error}', err.message));
      event.target.value = '';
    });
}

// ============================================================
// Funções exportadas para uso por outros módulos via import direto
// ============================================================

export { _isDirty as isDirtyState };