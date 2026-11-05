// Comprehensive Test Suite for PASIV Engine v4.0.3
// Tests every functionality with extreme granularity

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

// Helper to read file
function readFile(path) {
  return fs.readFileSync(path, 'utf8');
}

// Helper to check if file exists
function fileExists(path) {
  return fs.existsSync(path);
}

// Helper to count exports in a file
function countExports(content) {
  const exports = content.match(/export\s+(?:function|const|let|var|class|default)?\s*(\w+)/g) || [];
  const exportBrace = content.match(/export\s*\{([^}]+)\}/g) || [];
  let count = exports.length;
  exportBrace.forEach(m => {
    const items = m.match(/\{([^}]+)\}/)[1];
    count += items.split(',').length;
  });
  return count;
}

// Helper to count functions in a file
function countFunctions(content) {
  const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
  const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
  let count = 0;
  let match;
  while ((match = funcRegex.exec(content)) !== null) count++;
  while ((match = arrowRegex.exec(content)) !== null) count++;
  return count;
}

// Helper to check balanced brackets
function checkBrackets(content) {
  let brace = 0, paren = 0, bracket = 0;
  let inString = false, stringChar = '', inTemplate = false, inComment = false, inLineComment = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i+1];
    const prev = content[i-1];
    
    if (!inString && !inTemplate && !inComment && !inLineComment) {
      if (ch === '/' && next === '/') { inLineComment = true; i++; continue; }
      if (ch === '/' && next === '*') { inComment = true; i++; continue; }
    }
    if (inLineComment) { if (ch === '\n') inLineComment = false; continue; }
    if (inComment) { if (ch === '*' && next === '/') { inComment = false; i++; } continue; }
    
    if (!inString && !inTemplate && !inComment && !inLineComment) {
      if (ch === '`') inTemplate = true;
      else if (ch === '"' || ch === "'") { inString = true; stringChar = ch; }
      else if (ch === '{') brace++;
      else if (ch === '}') brace--;
      else if (ch === '(') paren++;
      else if (ch === ')') paren--;
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket--;
    } else if (inString) {
      if (ch === stringChar && prev !== '\\') inString = false;
    } else if (inTemplate) {
      if (ch === '`') inTemplate = false;
    }
  }
  return { brace, paren, bracket };
}

describe('File Structure', () => {
  test('all required JS files exist', () => {
    const requiredFiles = [
      'js/app.js', 'js/features/modeController.js', 'js/features/triggerController.js', 'js/features/pomodoroController.js', 'js/features/sleepController.js', 'js/features/accordionController.js', 'js/state.js', 'js/config.js', 'js/audio.js', 'js/audio/core.js', 'js/audio/synth.js', 'js/audio/mp3.js', 'js/audio/stems.js', 'js/audio/world.js', 'js/audio/effects.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/screensaver-svg.js', 'js/screensaver.js', 'js/synth/generativeEngine.js',
      'js/ui/commonUI.js', 'js/ui/freeUI.js', 'js/ui/generativeUI.js',
      'js/ui/modeSelector.js', 'js/ui/narrativeUI.js', 'js/ui/pomodoroUI.js',
      'js/ui/sleepUI.js', 'js/modes/modeManager.js', 'js/modes/modeSwitcher.js',
       'js/modes/panelManager.js', 'js/modes/uiUpdater.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    requiredFiles.forEach(f => {
      assert.ok(fileExists(f), `File should exist: ${f}`);
    });
  });

  test('all JS files have balanced brackets', () => {
    const files = [
      'js/app.js', 'js/features/modeController.js', 'js/features/triggerController.js', 'js/features/pomodoroController.js', 'js/features/sleepController.js', 'js/features/accordionController.js', 'js/state.js', 'js/config.js', 'js/audio.js', 'js/audio/core.js', 'js/audio/synth.js', 'js/audio/mp3.js', 'js/audio/stems.js', 'js/audio/world.js', 'js/audio/effects.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/screensaver-svg.js', 'js/screensaver.js', 'js/synth/generativeEngine.js',
      'js/ui/commonUI.js', 'js/ui/freeUI.js', 'js/ui/generativeUI.js',
      'js/ui/modeSelector.js', 'js/ui/narrativeUI.js', 'js/ui/pomodoroUI.js',
      'js/ui/sleepUI.js', 'js/modes/modeManager.js', 'js/modes/modeSwitcher.js',
       'js/modes/panelManager.js', 'js/modes/uiUpdater.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    files.forEach(f => {
      // Use node --check instead of our bracket counter
      try {
        execSync('node --check ' + f, { stdio: 'pipe', cwd: ROOT });
      } catch (e) {
        assert.fail(`${f}: syntax error`);
      }
    });
  });

  test('index.html exists and has required elements', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('modeSelector'), 'Should have modeSelector');
    assert.ok(html.includes('worldsPanel'), 'Should have worldsPanel');
    assert.ok(html.includes('voicePanel'), 'Should have voicePanel');
    assert.ok(html.includes('sourcePanel'), 'Should have sourcePanel');
    assert.ok(html.includes('triggerPanel'), 'Should have triggerPanel');
    assert.ok(html.includes('mechPanel'), 'Should have mechPanel');
    assert.ok(html.includes('pomodoroPanel'), 'Should have pomodoroPanel');
    assert.ok(html.includes('sleepPanel'), 'Should have sleepPanel');
    assert.ok(html.includes('langSelector'), 'Should have langSelector');
    assert.ok(html.includes('kickBtn'), 'Should have kickBtn');
    assert.ok(html.includes('startModeBtn'), 'Should have startModeBtn');
  });
});

