// manifest-generator.js - Generates a manifest of file hashes for deployment verification
import { createHash } from 'crypto';
import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { resolve, relative } from 'path';

const ROOT = process.cwd();
const DIST_DIRS = ['js', 'css', 'assets', '.github'];
const EXCLUDE = ['node_modules', '.git', 'dist', 'build', '.DS_Store', 'Thumbs.db'];

function getAllFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.includes(entry.name)) continue;
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!EXCLUDE.includes(entry.name)) {
        files.push(...getAllFiles(`${dir}/${entry.name}`));
      }
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function hashFile(filepath) {
  const content = readFileSync(filepath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function generateManifest() {
  console.log('🔍 Generating deployment manifest...\n');
  
  const allFiles = [];
  for (const dir of DIST_DIRS) {
    try {
      allFiles.push(...getAllFiles(resolve(ROOT, dir)));
    } catch (e) {
      // dir might not exist
    }
  }
  
  // Also include root files
  const rootFiles = readdirSync(ROOT).filter(f => 
    statSync(`${ROOT}/${f}`).isFile() && !EXCLUDE.includes(f)
  );
  for (const f of rootFiles) {
    if (f === 'deployment-manifest.json') continue; // Skip manifest itself
    allFiles.push(`${ROOT}/${f}`);
  }

  const manifest = {
    generated: new Date().toISOString(),
    version: '4.0.3',
    commit: getGitCommit(),
    files: {}
  };

  for (const file of allFiles.sort()) {
    const relPath = relative(ROOT, file);
    const hash = hashFile(file);
    const stats = statSync(file);
    manifest.files[relPath] = {
      hash,
      size: stats.size,
      modified: statSync(file).mtime.toISOString()
    };
  }

  const manifestPath = resolve(ROOT, 'deployment-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Manifest generated: ${manifestPath}`);
  console.log(`   Files: ${Object.keys(manifest.files).length}`);
  console.log(`   Version: ${manifest.version}`);
  console.log(`   Commit: ${manifest.commit}`);
  console.log(`   Generated: ${manifest.generated}`);
  
  return manifest;
}

function getGitCommit() {
  try {
    const output = execSync('git rev-parse HEAD', { stdio: 'pipe', encoding: 'utf8' });
    return output.trim().slice(0, 12);
  } catch {
    return 'unknown';
  }
}

function verifyManifest(manifestPath = 'deployment-manifest.json') {
  console.log('\n🔍 Verifying deployment...\n');
  
  if (!existsSync(manifestPath)) {
    console.error('❌ Manifest not found!');
    return false;
  }
  
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let allPassed = true;
  let checked = 0;
  
  for (const [relPath, expected] of Object.entries(manifest.files)) {
    const fullPath = resolve(ROOT, relPath);
    if (!existsSync(fullPath)) {
      console.log(`  ❌ MISSING: ${relPath}`);
      allPassed = false;
      continue;
    }
    
    const actualHash = hashFile(fullPath);
    if (actualHash !== expected.hash) {
      console.log(`  ❌ HASH MISMATCH: ${relPath}`);
      console.log(`    Expected: ${expected.hash}`);
      console.log(`    Actual:   ${actualHash}`);
      allPassed = false;
    } else {
      checked++;
    }
  }
  
  console.log(`\n✅ Verified ${checked} files`);
  if (!allPassed) {
    console.log('❌ Some files do not match!');
    return false;
  }
  
  console.log('✅ All files match manifest!');
  return true;
}

// CLI
const args = process.argv.slice(2);
const cmd = args[0] || 'generate';

if (cmd === 'generate') {
  generateManifest();
} else if (cmd === 'verify') {
  const ok = verifyManifest(args[1] || 'deployment-manifest.json');
  process.exit(ok ? 0 : 1);
} else {
  console.log('Usage: node manifest.js [generate|verify] [manifest-path]');
}