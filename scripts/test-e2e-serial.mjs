#!/usr/bin/env node
// Script to run Playwright tests one file at a time to avoid timeout issues

import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

const testsDir = 'tests/e2e';
const files = readdirSync(testsDir)
  .filter(f => f.endsWith('.spec.js'))
  .sort();

console.log(`Found ${files.length} e2e test files:`);
files.forEach(f => console.log(`  - ${f}`));

async function runTest(file) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    console.log(`\n▶ Running: ${file}...`);
    
    const proc = spawn('npx', ['playwright', 'test', `tests/e2e/${file}`], {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (code === 0) {
        console.log(`  ✓ ${file} (${elapsed}s)`);
        resolve({ file, passed: true, elapsed });
      } else {
        console.log(`  ✗ ${file} (${elapsed}s)`);
        console.log(`  stderr: ${stderr.slice(0, 500)}`);
        resolve({ file, passed: false, elapsed, stderr: stderr.slice(0, 1000) });
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log(`\n📋 Running ${files.length} e2e tests sequentially...\n`);
  
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const result = await runTest(file);
    results.push(result);
    if (result.passed) passed++;
    else failed++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed}/${files.length} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.file}`);
      if (r.stderr) console.log(`    ${r.stderr.slice(0, 200)}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All e2e tests passed!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});