describe('Import/Export Consistency', () => {
  test('all imports resolve to existing files', () => {
    const files = [
      'js/app.js', 'js/features/modeController.js', 'js/features/triggerController.js', 'js/features/pomodoroController.js', 'js/features/sleepController.js', 'js/features/accordionController.js', 'js/state.js', 'js/config.js', 'js/audio.js', 'js/audio/core.js', 'js/audio/synth.js', 'js/audio/mp3.js', 'js/audio/stems.js', 'js/audio/world.js', 'js/audio/effects.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/screensaver-svg.js', 'js/screensaver.js', 'js/synth/generativeEngine.js',
      'js/ui/commonUI.js', 'js/ui/freeUI.js', 'js/ui/generativeUI.js',
      'js/ui/modeSelector.js', 'js/ui/narrativeUI.js', 'js/ui/pomodoroUI.js',
      'js/ui/sleepUI.js', 'js/modes/modeManager.js', 'js/modes/modeSwitcher.js',
       'js/modes/panelManager.js', 'js/modes/uiUpdater.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    
    files.forEach(f => {
      const content = readFile(f);
      const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[3];
        if (importPath.startsWith('.')) {
          const dir = f.substring(0, f.lastIndexOf('/'));
          const resolved = path.resolve(ROOT, dir, importPath);
          const resolvedPath = resolved.replace(/\.js$/, '') + '.js';
          assert.ok(fs.existsSync(resolvedPath), `${f} imports non-existent file: ${importPath}`);
        }
      }
    });
  });
});

