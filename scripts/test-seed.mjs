import { encodeState, decodeState } from '../js/seed.js';
import { normalizeSourceType, normalizeWorldTriggers, WORLD_SYNTH, WORLD_NAMES, DEFAULT_WORLD_TRIGGERS } from '../js/config.js';
import { state } from '../js/state.js';
import { decideWorld } from '../js/automode.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

// ---------- Seed v3: round-trip completo (13 mundos) ----------
const s = {
  sourceMode: 'synth',
  currentSynthType: 7,
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
  worldSourceType: ['synth', 'mp3', 'youtube', 'synth', 'mp3', 'synth', 'synth', 'synth', 'synth', 'synth', 'synth', 'synth', 'synth'],
  worldSynth: [5, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
  worldVolume: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75],
  worldSources: { mp3: Array(13).fill(''), youtube: ['dQw4w9WgXcQ', '', '', '', '', '', '', '', '', '', '', '', ''] },
  autoMode: true,
  worldTriggers: { bonusRain: 11, clap: 5, inverted: 10, freefall: -1, motion: 6, vehicle: 3, sessionStart: 7, silence: 8, rain: 4, flat: 1, night: 9, sessionLong: 12, fallback: 0 },
  triggerMotion: 0.45,
  triggerSilenceSec: 45
};
const seed = encodeState(s);
console.log('seed:', seed);
const d = decodeState(seed);
assert(d.sourceMode === 'synth', 'v3 sourceMode');
assert(d.currentSynthType === 7, 'v3 synth');
assert(d.currentLevel === 3, 'v3 level');
assert(Math.abs(d.xyState.x - 0.42) < 0.011, 'v3 xy x');
assert(Math.abs(d.xyState.y - 0.77) < 0.011, 'v3 xy y');
assert(d.volumes[0] === 0.9, 'v3 vol0');
assert(d.speed === 0.85, 'v3 speed');
assert(d.filter === 1200, 'v3 filter');
assert(d.delay === 0.4, 'v3 delay');
assert(d.reverb === 0.6, 'v3 reverb');
assert(d.mechanics.mem === true, 'v3 mem');
assert(d.mechanics.auto === false, 'v3 auto');
assert(d.mechanics.spatial === true, 'v3 spatial');
assert(d.mechanics.lucidMin === 30, 'v3 lucidMin');
assert(d.mechanics.depr === false, 'v3 depr');
assert(d.ytLinks && d.ytLinks[0] === 'dQw4w9WgXcQ', 'v3 yt0');
assert(d.worldSourceType && d.worldSourceType.length === 13, 'v3 worldSourceType len 13');
assert(d.worldSourceType && d.worldSourceType[1] === 'mp3', 'v3 wst mp3');
assert(d.worldSourceType && d.worldSourceType[2] === 'youtube', 'v3 wst youtube');
assert(d.worldSynth && d.worldSynth.length === 13, 'v3 worldSynth len 13');
assert(d.worldSynth && d.worldSynth[1] === 17, 'v3 worldSynth >9 (base36 2 chars)');
assert(d.worldSynth && d.worldSynth[12] === 6, 'v3 worldSynth[12]');
assert(d.worldVolume && d.worldVolume.length === 13 && d.worldVolume[3] === 0.5, 'v3 worldVolume');
assert(d.worldVolume && d.worldVolume[12] === 0.75, 'v3 worldVolume[12]');
assert(d.worldSources && d.worldSources.youtube && d.worldSources.youtube[0] === 'dQw4w9WgXcQ', 'v3 wsyu');
assert(d.worldSources.youtube.length === 13, 'v3 wsyu len 13');
assert(d.autoMode === true, 'v3 autoMode');
assert(d.worldTriggers.bonusRain === 11, 'v3 trigger bonusRain remap');
assert(d.worldTriggers.freefall === -1, 'v3 trigger freefall off');
assert(d.worldTriggers.sessionLong === 12, 'v3 trigger sessionLong remap');
assert(d.worldTriggers.fallback === 0, 'v3 trigger fallback');
assert(d.triggerMotion === 0.45, 'v3 triggerMotion');
assert(d.triggerSilenceSec === 45, 'v3 triggerSilenceSec');

// round-trip estável
const s2 = { ...s, ytLinks: d.ytLinks, worldSourceType: d.worldSourceType, worldSynth: d.worldSynth, worldVolume: d.worldVolume, worldSources: d.worldSources };
const seed2 = encodeState(s2);
assert(seed === seed2, 'v3 round-trip stable');

