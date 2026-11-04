const fs = require('fs');
const path = require('path');

const root = 'C:\\Users\\ninov\\AppData\\Local\\Temp\\opencode\\repos\\inception-app';

const files = [
  'js/app.js', 'js/state.js', 'js/config.js', 'js/audio.js', 'js/sensors.js',
  'js/mechanics.js', 'js/seed.js', 'js/i18n.js', 'js/ui.js', 'js/power.js',
  'js/youtube.js', 'js/capture.js', 'js/screensaver-svg.js',
  'js/synth/generativeEngine.js', 'js/ui/commonUI.js', 'js/ui/freeUI.js',
  'js/ui/generativeUI.js', 'js/ui/modeSelector.js', 'js/ui/narrativeUI.js',
  'js/ui/pomodoroUI.js', 'js/ui/sleepUI.js',
  'js/modes/modeManager.js', 'js/modes/narrativeMode.js',
  'js/modes/pomodoroMode.js', 'js/modes/sleepMode.js'
];

function checkBrackets(content, filename) {
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;
  let inLineComment = false;
  
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const prev = content[i-1];
    const next = content[i+1];
    
    if (!inString && !inTemplate && !inComment && !inLineComment) {
      if (ch === '/' && next === '/') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && next === '*') {
        inComment = true;
        i++;
        continue;
      }
    }
    
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    
    if (inComment) {
      if (ch === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    
    if (!inString && !inTemplate && !inComment && !inLineComment) {
      if (ch === '`') {
        inTemplate = true;
      } else if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
      } else if (ch === '{') braceCount++;
      else if (ch === '}') braceCount--;
      else if (ch === '(') parenCount++;
      else if (ch === ')') parenCount--;
      else if (ch === '[') bracketCount++;
      else if (ch === ']') bracketCount--;
    } else if (inString) {
      if (ch === stringChar && prev !== '\\') {
        inString = false;
      }
    } else if (inTemplate) {
      if (ch === '`') {
        inTemplate = false;
      }
    }
  }
  
  return { braceCount, parenCount, bracketCount };
}

let hasErrors = false;
files.forEach(f => {
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  const result = checkBrackets(content, f);
  if (result.braceCount !== 0 || result.parenCount !== 0 || result.bracketCount !== 0) {
    console.log(`ERROR: ${f} - braces=${result.braceCount}, parens=${result.parenCount}, brackets=${result.bracketCount}`);
    hasErrors = true;
  }
});

if (!hasErrors) {
  console.log('All files have balanced braces, parentheses, and brackets!');
} else {
  console.log('\nSome files have unbalanced brackets!');
}