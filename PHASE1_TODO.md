# Phase 1: Quick Wins - Execution Checklist

## 1. Remove Unused Exports from config.js (4 exports) ✅
- [x] LEGACY_SYNTH_PRESETS
- [x] WORLD_SYNTH_PRESETS  
- [x] CURATED_PRIORITY
- [x] POMODORO_SYNTH_PRESETS

## 2. Remove Duplicate window.generateFullSeed Assignments (4 duplicates) - NOT NEEDED
- [x] Verified: No duplicate assignments, only calls - pattern is correct

## 3. Remove Duplicate setSensorStatus (4 files → keep in sensors.js) ✅
- [x] js/sensors.js (keep + export)
- [x] js/mechanics.js (remove local, import from sensors.js)
- [x] js/seed.js (remove local, import from sensors.js)
- [x] js/capture.js (keep local wrapper for capStatus, import base from sensors.js)

## 4. Convert .then() to async/await (6 files) - NEXT
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

## 7. Remove unused exports from config.js ✅
- [x] LEGACY_SYNTH_PRESETS
- [x] WORLD_SYNTH_PRESETS
- [x] CURATED_PRIORITY
- [x] POMODORO_SYNTH_PRESETS

## 8. Fix hardcoded strings in config.js (33 strings) - move to i18n - LATER

## 9. Test after each change
- [x] All 109 tests pass after config.js changes
- [x] All 109 tests pass after setSensorStatus consolidation
- [ ] Run tests after each batch of changes
- [ ] All 109 tests must pass