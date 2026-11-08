const fs = require('fs');
const path = require('path');
const root = 'C:\\Users\\ninov\\AppData\\Local\\Temp\\opencode\\repos\\inception-app';
const files = [
  'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js', 'js/sensors.js',
  'js/synth/generativeEngine.js', 'js/ui/commonUI.js', 'js/ui/freeUI.js',
  'js/ui/generativeUI.js', 'js/ui/modeSelector.js', 'js/ui/narrativeUI.js',
  'js/ui/pomodoroUI.js', 'js/ui/sleepUI.js',
  'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
  'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
];

files.forEach(f => {
  const fullPath = path.join(root, f);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  // Remove console.log and console.warn (but keep console.error for actual errors)
  content = content.replace(/console\.(log|warn)\([^;]+\);?\s*/g, '');
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('Updated:', f);
  }
});
console.log('Done');