describe('Mode Configuration', () => {
  test('config.js exports all required mode constants', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes('export const MODES'), 'Should export MODES');
    assert.ok(content.includes('export const MODE_ORDER'), 'Should export MODE_ORDER');
    assert.ok(content.includes('export const DEFAULT_MODE'), 'Should export DEFAULT_MODE');
    assert.ok(content.includes('export const POMODORO_LEVELS'), 'Should export POMODORO_LEVELS');
    assert.ok(content.includes('export const POMODORO_WORLD_NAMES'), 'Should export POMODORO_WORLD_NAMES');
    assert.ok(content.includes('export const POMODORO_WORLD_COUNT'), 'Should export POMODORO_WORLD_COUNT');
    assert.ok(content.includes('export const SLEEP_LEVELS'), 'Should export SLEEP_LEVELS');
    assert.ok(content.includes('export const SLEEP_WORLD_NAMES'), 'Should export SLEEP_WORLD_NAMES');
    assert.ok(content.includes('export const SLEEP_WORLD_COUNT'), 'Should export SLEEP_WORLD_COUNT');
    assert.ok(content.includes('export function getCurrentModeWorlds'), 'Should export getCurrentModeWorlds');
  });

  test('MODES has 4 modes', () => {
    const content = readFile('js/config.js');
    const modesMatch = content.match(/export const MODES = \[([\s\S]*?)\];/);
    assert.ok(modesMatch, 'MODES should be defined');
    const modeCount = (modesMatch[1].match(/\{ id:/g) || []).length;
    assert.equal(modeCount, 4, 'Should have 4 modes');
  });

  test('DEFAULT_MODE is narrative', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes("export const DEFAULT_MODE = 'narrative'"), 'DEFAULT_MODE should be narrative');
  });

  test('MODE_ORDER has all 4 modes', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes("export const MODE_ORDER = ['narrative', 'pomodoro', 'sleep', 'free']"), 'MODE_ORDER should have all 4 modes');
  });

  test('POMODORO has 2 worlds', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes('export const POMODORO_WORLD_COUNT = POMODORO_LEVELS.length'), 'POMODORO_WORLD_COUNT should be defined');
    assert.ok(content.includes("export const POMODORO_LEVELS = ["), 'POMODORO_LEVELS should be defined');
    const levels = content.match(/export const POMODORO_LEVELS = \[([\s\S]*?)\];/);
    const count = (levels[1].match(/\{ name:/g) || []).length;
    assert.equal(count, 2, 'POMODORO should have 2 worlds');
  });

  test('SLEEP has 8 worlds', () => {
    const content = readFile('js/config.js');
    const levels = content.match(/export const SLEEP_LEVELS = \[([\s\S]*?)\];/);
    const count = (levels[1].match(/\{ name:/g) || []).length;
    assert.equal(count, 8, 'SLEEP should have 8 worlds');
  });

  test('getCurrentModeWorlds function exists and handles all modes', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes('export function getCurrentModeWorlds(currentMode)'), 'Should export getCurrentModeWorlds');
    assert.ok(content.includes("case 'narrative':"), 'Should handle narrative');
    assert.ok(content.includes("case 'pomodoro':"), 'Should handle pomodoro');
    assert.ok(content.includes("case 'sleep':"), 'Should handle sleep');
    assert.ok(content.includes("case 'free':"), 'Should handle free');
    assert.ok(content.includes('default:'), 'Should handle default');
  });
});

describe('State Management', () => {
  test('state.js exports state object', () => {
    const content = readFile('js/state.js');
    assert.ok(content.includes('export const state = {'), 'Should export state');
  });

  test('state has currentMode initialized to empty string', () => {
    const content = readFile('js/state.js');
    assert.ok(content.includes("currentMode: ''"), 'currentMode should be empty string');
  });

  test('state has pomodoro defaults', () => {
    const content = readFile('js/state.js');
    assert.ok(content.includes('pomodoro:'), 'Should have pomodoro state');
  });

  test('state has sleep defaults', () => {
    const content = readFile('js/state.js');
    assert.ok(content.includes('sleep:'), 'Should have sleep state');
  });
});

describe('i18n', () => {
  test('i18n.js exports required functions', () => {
    const content = readFile('js/i18n.js');
    assert.ok(content.includes('export function getLang'), 'Should export getLang');
    assert.ok(content.includes('export function setLang'), 'Should export setLang');
    assert.ok(content.includes('export function t'), 'Should export t');
    assert.ok(content.includes('export function initI18n'), 'Should export initI18n');
  });

  test('i18n supports 3 languages', () => {
    const content = readFile('js/i18n.js');
    assert.ok(content.includes("'en-US'"), 'Should have en-US');
    assert.ok(content.includes("'es-ES'"), 'Should have es-ES');
    assert.ok(content.includes("'pt-BR'"), 'Should have pt-BR');
  });

  test('i18n has lang keys for all languages', () => {
    const content = readFile('js/i18n.js');
    assert.ok(content.includes("'lang.label'"), 'Should have lang.label');
    assert.ok(content.includes("'lang.en'"), 'Should have lang.en');
    assert.ok(content.includes("'lang.es'"), 'Should have lang.es');
    assert.ok(content.includes("'lang.pt'"), 'Should have lang.pt');
  });

  test('i18n has mode keys', () => {
    const content = readFile('js/i18n.js');
    assert.ok(content.includes("'pomodoro.title'"), 'Should have pomodoro.title');
    assert.ok(content.includes("'sleep.title'"), 'Should have sleep.title');
  });
});

