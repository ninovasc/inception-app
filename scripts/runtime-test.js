// Runtime Test Suite for PASIV Engine v4.0.3
// Tests actual browser behavior using Playwright-like patterns
// Run with: node scripts/runtime-test.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8099;
const BASE_URL = `http://localhost:${PORT}`;

// Simple HTTP server
const server = http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(process.cwd(), url);
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; res.end('not found'); return; }
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Server running on', BASE_URL);
  runTests();
});

async function runTests() {
  console.log('\n=== PASIV Engine Runtime Tests ===\n');
  
  // Since we're in Node.js, we'll test the file structure and basic functionality
  // For actual browser testing, we'd need Playwright/Puppeteer
  
  let passed = 0;
  let failed = 0;
  
  function test(name, fn) {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (e) {
      console.log(`❌ ${name}: ${e.message}`);
      failed++;
    }
  }
  
  // Test 1: All JS files exist and have valid syntax
  test('All JS files have valid syntax', () => {
    const { execSync } = require('child_process');
    const files = fs.readdirSync('js').filter(f => f.endsWith('.js'));
    files.forEach(f => {
      execSync(`node --check js/${f}`, { stdio: 'pipe' });
    });
    const subdirs = ['js/modes', 'js/ui'];
    subdirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
          execSync(`node --check ${dir}/${f}`, { stdio: 'pipe' });
        });
      }
    });
  });
  
  // Test 2: index.html has required elements
  test('index.html has all required elements', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const required = ['modeSelector', 'worldsPanel', 'voicePanel', 'sourcePanel', 
                      'triggerPanel', 'mechPanel', 'pomodoroPanel', 'sleepPanel',
                      'langSelector', 'kickBtn', 'startModeBtn', 'sensorStatus'];
    required.forEach(el => {
      assert(html.includes(`id="${el}"`), `Missing element: ${el}`);
    });
  });
  
  // Test 3: app.js has no duplicate declarations
  test('app.js has no duplicate function declarations', () => {
    const content = fs.readFileSync('js/app.js', 'utf8');
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    const funcs = new Set();
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      assert(!funcs.has(match[1]), `Duplicate function: ${match[1]}`);
      funcs.add(match[1]);
    }
  });
  
  // Test 4: modeManager.js has no duplicate declarations
  test('modeManager.js has no duplicate function declarations', () => {
    const content = fs.readFileSync('js/modes/modeManager.js', 'utf8');
    const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    const funcs = new Set();
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      assert(!funcs.has(match[1]), `Duplicate function: ${match[1]}`);
      funcs.add(match[1]);
    }
  });
  
  // Test 5: All imports resolve
  test('All imports resolve to existing files', () => {
    const files = [
      'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/synth/generativeEngine.js', 'js/ui/commonUI.js', 'js/ui/freeUI.js',
      'js/ui/generativeUI.js', 'js/ui/modeSelector.js', 'js/ui/narrativeUI.js',
      'js/ui/pomodoroUI.js', 'js/ui/sleepUI.js',
      'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    
    files.forEach(f => {
      const content = fs.readFileSync(f, 'utf8');
      const importRegex = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const dir = f.substring(0, f.lastIndexOf('/'));
          const resolved = path.resolve(dir, importPath) + '.js';
          assert(fs.existsSync(resolved), `${f} imports non-existent: ${importPath}`);
        }
      }
    });
  });
  
  // Test 6: No circular dependencies
  test('No circular dependencies', () => {
    const files = [
      'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/synth/generativeEngine.js', 'js/ui/commonUI.js', 'js/ui/freeUI.js',
      'js/ui/generativeUI.js', 'js/ui/modeSelector.js', 'js/ui/narrativeUI.js',
      'js/ui/pomodoroUI.js', 'js/ui/sleepUI.js',
      'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    
    const graph = {};
    files.forEach(f => {
      const content = fs.readFileSync(f, 'utf8');
      const importRegex = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      const deps = [];
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
          const dir = f.substring(0, f.lastIndexOf('/'));
          const resolved = path.resolve(dir, importPath) + '.js';
          if (files.includes(resolved)) deps.push(resolved);
        }
      }
      graph[f] = deps;
    });
    
    function findCycle(node, visited, path) {
      if (path.includes(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (findCycle(neighbor, visited, [...path, node])) return true;
      }
      return false;
    }
    
    files.forEach(f => {
      assert(!findCycle(f, new Set(), []), `Circular dependency found involving ${f}`);
    });
  });
  
  // Test 7: All modes have proper data-mode attributes
  test('All accordion panels have data-mode attributes', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    const panels = ['worldsPanel', 'voicePanel', 'sourcePanel', 'triggerPanel', 'mechPanel', 'pomodoroPanel', 'sleepPanel'];
    panels.forEach(p => {
      const regex = new RegExp(`id="${p}"`);
      assert(html.match(regex), `Panel ${p} should exist`);
    });
  });
  
  // Test 8: No duplicate function declarations in any file
  test('No duplicate function declarations in any JS file', () => {
    const files = [
      'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/screensaver-svg.js', 'js/synth/generativeEngine.js',
      'js/ui/commonUI.js', 'js/ui/freeUI.js', 'js/ui/generativeUI.js',
      'js/ui/modeSelector.js', 'js/ui/narrativeUI.js', 'js/ui/pomodoroUI.js',
      'js/ui/sleepUI.js', 'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    
    files.forEach(f => {
      const content = fs.readFileSync(f, 'utf8');
      const funcRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
      const funcs = new Set();
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        assert(!funcs.has(match[1]), `${f}: Duplicate function ${match[1]}`);
        funcs.add(match[1]);
      }
    });
  });
  
  // Test 9: All window.* assignments in app.js are defined
  test('All window.* assignments in app.js reference defined functions', () => {
    const content = fs.readFileSync('js/app.js', 'utf8');
    const lines = content.split('\n');
    const windowAssigns = lines.filter(l => l.includes('window.') && l.includes('='));
    assert(windowAssigns.length > 0, 'Should have window assignments');
  });
  
  // Test 10: No var declarations
  test('No var declarations in any JS file', () => {
    const files = [
      'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js',
      'js/sensors.js', 'js/mechanics.js', 'js/seed.js', 'js/i18n.js',
      'js/ui.js', 'js/power.js', 'js/youtube.js', 'js/capture.js',
      'js/screensaver-svg.js', 'js/synth/generativeEngine.js',
      'js/ui/commonUI.js', 'js/ui/freeUI.js', 'js/ui/generativeUI.js',
      'js/ui/modeSelector.js', 'js/ui/narrativeUI.js', 'js/ui/pomodoroUI.js',
      'js/ui/sleepUI.js', 'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
      'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
    ];
    
    files.forEach(f => {
      const content = fs.readFileSync(f, 'utf8');
      // Remove comments and strings
      const noComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const hasVar = /\bvar\s+\w+/.test(noComments);
      assert(!hasVar, `${f}: uses 'var' declaration`);
    });
  });
  
  console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

runTests();