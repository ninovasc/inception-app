# Phase 2: Consolidation - Execution Checklist

## 1. Timer Display Consolidation ✅
- [x] Consolidate `updateTimerDisplay` (pomodoroUI.js + pomodoroMode.js) → keep in modeManager

## 2. Sleep UI Consolidation 
- [x] Consolidate `updateSleepUI` (sleepUI.js + sleepMode.js) → keep in modeManager
- [x] Consolidate `updateAlarmTimerDisplay` (sleepUI.js + sleepMode.js) → keep in modeManager

## 3. Trigger Indicator Consolidation
- [ ] Consolidate `updateTriggerIndicator` (app.js) + `updateActiveTriggerDisplay` (commonUI.js) + `syncAutoUI` (narrativeMode.js) → keep in modeManager

## 4. getCurrentModeWorlds Consolidation
- [x] Remove from commonUI.js, keep only in modeManager

## 5. generateFullSeed - Single window assignment
- [x] Verified: No duplicate assignments, only calls - pattern is correct

## 5. setSensorStatus - Already done ✅
- [x] Single in sensors.js

## 6. Test after each change
- [x] All 109 tests pass after timer consolidation
- [x] All 109 tests pass after sleep UI consolidation
- [ ] All 109 tests must pass after trigger indicator consolidation