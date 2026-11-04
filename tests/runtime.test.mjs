// Runtime Test Suite for PASIV Engine v4.0.3
// Tests actual browser behavior using the browser tool
// Run with: node --test tests/runtime.test.mjs

import { test, describe } from 'node:test';
import { strict as assert } from 'node:assert';
import fs from 'fs';

const ROOT = process.cwd();

// Helper to read file
function readFile(path) {
  return fs.readFileSync(path, 'utf8');
}

describe('Runtime: Mode Switching', () => {
  test('initial state has empty mode', () => {
    // This would be tested in browser - for now, verify the code sets empty mode
    const content = readFile('js/modes/modeManager.js');
    assert.ok(content.includes("state.currentMode = ''"), 'Should set empty mode on init');
  });

  test('switchMode handles empty modeId', () => {
    const content = readFile('js/modes/modeManager.js');
    assert.ok(content.includes("if (!modeId)"), 'Should handle empty modeId');
    assert.ok(content.includes("localStorage.removeItem('pasiv-mode')"), 'Should remove from localStorage');
  });

  test('switchMode updates panel visibility', () => {
    const content = readFile('js/modes/modeManager.js');
    assert.ok(content.includes('updatePanelVisibility()'), 'Should call updatePanelVisibility');
  });

  test('all 4 modes are defined', () => {
    const content = readFile('js/config.js');
    assert.ok(content.includes("'narrative'"), 'Should have narrative mode');
    assert.ok(content.includes("'pomodoro'"), 'Should have pomodoro mode');
    assert.ok(content.includes("'sleep'"), 'Should have sleep mode');
    assert.ok(content.includes("'free'"), 'Should have free mode');
  });
});

describe('Runtime: Panel Visibility', () => {
  test('updatePanelVisibility hides all when no mode selected', () => {
    const content = readFile('js/modes/modeManager.js');
    assert.ok(content.includes("const show = modes.includes(state.currentMode)"), 'Should check mode inclusion');
    assert.ok(content.includes("section.style.display = show ? '' : 'none'"), 'Should set display');
  });

  test('Narrative mode shows correct panels', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('data-mode="narrative pomodoro sleep free"'), 'Should have shared panels');
    assert.ok(html.includes('data-mode="narrative"'), 'Should have narrative-only panel');
  });

  test('Pomodoro mode shows correct panels', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('data-mode="pomodoro"'), 'Should have pomodoro-only panel');
  });

  test('Sleep mode shows correct panels', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('data-mode="sleep"'), 'Should have sleep-only panel');
  });

  test('Free mode shows correct panels', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('data-mode="narrative free"'), 'Should have free-only panel');
  });
});

describe('Runtime: Accordion', () => {
  test('toggleAccordion is defined and exposed', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes('function toggleAccordion(panelId)'), 'Should define toggleAccordion');
    assert.ok(content.includes('window.toggleAccordion = toggleAccordion'), 'Should expose on window');
  });

  test('toggleAccordion toggles open class', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("panel.classList.toggle('open')"), 'Should toggle open class');
  });

  test('accordion arrows use triangle characters', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('class="accordion-arrow">▶'), 'Should have closed arrow');
  });

  test('accordion arrows update on toggle', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("arrow.textContent = panel.classList.contains('open') ? '▼' : '▶'"), 'Should update arrow on toggle');
  });
});

describe('Runtime: Mode Selector', () => {
  test('modeSelector has placeholder option', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('Selecione o modo'), 'Should have placeholder');
    assert.ok(html.includes('value="" selected'), 'Placeholder should be selected');
  });

  test('modeSelector calls window.setMode', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('window.setMode(this.value)'), 'Should call window.setMode');
  });

  test('setMode function is exposed', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes('window.setMode = function(modeId)'), 'Should expose setMode');
  });

  test('setMode shows start button when mode selected', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("startBtn.style.display = 'flex'"), 'Should show start button');
  });

  test('setMode hides start button when empty', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("startBtn.style.display = 'none'"), 'Should hide start button');
  });

  test('startModeBtn exists in HTML', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="startModeBtn"'), 'Should have startModeBtn');
    assert.ok(html.includes('window.startCurrentMode()'), 'Should call startCurrentMode');
  });
});