describe('UI Components', () => {
  test('modeSelector.js exports required functions', () => {
    const content = readFile('js/ui/modeSelector.js');
    assert.ok(content.includes('export function createModeSelector'), 'Should export createModeSelector');
    assert.ok(content.includes('export function updateModeSelector'), 'Should export updateModeSelector');
    assert.ok(content.includes('export function initModeSelector'), 'Should export initModeSelector');
  });

  test('pomodoroUI.js exports required functions', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('export function createPomodoroUI'), 'Should export createPomodoroUI');
    assert.ok(content.includes('export function updatePomodoroUI'), 'Should export updatePomodoroUI');
  });

  test('sleepUI.js exports required functions', () => {
    const content = readFile('js/ui/sleepUI.js');
    assert.ok(content.includes('export function createSleepUI'), 'Should export createSleepUI');
    assert.ok(content.includes('export function updateSleepUI'), 'Should export updateSleepUI');
  });

  test('commonUI.js exports required functions', () => {
    const content = readFile('js/ui/commonUI.js');
    assert.ok(content.includes('export function initCommonUI'), 'Should export initCommonUI');
    assert.ok(content.includes('export function renderWorldSelect'), 'Should export renderWorldSelect');
    assert.ok(content.includes('export function renderVoicePresets'), 'Should export renderVoicePresets');
    assert.ok(content.includes('export function renderSourceList'), 'Should export renderSourceList');
  });

  test('narrativeUI.js exports required functions', () => {
    const content = readFile('js/ui/narrativeUI.js');
    assert.ok(content.includes('export function createNarrativeUI'), 'Should export createNarrativeUI');
    assert.ok(content.includes('export function updateNarrativeUI'), 'Should export updateNarrativeUI');
  });

  test('freeUI.js exports required functions', () => {
    const content = readFile('js/ui/freeUI.js');
    assert.ok(content.includes('export function createFreeUI'), 'Should export createFreeUI');
    assert.ok(content.includes('export function updateFreeUI'), 'Should export updateFreeUI');
  });
});

describe('Mode Manager', () => {
  test('modeManager.js exports required functions', () => {
    const content = readFile('js/modes/modeManager.js');
    assert.ok(content.includes('export function initModeManager'), 'Should export initModeManager');
    assert.ok(content.includes('export function switchMode'), 'Should export switchMode');
    assert.ok(content.includes('export function isMode'), 'Should export isMode');
    assert.ok(content.includes('export function isPomodoroMode'), 'Should export isPomodoroMode');
    assert.ok(content.includes('export function isSleepMode'), 'Should export isSleepMode');
    assert.ok(content.includes('export function isNarrativeMode'), 'Should export isNarrativeMode');
    assert.ok(content.includes('export function isFreeMode'), 'Should export isFreeMode');
    assert.ok(content.includes('export function updateModeSpecificUI'), 'Should export updateModeSpecificUI');
    assert.ok(content.includes('export const modeModules'), 'Should export modeModules');
  });

  test('modeSwitcher.js handles empty modeId in switchMode', () => {
    const content = readFile('js/modes/modeSwitcher.js');
    assert.ok(content.includes("if (!modeId)"), 'Should handle empty modeId');
    assert.ok(content.includes("localStorage.removeItem('pasiv-mode')"), 'Should remove from localStorage');
  });

  test('panelManager.js has updatePanelVisibility', () => {
    const content = readFile('js/modes/panelManager.js');
    assert.ok(content.includes('function updatePanelVisibility'), 'Should have updatePanelVisibility');
    assert.ok(content.includes("const show = modes.includes(state.currentMode)"), 'Should check mode inclusion');
  });
});

