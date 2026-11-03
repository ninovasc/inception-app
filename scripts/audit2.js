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

// Extract all imports and exports with details
const results = [];

files.forEach(f => {
  try {
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    const lines = content.split('\n');
    
    // Extract imports
    const imports = [];
    const importRegex = /import\s+(?:(?:\{([^}]+)\}|(\w+))\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        from: match[3],
        named: match[1] ? match[1].split(',').map(s => s.trim()).filter(Boolean) : [],
        default: match[2] || null
      });
    }
    
    // Also catch side-effect imports
    const sideEffectImports = content.match(/import\s+['"]([^'"]+)['"]/g) || [];
    sideEffectImports.forEach(m => {
      const from = m.match(/['"]([^'"]+)['"]/)[1];
      if (!imports.some(i => i.from === from)) {
        imports.push({ from, named: [], default: null, sideEffect: true });
      }
    });
    
    // Extract exports
    const exports = [];
    const exportRegex = /export\s+(?:function|const|let|var|class|default)?\s*(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Also catch "export { ... }"
    const exportBraceRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportBraceRegex.exec(content)) !== null) {
      match[1].split(',').forEach(e => exports.push(e.trim()));
    }
    
    // Function declarations
    const functions = [];
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Arrow functions assigned to const/let/var
    const arrowFuncs = [];
    const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      arrowFuncs.push(match[1]);
    }
    
    results.push({
      file: f,
      lines: lines.length,
      imports,
      exports: [...new Set(exports)],
      functions: [...new Set([...functions, ...arrowFuncs])]
    });
  } catch(e) {
    results.push({ file: f, error: e.message });
  }
});

console.log(JSON.stringify(results, null, 2));