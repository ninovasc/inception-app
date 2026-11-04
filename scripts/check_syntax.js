const fs = require('fs');

function checkSyntax(content, filename) {
  const lines = content.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let j = 0;
    while (j < line.length) {
      const ch = line[j];
      const next = line[j+1];
      
      if (!inString && !inTemplate && ch === '/' && line[j+1] === '/') {
        break; // comment
      }
      if (!inString && !inTemplate && ch === '/' && line[j+1] === '*') {
        inComment = true;
        j += 2;
        continue;
      }
      if (inComment && ch === '*' && line[j+1] === '/') {
        inComment = false;
        j += 2;
        continue;
      }
      if (inComment) {
        j++;
        continue;
      }
      
      if (!inString && !inTemplate && ch === '`') {
        inTemplate = true;
      } else if (inTemplate && ch === '`') {
        inTemplate = false;
      } else if (!inTemplate && !inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
      } else if (inString && ch === stringChar && line[j-1] !== '\\') {
        inString = false;
      }
      
      if (!inString && !inTemplate && !inComment) {
        if (ch === '{') braceCount++;
        if (ch === '}') braceCount--;
        if (ch === '(') parenCount++;
        if (ch === ')') parenCount--;
        if (ch === '[') bracketCount++;
        if (ch === ']') bracketCount--;
      }
      j++;
    }
  }
  
  return {
    braceCount,
    parenCount,
    bracketCount
  };
}

const files = [
  'js/ui/commonUI.js',
  'js/app.js',
  'js/ui/freeUI.js',
  'js/ui/narrativeUI.js'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const result = checkSyntax(content, f);
  console.log(`${f}: braces=${result.braceCount}, parens=${result.parenCount}, brackets=${result.bracketCount}`);
});