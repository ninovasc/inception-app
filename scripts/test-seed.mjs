import { encodeState, decodeState } from '../js/seed.js';
import { normalizeSourceType, normalizeWorldTriggers } from '../js/config.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

const s = {
  sourceMode: 'synth',
  currentSynthType: 2,
  currentLevel: 3,
  xyState: { x: 0.42, y: 0.77 },
  volumes: [0.9, 0.3, 0.3, 0.8],
  speed: 0.85,
  filter: 1200,
  delay: 0.4,
  reverb: 0.6,
  mechanics: { mem: true, auto: false, spatial: true, lucidMin: 30, depr: false },
  lucidModeIdx: 2,
  ytLinks: ['dQw4w9WgXcQ', '', 'abc123def45'],
  worldSourceType: ['synth', 'mp3', 'youtube', 'synth', 'synth', 'synth'],
  worldSynth: [0, 1, 2, 3, 4, 0],
  worldVolume: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7],
  worldSources: { mp3: ['', '', '', '', '', ''], youtube: ['dQw4w9WgXcQ', '', '', '', '', ''] },
  autoMode: true,
  worldTriggers: { freefall: 4, rain: 1, night: 2, silence: 5, motion: 3, fallback: 0 },
  triggerMotion: 0.45,
  triggerSilenceSec: 45
};
const seed = encodeState(s);
console.log('seed:', seed);
const d = decodeState(seed);
assert(d.sourceMode === 'synth', 'sourceMode');
assert(d.currentSynthType === 2, 'synth');
assert(d.currentLevel === 3, 'level');
assert(Math.abs(d.xyState.x - 0.42) < 0.011, 'xy x');
assert(Math.abs(d.xyState.y - 0.77) < 0.011, 'xy y');
assert(d.volumes[0] === 0.9, 'vol0');
assert(d.speed === 0.85, 'speed');
assert(d.filter === 1200, 'filter');
assert(d.delay === 0.4, 'delay');
assert(d.reverb === 0.6, 'reverb');
assert(d.mechanics.mem === true, 'mem');
assert(d.mechanics.auto === false, 'auto');
assert(d.mechanics.spatial === true, 'spatial');
assert(d.mechanics.lucidMin === 30, 'lucidMin');
assert(d.mechanics.depr === false, 'depr');
assert(d.ytLinks && d.ytLinks[0] === 'dQw4w9WgXcQ', 'yt0');
assert(d.worldSourceType && d.worldSourceType[1] === 'mp3', 'wst mp3');
assert(d.worldSourceType && d.worldSourceType[2] === 'youtube', 'wst youtube');
assert(!d.worldSourceType.includes('upload'), 'no legacy upload');
assert(d.worldSynth && d.worldSynth[2] === 2, 'wsy');
assert(d.worldVolume && d.worldVolume[3] === 0.5, 'wvl');
assert(d.worldSources && d.worldSources.youtube && d.worldSources.youtube[0] === 'dQw4w9WgXcQ', 'wsyu');
assert(d.autoMode === true, 'autoMode');
assert(d.worldTriggers && d.worldTriggers.freefall === 4, 'trigger freefall');
assert(d.worldTriggers && d.worldTriggers.silence === 5, 'trigger silence');
assert(d.worldTriggers && d.worldTriggers.fallback === 0, 'trigger fallback');
assert(d.triggerMotion === 0.45, 'triggerMotion');
assert(d.triggerSilenceSec === 45, 'triggerSilenceSec');

// Gatilhos: valores inválidos caem no padrão; -1 desativa; fallback sempre ativo.
const trig = normalizeWorldTriggers({ freefall: -1, rain: 9, night: 2, silence: -1, motion: 3, fallback: 5 });
assert(trig.freefall === -1, 'normalize off');
assert(trig.rain === 1, 'normalize invalid -> default');
assert(trig.night === 2, 'normalize valid');
assert(trig.fallback === 5, 'normalize fallback valid');
const invalidAll = normalizeWorldTriggers({ freefall: 99, rain: -7, night: null, silence: 'x', motion: 2.5, fallback: -1 });
assert(invalidAll.freefall === 4 && invalidAll.rain === 1 && invalidAll.fallback === 0, 'normalize invalid all');
assert(normalizeWorldTriggers(null).motion === 3, 'normalize null defaults');

// Seed antiga (sem os campos novos) não inventa valores.
const oldSeed = encodeState({ currentLevel: 2, mechanics: { mem: false, auto: false, spatial: false, lucidMin: 0, depr: false } });
const oldDecoded = decodeState(oldSeed);
assert(oldDecoded.autoMode === undefined, 'old seed autoMode undefined');
assert(oldDecoded.worldTriggers === undefined, 'old seed triggers undefined');
assert(oldDecoded.triggerMotion === undefined, 'old seed motion undefined');

// round-trip
const s2 = { ...s, ytLinks: d.ytLinks, worldSourceType: d.worldSourceType, worldSynth: d.worldSynth, worldVolume: d.worldVolume, worldSources: d.worldSources };
const seed2 = encodeState(s2);
assert(seed === seed2, 'round-trip stable');

assert(decodeState('') === null, 'empty null');
assert(decodeState(null) === null, 'null null');

// MP3 como tipo de fonte (novo modelo)
const mp3Seed = encodeState({ sourceMode: 'mp3', worldSourceType: ['mp3', 'synth', 'synth', 'synth', 'synth', 'synth'] });
const mp3Decoded = decodeState(mp3Seed);
assert(mp3Decoded.sourceMode === 'mp3', 'sourceMode mp3');
assert(mp3Decoded.worldSourceType[0] === 'mp3', 'world 0 mp3');

// YouTube desativado: normalização para Synth (código do player preservado)
assert(normalizeSourceType('youtube') === 'synth', 'youtube -> synth (disabled)');
assert(normalizeSourceType('upload') === 'mp3', 'legacy upload -> mp3');
assert(normalizeSourceType('mp3') === 'mp3', 'mp3 stays');
assert(normalizeSourceType('lixo') === 'synth', 'invalid -> synth');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
