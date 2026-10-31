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
  ytLinks: ['dQw4w9WgXcQ', '', 'abc123def45']
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
assert(d.ytLinks && d.ytLinks[1] === '', 'yt1');
assert(d.ytLinks && d.ytLinks[2] === 'abc123def45', 'yt2');

// round-trip encode
const s2 = {
  sourceMode: d.sourceMode,
  currentSynthType: d.currentSynthType,
  currentLevel: d.currentLevel,
  xyState: d.xyState,
  volumes: d.volumes,
  speed: d.speed,
  filter: d.filter,
  delay: d.delay,
  reverb: d.reverb,
  mechanics: d.mechanics,
  lucidModeIdx: [0,15,30,60].indexOf(d.mechanics.lucidMin),
  ytLinks: d.ytLinks
};
const seed2 = encodeState(s2);
assert(seed === seed2, 'round-trip stable');

// invalid
assert(decodeState('') === null, 'empty null');
assert(decodeState(null) === null, 'null null');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
