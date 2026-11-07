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

// Build comprehensive map
const analysis = {
  files: {},
  dependencyGraph: {},
  windowExports: new Set(),
  inconsistencies: [],
  deprecated: [],
  recommendations: []
};

// First, parse window exports from app.js
const appContent = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const windowExportMatches = appContent.match(/window\.(\w+)\s*=/g) || [];
windowExportMatches.forEach(m => {
  const name = m.match(/window\.(\w+)/)[1];
  analysis.windowExports.add(name);
});

console.log("=== WINDOW EXPORTS FROM app.js ===");
console.log([...analysis.windowExports].sort().join(', '));

// Analyze each file in detail
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
    
    // Function declarations
    const functions = [];
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    const arrowRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Window exports
    const windowExports = [];
    const winExportRegex = /window\.(\w+)\s*=/g;
    while ((match = winExportRegex.exec(content)) !== null) {
      windowExports.push(match[1]);
    }
    
    analysis.files[f] = {
      lines: lines.length,
      imports: imports.map(i => i.from),
      exports: [...new Set(exports)],
      functions: [...new Set(functions)],
      windowExports: [...new Set(windowExports)]
    };
  } catch(e) {
    analysis.files[f] = { error: e.message };
  }
});

// Build dependency graph
const graph = {};
files.forEach(f => {
  const info = analysis.files[f];
  if (info.imports) {
    graph[f] = info.imports.map(i => {
      if (i.startsWith('./')) return path.join(path.dirname(f), i + '.js');
      if (i.startsWith('../')) return path.join(path.dirname(f), i + '.js');
      return null;
    }).filter(Boolean);
  }
});

// Find cycles
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

console.log("=== DEPENDENCY GRAPH ===");
Object.entries(graph).forEach(([file, deps]) => {
  if (deps.length > 0) {
    console.log(`${file} -> ${deps.join(', ')}`);
  }
});

console.log("\n=== CIRCULAR DEPENDENCIES ===");
Object.keys(graph).forEach(node => {
  const cycle = findCycles(graph, node, node, new Set(), []);
  if (cycle) console.log(`CYCLE: ${cycle}`);
});

console.log("\n=== FILE SIZE SUMMARY ===");
Object.entries(analysis.files).forEach(([f, info]) => {
  if (!info.error) {
    console.log(`${f}: ${info.lines} lines, ${info.exports.length} exports, ${info.functions.length} functions, ${info.imports.length} imports`);
  }
});

console.log("\n=== WINDOW EXPORTS (from app.js) ===");
console.log([...analysis.windowExports].sort().join(', '));

console.log("\n=== WINDOW EXPORTS BY FILE ===");
Object.entries(analysis.files).forEach(([f, info]) => {
  if (info.windowExports && info.windowExports.length > 0) {
    console.log(`${f}: ${info.windowExports.join(', ')}`);
  }
});

// Find files that import but don't export (leaf nodes)
console.log("\n=== LEAF NODES (only import, no exports) ===");
Object.entries(analysis.files).forEach(([f, info]) => {
  if (!info.error && info.exports.length === 0 && info.imports.length > 0) {
    console.log(f);
  }
});

// Find files that export but nothing imports them (potential dead code)
console.log("\n=== ROOT NODES (exports but no one imports) ===");
const allImports = new Set();
Object.values(analysis.files).forEach(info => {
  if (info.imports) info.imports.forEach(i => i);
});
// Better: collect all imported module names
const importedModules = new Set();
Object.values(analysis.files).forEach(info => {
  if (info.imports) info.imports.forEach(i => importedModules.add(i));
});

Object.entries(analysis.files).forEach(([f, info]) => {
  if (!info.error && info.exports.length > 0) {
    const isImported = importedModules.has(f);
    if (!isImported && !['js/app.js'].includes(f)) {
      console.log(`${f} - exports but not imported by anyone`);
    }
  }
});

// Check for duplicate function names across files
console.log("\n=== DUPLICATE FUNCTION NAMES ACROSS FILES ===");
const funcToFiles = {};
Object.entries(analysis.files).forEach(([f, info]) => {
  if (!info.error && info.functions) {
    info.functions.forEach(fn => {
      if (!funcToFiles[fn]) funcToFiles[fn] = [];
      funcToFiles[fn].push(f);
    });
  }
});

Object.entries(funcToFiles).forEach(([fn, files]) => {
  if (files.length > 1) {
    console.log(`${fn}: ${files.join(', ')}`);
  }
});

// Check for deprecated patterns
console.log("\n=== DEPRECATED/OUTDATED PATTERNS ===");
files.forEach(f => {
  try {
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    
    // Check for var usage
    if (/\bvar\s+\w+/.test(content)) {
      console.log(`${f}: uses 'var' (should use const/let)`);
    }
    
    // Check for callback-style instead of async/await
    if (/\.then\(/.test(content) && !/async\s+function/.test(content)) {
      console.log(`${f}: uses .then() without async/await`);
    }
    
    // Check for window. global pollution
    const winAssigns = content.match(/window\.\w+\s*=/g) || [];
    if (winAssigns.length > 5) {
      console.log(`${f}: ${winAssigns.length} window.* assignments (global pollution)`);
    }
    
    // Check for hardcoded strings that should be i18n
    const hardcodedText = content.match(/["'][A-Z][a-z]+ [A-Z][a-z]+["']/g) || [];
    if (hardcodedText.length > 3) {
      console.log(`${f}: ${hardcodedText.length} potential hardcoded UI strings`);
    }
    
    // Check for console.log (should be removed in production)
    const consoleLogs = (content.match(/console\.(log|warn|error)/g) || []).length;
    if (consoleLogs > 5) {
      console.log(`${f}: ${consoleLogs} console.log/warn/error statements`);
    }
  } catch(e) {}
});

console.log("\nDone");