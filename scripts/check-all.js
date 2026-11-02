#!/usr/bin/env node

// Test runner for all JS files and test suite
import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const JS_DIR = 'js';

function getAllJsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...getAllJsFiles(fullPath));
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkSyntax(file) {
  try {
    execSync(`node --check ${file}`, { stdio: 'pipe', cwd: ROOT });
    return { file, ok: true };
  } catch (err) {
    return { file, ok: false, error: err.stdout?.toString() || err.message };
  }
}

function runTests() {
  try {
    const output = execSync('node scripts/test-seed.mjs', { 
      stdio: 'pipe', 
      cwd: ROOT,
      encoding: 'utf8'
    });
    const pass = output.includes('0 failed');
    return { ok: pass, output: output.toString() };
  } catch (err) {
    return { ok: false, output: err.stdout?.toString() || err.message };
  }
}

function main() {
  console.log('🔍 Checking syntax of all JS files...\n');
  
  const jsFiles = getAllJsFiles(resolve(ROOT, 'js'));
  let allPassed = true;
  
  for (const file of jsFiles) {
    const result = checkSyntax(file);
    if (result.ok) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
      console.log(`     ${result.error}`);
      allPassed = false;
    }
  }
  
  console.log('\n🧪 Running test suite...\n');
  const testResult = runTests();
  if (testResult.ok) {
    console.log('  ✅ All tests passed\n');
  } else {
    console.log('  ❌ Tests failed\n');
    console.log(testResult.output);
    return false;
  }
  
  if (allPassed) {
    console.log('✅ All checks passed!');
    return true;
  } else {
    console.log('\n❌ Some checks failed');
    return false;
  }
}

const success = main();
process.exit(success ? 0 : 1);