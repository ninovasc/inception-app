import { encodeState, decodeState } from '../js/seed.js';

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
  worldSources: { mp3: ['', '', '', '', '', ''], youtube: ['dQw4w9WgXcQ', '', '', '', '', ''] }
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