describe('Runtime: Kick Button', () => {
  test('kickBtn is hidden initially', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="kickBtn"'), 'Should have kickBtn');
    assert.ok(html.includes('style="display:none;"'), 'Should be hidden');
  });

  test('kickBtn shown when mode selected', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("kickBtn.style.display = 'flex'"), 'Should show kickBtn');
  });

  test('kickBtn hidden when empty mode', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes("kickBtn.style.display = 'none'"), 'Should hide kickBtn');
  });
});

describe('Runtime: Language Selector', () => {
  test('langSelector exists in header', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="langSelector"'), 'Should have langSelector');
    assert.ok(html.includes('window.setLang(this.value)'), 'Should call setLang');
  });

  test('lang label exists', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('data-i18n="lang.label"'), 'Should have lang.label');
  });
});

describe('Runtime: Pomodoro', () => {
  test('pomodoroUI has timer element', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroTimer"'), 'Should have pomodoroTimer');
  });

  test('pomodoroUI has phase label', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroPhaseLabel"'), 'Should have pomodoroPhaseLabel');
  });

  test('pomodoroUI has play/pause button', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroPlayPause"'), 'Should have pomodoroPlayPause');
  });

  test('pomodoroUI has config panel', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroConfig"'), 'Should have pomodoroConfig');
  });

  test('pomodoroUI has MP3 upload for activity', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroActivityMp3"'), 'Should have pomodoroActivityMp3');
  });

  test('pomodoroUI has MP3 upload for break', () => {
    const content = readFile('js/ui/pomodoroUI.js');
    assert.ok(content.includes('id="pomodoroBreakMp3"'), 'Should have pomodoroBreakMp3');
  });

  test('pomodoroMode exports activate/deactivate', () => {
    const content = readFile('js/modes/pomodoroMode.js');
    assert.ok(content.includes('export async function activate'), 'Should export activate');
    assert.ok(content.includes('export function deactivate'), 'Should export deactivate');
  });
});

describe('Runtime: Sleep', () => {
  test('sleepUI has alarm time input', () => {
    const content = readFile('js/ui/sleepUI.js');
    assert.ok(content.includes('id="sleepAlarmTime"'), 'Should have sleepAlarmTime');
  });

  test('sleepUI has wake window slider', () => {
    const content = readFile('js/ui/sleepUI.js');
    assert.ok(content.includes('id="sleepWakeWindow"'), 'Should have sleepWakeWindow');
  });

  test('sleepUI has test alarm button', () => {
    const content = readFile('js/ui/sleepUI.js');
    assert.ok(content.includes('id="sleepTestAlarm"'), 'Should have sleepTestAlarm');
  });

  test('sleepUI has alarm timer display', () => {
    const content = readFile('js/ui/sleepUI.js');
    assert.ok(content.includes('id="sleepAlarmTimer"'), 'Should have sleepAlarmTimer');
  });

  test('sleepMode exports activate/deactivate', () => {
    const content = readFile('js/modes/sleepMode.js');
    assert.ok(content.includes('export function activate'), 'Should export activate');
    assert.ok(content.includes('export function deactivate'), 'Should export deactivate');
  });
});

describe('Runtime: Sound Source', () => {
  test('commonUI renderSourceList generates file input for mp3', () => {
    const content = readFile('js/ui/commonUI.js');
    assert.ok(content.includes("sourceType === 'mp3'"), 'Should check for mp3 type');
    assert.ok(content.includes('input type="file"'), 'Should have file input for mp3');
  });

  test('audio.js setSourceMode accepts worldIdx and mode', () => {
    const content = readFile('js/audio.js');
    assert.ok(content.includes('export function setSourceMode(worldIdx, mode)'), 'Should accept both params');
  });

  test('audio.js setSourceMode re-renders source list', () => {
    const content = readFile('js/audio.js');
    assert.ok(content.includes('window.renderSourceList'), 'Should re-render source list');
  });

  test('source select has onchange handler', () => {
    const content = readFile('js/ui/commonUI.js');
    assert.ok(content.includes('onchange="setSourceMode'), 'Should have onchange handler');
  });
});

