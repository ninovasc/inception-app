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

const fileExports = {};
const fileImports = {};

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
    
    const exportBraceRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportBraceRegex.exec(content)) !== null) {
      match[1].split(',').forEach(e => exports.push(e.trim()));
    }
    
    fileExports[f] = [...new Set(exports)];
    fileImports[f] = imports;
  } catch(e) {
    console.log(`${f}: ${e.message}`);
  }
});

// Resolve imports
function resolveImport(file, imp) {
  const from = imp.from;
  if (from.startsWith('./')) {
    return path.join(path.dirname(file), from + '.js');
  }
  if (from.startsWith('../')) {
    return path.join(path.dirname(file), from + '.js');
  }
  return null;
}

// Check for missing exports
console.log("=== MISSING EXPORTS (imported but not exported) ===");
let hasIssues = false;
Object.entries(fileImports).forEach(([file, imports]) => {
  imports.forEach(imp => {
    const resolved = resolveImport(file, imp);
    if (resolved && fs.existsSync(path.join(root, resolved))) {
      const depExports = fileExports[resolved] || [];
      imp.named.forEach(named => {
        if (!depExports.includes(named)) {
          console.log(`MISSING: ${file} imports "${named}" from ${resolved} but it's not exported`);
          hasIssues = true;
        }
      });
    }
  });
});

if (!hasIssues) {
  console.log("No missing exports found!");
}

// Check for unused exports
console.log("\n=== POTENTIALLY UNUSED EXPORTS ===");
const allImported = new Set();
Object.values(fileImports).forEach(imports => {
  imports.forEach(imp => imp.named.forEach(n => allImported.add(n)));
});

Object.entries(fileExports).forEach(([file, exports]) => {
  exports.forEach(exp => {
    if (!allImported.has(exp) && !['state', 'SCREENSAVER_SVG', 'modeModules'].includes(exp)) {
      console.log(`UNUSED?: ${file} exports "${exp}" - not imported anywhere`);
    }
  });
});

// Circular dependency check
console.log("\n=== CIRCULAR DEPENDENCY CHECK ===");
function findCycles(graph, start, current, visited, path) {
  if (visited.has(current)) {
    if (path.includes(current)) {
      const cycleStart = path.indexOf(current);
      return path.slice(cycleStart).join(' -> ');
    }
    return null;
  }
  visited.add(current);
  path.push(current);
  
  const neighbors = graph[current] || [];
  for (const neighbor of neighbors) {
    const cycle = findCycles(graph, start, neighbor, visited, [...path]);
    if (cycle) return cycle;
  }
  return null;
}

const graph = {};
Object.entries(fileImports).forEach(([file, imports]) => {
  graph[file] = imports.map(i => resolveImport(file, i)).filter(Boolean);
});

Object.keys(graph).forEach(node => {
  const cycle = findCycles(graph, node, node, new Set(), []);
  if (cycle) console.log(`CYCLE: ${cycle}`);
});

console.log("Done");