const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\ninov\\AppData\\Local\\Temp\\opencode\\repos\\inception-app';

const files = [
  'js/app.js',
  'js/state.js',
  'js/config.js',
  'js/audio.js',
  'js/sensors.js',
  'js/mechanics.js',
  'js/seed.js',
  'js/i18n.js',
  'js/ui.js',
  'js/power.js',
  'js/youtube.js',
  'js/capture.js',
  'js/screensaver-svg.js',
  'js/sensors.js',
  'js/mechanics.js',
  'js/seed.js',
  'js/state.js',
  'js/config.js',
  'js/synth/generativeEngine.js',
  'js/ui/commonUI.js',
  'js/ui/freeUI.js',
  'js/ui/generativeUI.js',
  'js/ui/modeSelector.js',
  'js/ui/narrativeUI.js',
  'js/ui/pomodoroUI.js',
  'js/ui/sleepUI.js',
  'js/modes/modeManager.js',
  'js/modes/narrativeMode.js',
  'js/modes/pomodoroMode.js',
  'js/modes/sleepMode.js',
];

console.log('FILE,LINE_COUNT,EXPORTS,IMPORTS');
files.forEach(f => {
  try {
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    const lines = content.split('\n').length;
    const exports = (content.match(/export /g) || []).length;
    const imports = (content.match(/import /g) || []).length;
    console.log(`${f},${lines},${exports},${imports}`);
  } catch(e) {
    console.log(`${f},ERROR,${e.message}`);
  }
});