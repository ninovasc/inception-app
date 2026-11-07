// Sincroniza a versão do package.json com window.APP_VERSION em js/app.js
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version; // ex: 1.0.1
const major = parseInt(version.split('.')[0]) || 0;
const minor = parseInt(version.split('.')[1]) || 0;
const patch = parseInt(version.split('.')[2]) || 0;

// Converte semver para número inteiro: major*10000 + minor*100 + patch
const appVersion = major * 10000 + minor * 100 + patch;

const appJsPath = 'js/app.js';
let appJs = fs.readFileSync(appJsPath, 'utf8');

const newAppJs = appJs.replace(
  /window\.APP_VERSION = \d+/,
  `window.APP_VERSION = ${appVersion}`
);

if (newAppJs === appJs) {
  console.log('⚠️  window.APP_VERSION não encontrado em js/app.js');
  process.exit(1);
}

fs.writeFileSync(appJsPath, newAppJs);
console.log(`✅ window.APP_VERSION atualizado para ${appVersion} (package.json v${version})`);