// ---------- Normalização dos 13 gatilhos ----------
const trig = normalizeWorldTriggers({ bonusRain: -1, clap: 99, inverted: 10, fallback: 5, lixo: 3 });
assert(trig.bonusRain === -1, 'normalize off (-1 respeitado)');
assert(trig.clap === 5, 'normalize invalid -> default');
assert(trig.inverted === 10, 'normalize valid');
assert(trig.fallback === 5, 'normalize fallback valid');
assert(trig.motion === 6, 'normalize ausente -> default');
const invalidAll = normalizeWorldTriggers({ freefall: 99, rain: -7, night: null, silence: 'x', motion: 2.5, fallback: -1 });
assert(invalidAll.freefall === 2 && invalidAll.rain === 4 && invalidAll.fallback === 0, 'normalize invalid all');
assert(normalizeWorldTriggers(null).motion === 6, 'normalize null defaults');
assert(normalizeWorldTriggers({}).sessionStart === 7, 'normalize empty defaults');

// ---------- Migração: seed legada v2.x (6 mundos) -> 13 mundos ----------
function legacySeed(obj) { return btoa(JSON.stringify(obj)); }
const legacy = legacySeed({
  m: 0, s: 2, l: 3, x: [42, 77], v: [90, 30, 30, 80],
  p: 85, f: 1200, d: 40, r: 60,
  h: '101300', i: 2,
  t: '001000',
  w: '012340',
  o: [20, 30, 40, 50, 60, 70],
  u: 'dQw4w9WgXcQ,_,_,_,_,_',
  a: 1,
  g: [4, 1, 2, 5, 3, 0, 45, 45]
});
const L = decodeState(legacy);
assert(L !== null, 'legacy decodes');
assert(L.worldSourceType && L.worldSourceType.length === 13, 'legacy worldSourceType -> 13');
assert(L.worldSourceType[8] === 'youtube', 'legacy world 2 (Hotel) -> 8 (DWaD) youtube');
assert(L.worldSourceType[0] === 'synth', 'legacy world 0 (Realidade) -> 0 (HRD) synth');
assert(L.worldSynth && L.worldSynth.length === 13, 'legacy worldSynth -> 13');
assert(L.worldSynth[0] === 0, 'legacy synth world0 -> new0 (preservado)');
assert(L.worldSynth[4] === 1, 'legacy synth world1 (Chuva) -> new4 (Old Souls)');
assert(L.worldSynth[2] === 3, 'legacy synth world3 (Fortaleza) -> new2 (DIC)');
assert(L.worldSynth[6] === WORLD_SYNTH[6], 'legacy mundo novo sem synth -> padrão do mundo');
assert(L.worldVolume && L.worldVolume.length === 13, 'legacy worldVolume -> 13');
assert(L.worldVolume[4] === 0.3, 'legacy volume world1 (Chuva) -> new4');
assert(L.worldVolume[6] === 0.2, 'legacy mundo novo volume padrão');
assert(L.worldSources.youtube[0] === 'dQw4w9WgXcQ', 'legacy yt link world0 -> new0');
assert(L.worldSources.youtube.length === 13, 'legacy yt links -> 13');
assert(L.currentLevel === 2, 'legacy level 3 (Fortaleza) -> 2 (DIC)');
assert(L.autoMode === true, 'legacy autoMode preservado');
assert(L.worldTriggers.freefall === 9, 'legacy freefall->Limbo vira WFaT (9)');
assert(L.worldTriggers.rain === 4, 'legacy rain->Chuva vira Old Souls (4)');
assert(L.worldTriggers.night === 8, 'legacy night->Hotel vira DWaD (8)');
assert(L.worldTriggers.silence === 1, 'legacy silence->Lúcido vira WBOW (1)');
assert(L.worldTriggers.motion === 2, 'legacy motion->Fortaleza vira DIC (2)');
assert(L.worldTriggers.fallback === 0, 'legacy fallback->Realidade vira HRD (0)');
assert(L.worldTriggers.clap === 5, 'regras novas ficam no padrão (clap->528491)');
assert(L.triggerMotion === 0.45, 'legacy triggerMotion preservado');
assert(L.triggerSilenceSec === 45, 'legacy triggerSilenceSec preservado');
assert(L.speed === 0.85 && L.filter === 1200, 'legacy sliders preservados');

// Seed legada re-codificada já sai no formato v3 (13 mundos)
const reEncoded = encodeState({
  worldSourceType: L.worldSourceType, worldSynth: L.worldSynth, worldVolume: L.worldVolume,
  worldSources: L.worldSources, worldTriggers: L.worldTriggers, autoMode: L.autoMode
});
assert(decodeState(reEncoded).worldSynth.length === 13, 'legacy re-encode -> v3 13 mundos');

// ---------- Seed legada parcial (v2.8, sem gatilhos/mundo por fonte) ----------
const legacyPartial = decodeState(legacySeed({ s: 2, l: 5, h: '000000' }));
assert(legacyPartial.currentLevel === 1, 'legacy parcial level 5 (Lúcido) -> 1 (WBOW)');
assert(legacyPartial.autoMode === undefined, 'legacy parcial autoMode undefined');
assert(legacyPartial.worldTriggers === undefined, 'legacy parcial triggers undefined');
assert(legacyPartial.worldSynth === undefined, 'legacy parcial worldSynth undefined');