describe('Mode Implementations', () => {
  test('narrativeMode.js exports required functions', () => {
    const content = readFile('js/modes/narrativeMode.js');
    assert.ok(content.includes('export function getActiveTrigger'), 'Should export getActiveTrigger');
    assert.ok(content.includes('export function startAutoMode'), 'Should export startAutoMode');
    assert.ok(content.includes('export function stopAutoMode'), 'Should export stopAutoMode');
    assert.ok(content.includes('export function toggleAutoMode'), 'Should export toggleAutoMode');
    assert.ok(content.includes('export function evaluateAutoMode'), 'Should export evaluateAutoMode');
  });

  test('pomodoroMode.js exports required functions', () => {
    const content = readFile('js/modes/pomodoroMode.js');
    assert.ok(content.includes('export async function activate') || content.includes('export function activate'), 'Should export activate');
    assert.ok(content.includes('export function deactivate'), 'Should export deactivate');
    assert.ok(content.includes('export function startTimer'), 'Should export startTimer');
    assert.ok(content.includes('export function stopTimer'), 'Should export stopTimer');
    assert.ok(content.includes('export function pauseTimer'), 'Should export pauseTimer');
    assert.ok(content.includes('export function resumeTimer'), 'Should export resumeTimer');
    assert.ok(content.includes('export function skipPhase'), 'Should export skipPhase');
    assert.ok(content.includes('export function resetPomodoro'), 'Should export resetPomodoro');
  });

  test('sleepMode.js exports required functions', () => {
    const content = readFile('js/modes/sleepMode.js');
    assert.ok(content.includes('export function activate'), 'Should export activate');
    assert.ok(content.includes('export function deactivate'), 'Should export deactivate');
    assert.ok(content.includes('export function cancelAlarm'), 'Should export cancelAlarm');
    assert.ok(content.includes('export function playAlarmSound'), 'Should export playAlarmSound');
    assert.ok(content.includes('export function setAlarmTime'), 'Should export setAlarmTime');
    assert.ok(content.includes('export function setWakeWindow'), 'Should export setWakeWindow');
    assert.ok(content.includes('export function setWakeWorld'), 'Should export setWakeWorld');
  });
});

describe('Audio Engine', () => {
  test('audio.js (orchestrator) exports orchestrator functions', () => {
    const content = readFile('js/audio.js');
    assert.ok(content.includes('export function setSourceMode'), 'Should export setSourceMode');
    assert.ok(content.includes('export function selectLevel'), 'Should export selectLevel');
    assert.ok(content.includes('export function toggleMasterPlay'), 'Should export toggleMasterPlay');
    assert.ok(content.includes('export function triggerKick'), 'Should export triggerKick');
    assert.ok(content.includes('export function restartWorldAudio'), 'Should export restartWorldAudio');
  });
  test('audio core module exports initAudio', () => {
    const content = readFile('js/audio/core.js');
    assert.ok(content.includes('export function initAudio'), 'Should export initAudio');
  });
  test('audio synth module exports synth functions', () => {
    const content = readFile('js/audio/synth.js');
    assert.ok(content.includes('export function selectSynthType'), 'Should export selectSynthType');
    assert.ok(content.includes('export function setSynthVolume'), 'Should export setSynthVolume');
    assert.ok(content.includes('export function startSynth'), 'Should export startSynth');
    assert.ok(content.includes('export function stopSynth'), 'Should export stopSynth');
  });
  test('audio mp3 module exports mp3 functions', () => {
    const content = readFile('js/audio/mp3.js');
    assert.ok(content.includes('export function computeAnchors'), 'Should export computeAnchors');
    assert.ok(content.includes('export async function loadWorldMp3') || content.includes('export function loadWorldMp3'), 'Should export loadWorldMp3');
  });
});

describe('Sensors', () => {
  test('sensors.js exports required functions', () => {
    const content = readFile('js/sensors.js');
    assert.ok(content.includes('export function toggleMic') || content.includes('export async function toggleMic'), 'Should export toggleMic');
    assert.ok(content.includes('export function toggleMotion') || content.includes('export async function toggleMotion'), 'Should export toggleMotion');
    assert.ok(content.includes('export function toggleGPS') || content.includes('export async function toggleGPS'), 'Should export toggleGPS');
    assert.ok(content.includes('export function applyMicPreset') || content.includes('export async function applyMicPreset'), 'Should export applyMicPreset');
    assert.ok(content.includes('export function setMicParam') || content.includes('export async function setMicParam'), 'Should export setMicParam');
  });

  test('sensors.js exports setSensorStatus', () => {
    const content = readFile('js/sensors.js');
    assert.ok(content.includes('export function setSensorStatus'), 'Should export setSensorStatus');
  });
});

