const fs = require('fs');

function checkBrackets(content, filename) {
  const lines = content.split('\n');
  let braceCount = 0;
  let parenCount = 0;
  let bracketCount = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inComment = false;
  let inLineComment = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let j = 0;
    while (j < line.length) {
      const ch = line[j];
      const next = line[j+1];
      const prev = line[j-1];
      
      if (!inString && !inTemplate && !inComment && !inLineComment) {
        if (ch === '/' && next === '/') break;
        if (ch === '/' && next === '*') { inComment = true; j += 2; continue; }
      }
      if (inLineComment) { if (ch === '\n') inLineComment = false; j++; continue; }
      if (inComment) { if (ch === '*' && next === '/') { inComment = false; j += 2; } else j++; continue; }
      
      if (!inString && !inTemplate && !inComment && !inLineComment) {
        if (ch === '`') { inTemplate = true; }
        else if (ch === '"' || ch === "'") { inString = true; stringChar = ch; }
        else if (ch === '{') braceCount++;
        else if (ch === '}') braceCount--;
        else if (ch === '(') parenCount++;
        else if (ch === ')') parenCount--;
        else if (ch === '[') bracketCount++;
        else if (ch === ']') bracketCount--;
      } else if (inString) {
        if (ch === stringChar && prev !== '\\') { inString = false; }
      } else if (inTemplate) {
        if (ch === '`') { inTemplate = false; }
      }
      j++;
    }
    
    if (braceCount !== 0 || parenCount !== 0 || bracketCount !== 0) {
      console.log('Line', i+1, 'brace=' + braceCount, 'paren=' + parenCount, 'bracket=' + bracketCount, ':', line.trim().substring(0, 60));
    }
  }
}

const content = fs.readFileSync('js/app.js', 'utf8');
checkBrackets(content, 'js/app.js');