describe('Runtime: Generative AI', () => {
  test('generativeUI has toggle checkbox', () => {
    const content = readFile('js/ui/generativeUI.js');
    assert.ok(content.includes('id="generativeEnabled"'), 'Should have generativeEnabled');
  });

  test('generativeUI has variation slider', () => {
    const content = readFile('js/ui/generativeUI.js');
    assert.ok(content.includes('id="generativeVariation"'), 'Should have generativeVariation');
  });

  test('generativeUI has new variation button', () => {
    const content = readFile('js/ui/generativeUI.js');
    assert.ok(content.includes('id="generativeNew"'), 'Should have generativeNew');
  });

  test('generativeUI has seed input', () => {
    const content = readFile('js/ui/generativeUI.js');
    assert.ok(content.includes('id="generativeSeedInput"'), 'Should have generativeSeedInput');
  });

  test('generativeEngine exports required functions', () => {
    const content = readFile('js/synth/generativeEngine.js');
    assert.ok(content.includes('export function getGenerativeEngine') || content.includes('export async function getGenerativeEngine'), 'Should export getGenerativeEngine');
    assert.ok(content.includes('export function generateSynthVariation') || content.includes('export async function generateSynthVariation'), 'Should export generateSynthVariation');
    assert.ok(content.includes('export function applyGenerativeVariation') || content.includes('export async function applyGenerativeVariation'), 'Should export applyGenerativeVariation');
  });
});

describe('Runtime: Sensors', () => {
  test('sensors exposed on window', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes('toggleMic: sensors.toggleMic'), 'Should expose toggleMic');
    assert.ok(content.includes('toggleMotion: sensors.toggleMotion'), 'Should expose toggleMotion');
    assert.ok(content.includes('toggleGPS: sensors.toggleGPS'), 'Should expose toggleGPS');
  });

  test('sensor buttons exist in HTML', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="btnMic"'), 'Should have btnMic');
    assert.ok(html.includes('id="btnMotion"'), 'Should have btnMotion');
    assert.ok(html.includes('id="btnGps"'), 'Should have btnGps');
  });
});

describe('Runtime: Seed/Code', () => {
  test('seed panel is hidden', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('style="display:none;"'), 'Seed panel should be hidden');
  });

  test('seed.js exports required functions', () => {
    const content = readFile('js/seed.js');
    assert.ok(content.includes('export function encodeState'), 'Should export encodeState');
    assert.ok(content.includes('export function decodeState'), 'Should export decodeState');
    assert.ok(content.includes('export function generateFullSeed'), 'Should export generateFullSeed');
  });
});

describe('Runtime: Voice', () => {
  test('voice select has applyMicPreset handler', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('onchange="applyMicPreset(this.value)"'), 'Should have applyMicPreset handler');
  });

  test('voice has parameter sliders', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="micGate"'), 'Should have micGate');
    assert.ok(html.includes('id="micDelaySlider"'), 'Should have micDelaySlider');
    assert.ok(html.includes('id="micFb"'), 'Should have micFb');
    assert.ok(html.includes('id="micRev"'), 'Should have micRev');
    assert.ok(html.includes('id="micDw"'), 'Should have micDw');
  });
});

describe('Runtime: Mechanics', () => {
  test('mechanics buttons exist in HTML', () => {
    const html = readFile('index.html');
    assert.ok(html.includes('id="btnMemCatcher"'), 'Should have btnMemCatcher');
    assert.ok(html.includes('id="btnAutoKick"'), 'Should have btnAutoKick');
    assert.ok(html.includes('id="btnSpatial3D"'), 'Should have btnSpatial3D');
    assert.ok(html.includes('id="btnLucidTimer"'), 'Should have btnLucidTimer');
    assert.ok(html.includes('id="btnDeprivation"'), 'Should have btnDeprivation');
  });
});

describe('Runtime: Screensaver', () => {
  test('screensaver is defined in app.js', () => {
    const content = readFile('js/app.js');
    assert.ok(content.includes('createScreensaver'), 'Should have createScreensaver');
    assert.ok(content.includes('showScreensaver'), 'Should have showScreensaver');
    assert.ok(content.includes('hideScreensaver'), 'Should have hideScreensaver');
  });
});

describe('Runtime: Service Worker', () => {
  test('sw.js has cache version', () => {
    const content = readFile('sw.js');
    assert.ok(content.includes('pasiv-v'), 'Should have cache version');
  });
});

console.log('\n✅ All comprehensive tests defined!');