describe('Mechanics', () => {
  test('mechanics.js exports required functions', () => {
    const content = readFile('js/mechanics.js');
    assert.ok(content.includes('export function toggleMemoryCatcher') || content.includes('export async function toggleMemoryCatcher'), 'Should export toggleMemoryCatcher');
    assert.ok(content.includes('export function toggleAutoKick') || content.includes('export async function toggleAutoKick'), 'Should export toggleAutoKick');
    assert.ok(content.includes('export function toggleSpatial3D') || content.includes('export async function toggleSpatial3D'), 'Should export toggleSpatial3D');
    assert.ok(content.includes('export function cycleLucidTimer') || content.includes('export async function cycleLucidTimer'), 'Should export cycleLucidTimer');
    assert.ok(content.includes('export function toggleDeprivationWatch') || content.includes('export async function toggleDeprivationWatch'), 'Should export toggleDeprivationWatch');
    assert.ok(content.includes('export function syncMechanicsUI') || content.includes('export async function syncMechanicsUI'), 'Should export syncMechanicsUI');
  });
});

describe('Seed', () => {
  test('seed.js exports required functions', () => {
    const content = readFile('js/seed.js');
    assert.ok(content.includes('export function encodeState'), 'Should export encodeState');
    assert.ok(content.includes('export function decodeState'), 'Should export decodeState');
    assert.ok(content.includes('export function generateFullSeed'), 'Should export generateFullSeed');
  });
});

describe('Generative Engine', () => {
  test('generativeEngine.js exports required functions', () => {
    const content = readFile('js/synth/generativeEngine.js');
    assert.ok(content.includes('export function getGenerativeEngine') || content.includes('export async function getGenerativeEngine'), 'Should export getGenerativeEngine');
    assert.ok(content.includes('export function generateSynthVariation') || content.includes('export async function generateSynthVariation'), 'Should export generateSynthVariation');
    assert.ok(content.includes('export function applyGenerativeVariation') || content.includes('export async function applyGenerativeVariation'), 'Should export applyGenerativeVariation');
  });
});

describe('CSS', () => {
  test('styles.css has accordion styles', () => {
    const content = readFile('css/styles.css');
    assert.ok(content.includes('.accordion-arrow'), 'Should have accordion-arrow style');
    assert.ok(content.includes('.accordion-panel'), 'Should have accordion-panel style');
    assert.ok(content.includes('.accordion-panel.open'), 'Should have open state style');
  });
});

describe('HTML Structure', () => {
  test('index.html has all required panels', () => {
    const html = readFile('index.html');
    const panels = ['worldsPanel', 'voicePanel', 'sourcePanel', 'triggerPanel', 'mechPanel', 'pomodoroPanel', 'sleepPanel'];
    panels.forEach(p => {
      assert.ok(html.includes(`id="${p}"`), `Should have ${p}`);
    });
  });

  test('index.html has mode selector with placeholder', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('Selecione o modo'), 'Should have placeholder option');
    assert.ok(html.includes('value="narrative"'), 'Should have narrative option');
    assert.ok(html.includes('value="pomodoro"'), 'Should have pomodoro option');
    assert.ok(html.includes('value="sleep"'), 'Should have sleep option');
    assert.ok(html.includes('value="free"'), 'Should have free option');
  });

  test('index.html has language selector', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="langSelector"'), 'Should have langSelector');
    assert.ok(html.includes('window.setLang(this.value)'), 'Should have setLang handler');
  });

  test('index.html has startModeBtn', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="startModeBtn"'), 'Should have startModeBtn');
    assert.ok(html.includes('window.startCurrentMode()'), 'Should have startCurrentMode handler');
  });

  test('index.html has kickBtn (hidden)', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="kickBtn"'), 'Should have kickBtn');
    assert.ok(html.includes('style="display:none;"'), 'Should be hidden initially');
  });

  test('index.html loads app.js as module', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('type="module"'), 'Should load as module');
    assert.ok(html.includes('src="./js/app.js'), 'Should load app.js');
  });
});

describe('Service Worker', () => {
  test('sw.js exists and has cache version', () => {
    const content = readFile('sw.js');
    assert.ok(content.includes("const CACHE = 'pasiv-v"), 'Should have cache version');
    assert.ok(content.includes('self.addEventListener'), 'Should have event listeners');
  });
});

console.log('\n✅ All comprehensive tests defined!');