// ---------- Seed v3 com campos corrompidos -> defaults seguros ----------
const corrupt1 = decodeState(btoa(JSON.stringify({ V: 3, w: 'zz' })));
assert(corrupt1.worldSynth.length === 13 && corrupt1.worldSynth[0] === WORLD_SYNTH[0], 'v3 w corrompido -> defaults');
const corrupt2 = decodeState(btoa(JSON.stringify({ V: 3, t: '12' })));
assert(corrupt2.worldSourceType.length === 13 && corrupt2.worldSourceType[2] === 'synth', 'v3 t curto -> padding synth');
const corrupt3 = decodeState(btoa(JSON.stringify({ V: 3, g: [1, 2, 3] })));
assert(corrupt3.worldTriggers.fallback === 0, 'v3 g curto -> fallback padrão');
assert(decodeState('') === null, 'empty null');
assert(decodeState(null) === null, 'null null');
assert(decodeState('lixo!!!') === null, 'garbage null');

// ---------- MP3 como tipo de fonte ----------
const mp3Seed = encodeState({ sourceMode: 'mp3', worldSourceType: Array(13).fill('mp3') });
const mp3Decoded = decodeState(mp3Seed);
assert(mp3Decoded.sourceMode === 'mp3', 'sourceMode mp3');
assert(mp3Decoded.worldSourceType.every(t => t === 'mp3'), 'world 0..12 mp3');

// ---------- YouTube desativado (código do player preservado) ----------
assert(normalizeSourceType('youtube') === 'synth', 'youtube -> synth (disabled)');
assert(normalizeSourceType('upload') === 'mp3', 'legacy upload -> mp3');
assert(normalizeSourceType('mp3') === 'mp3', 'mp3 stays');
assert(normalizeSourceType('lixo') === 'synth', 'invalid -> synth');

// ---------- Consistência estrutural dos 13 mundos ----------
assert(WORLD_NAMES.length === 13, '13 mundos');
assert(WORLD_SYNTH.length === 13, '13 synth padrão');
assert(WORLD_SYNTH.every((v, i) => v >= 0 && v < 18), 'índices de synth válidos');
assert(new Set(WORLD_NAMES).size === 13, 'nomes únicos');

// ---------- Automode: prioridade curada e exclusividade ----------
function resetAuto() {
  state.worldTriggers = { ...DEFAULT_WORLD_TRIGGERS };
  state.gpsRain = false; state.gpsNight = false; state.gpsSpeedMps = 0;
  state.motionIntensity = 0; state.micSilenceSec = 0; state.silenceSeconds = 0;
  state.micRainIntenseSec = 0; state.lastClapTime = 0; state.freefallTimestamp = 0;
  state.lastKickTime = 0; state.isInvertedHold = false; state.isFlatHold = false;
  state.triggerMotion = 0.6; state.triggerSilenceSec = 30; state.isAutoKickOn = true;
}
resetAuto();
assert(decideWorld() === 0, 'automode sem sinais -> fallback (HRD)');
state.gpsRain = true;
assert(decideWorld() === 4, 'automode chuva -> Old Souls');
state.micRainIntenseSec = 6;
assert(decideWorld() === 12, 'automode chuva intensa vence -> Bonus Track');
state.micRainIntenseSec = 0;
state.lastClapTime = Date.now() - 1000;
assert(decideWorld() === 5, 'automode palmas -> 528491');
state.lastClapTime = 0;
state.isInvertedHold = true;
assert(decideWorld() === 10, 'automode invertido -> Paradox');
state.isInvertedHold = false;
state.motionIntensity = 0.7;
assert(decideWorld() === 6, 'automode movimento -> Mombasa');
state.motionIntensity = 0;
state.gpsSpeedMps = 8;
assert(decideWorld() === 3, 'automode veículo -> Radical Notion');
state.gpsSpeedMps = 0;
state.micSilenceSec = 30;
assert(decideWorld() === 8, 'automode silêncio -> Dream Within a Dream');
state.micSilenceSec = 0;
state.gpsRain = false;
state.gpsNight = true;
assert(decideWorld() === 9, 'automode noite -> Waiting for a Train');
state.gpsNight = false;
state.isFlatHold = true;
assert(decideWorld() === 1, 'automode apoiado -> We Built Our Own World');
state.isFlatHold = false;
// Exclusividade + remapeamento: chuva remapeada para Mombasa.
state.worldTriggers.rain = 6;
state.gpsRain = true; state.gpsNight = true;
assert(decideWorld() === 6, 'automode remapeado: chuva -> Mombasa (antes da noite)');
state.gpsRain = false;
assert(decideWorld() === 9, 'automode remapeado: noite permanece');
// Regra desativada (-1) é ignorada.
resetAuto();
state.worldTriggers.silence = -1;
state.micSilenceSec = 30;
assert(decideWorld() === 0, 'automode regra desativada -> fallback');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
