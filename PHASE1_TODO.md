# Phase 1: Quick Wins - Execution Checklist

## 1. Remove Unused Exports from config.js (4 exports)
- [ ] LEGACY_SYNTH_PRESETS
- [ ] WORLD_SYNTH_PRESETS  
- [ ] CURATED_PRIORITY
- [ ] POMODORO_SYNTH_PRESETS

## 2. Remove Duplicate window.generateFullSeed Assignments (4 duplicates)
- [ ] js/app.js (keep this one)
- [ ] js/audio.js (remove)
- [ ] js/sensors.js (remove)
- [ ] js/mechanics.js (remove)
- [ ] js/seed.js (remove - wait, this is where it's defined)

## 3. Remove Duplicate setSensorStatus (4 files → keep in sensors.js)
- [ ] js/sensors.js (keep)
- [ ] js/mechanics.js (remove)
- [ ] js/seed.js (remove)
- [ ] js/capture.js (remove)

## 4. Convert .then() to async/await (6 files)
- [ ] js/app.js
- [ ] js/ui/modeSelector.js
- [ ] js/ui/pomodoroUI.js
- [ ] js/ui/sleepUI.js
- [ ] js/modes/pomodoroMode.js
- [ ] js/modes/sleepMode.js

## 5. Replace var → const/let
- [ ] Scan all files for `var ` and replace

## 6. Remove console.log/warn/error from production code
- [ ] Keep only essential error logging

## 7. Remove unused exports from config.js
- [ ] LEGACY_SYNTH_PRESETS
- [ ] WORLD_SYNTH_PRESETS
- [ ] CURATED_PRIORITY
- [ ] POMODORO_SYNTH_PRESETS

## 8. Fix hardcoded strings in config.js (33 strings) - move to i18n

## 9. Test after each change
- [ ] Run tests after each batch of changes
- [ ] All 109 tests must pass