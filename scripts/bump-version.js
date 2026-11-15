#!/usr/bin/env node
// Version bump script - increments patch version in package.json and app.js

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');

function bumpVersion() {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  // Increment patch version
  const newPatch = patch + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;
  
  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  // Update app.js - APP_VERSION = major * 10000 + minor * 100 + patch
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const newAppVersion = major * 10000 + minor * 100 + newPatch;
  const newAppJsContent = appJsContent.replace(
    /window\.APP_VERSION\s*=\s*\d+/,
    `window.APP_VERSION = ${newAppVersion}`
  );
  fs.writeFileSync(appJsPath, newAppJsContent);
  
  console.log(`Version bumped: ${currentVersion} -> ${newVersion}`);
  console.log(`APP_VERSION: ${major * 10000 + minor * 100 + patch} -> ${newAppVersion}`);
  
  return newVersion;
}

try {
  bumpVersion();
} catch (err) {
  console.error('Error bumping version:', err);
  process.exit(1);
}