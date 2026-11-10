// Facade module: re-exports from split modules (ModeSwitcher, PanelManager, UIUpdater)
import * as modeSwitcher from './modeSwitcher.js';
import * as panelManager from './panelManager.js';
import * as uiUpdater from './uiUpdater.js';

// Use a proxy to lazily access modeSwitcher.modeModules (avoids circular dependency)
export const modeModules = new Proxy({}, {
  get(target, prop) {
    return modeSwitcher.modeModules[prop];
  }
});

export function initModeManager() { return modeSwitcher.initModeManager(); }
export function switchMode(modeId) { return modeSwitcher.switchMode(modeId); }
export function activateMode(modeId) { return modeSwitcher.activateMode(modeId); }
export function getCurrentModeModule() { return modeSwitcher.getCurrentModeModule(); }
export function isMode(modeId) { return modeSwitcher.isMode(modeId); }
export function getCurrentModeConfig() { return modeSwitcher.getCurrentModeConfig(); }
export function isPomodoroMode() { return modeSwitcher.isPomodoroMode(); }
export function isSleepMode() { return modeSwitcher.isSleepMode(); }
export function isNarrativeMode() { return modeSwitcher.isNarrativeMode(); }
export function isFreeMode() { return modeSwitcher.isFreeMode(); }

// Panel manager
export function updatePanelVisibility() { return panelManager.updatePanelVisibility(); }
export function updateWorldUI() { return panelManager.updateWorldUI(); }

// UI updater
export function updateModeUI() { return uiUpdater.updateModeUI(); }
export function updateModeSpecificUI(modeId) { return uiUpdater.updateModeSpecificUI(modeId); }
export function updateTimerDisplay() { return uiUpdater.updateTimerDisplay(); }
export function updateAlarmTimerDisplay() { return uiUpdater.updateAlarmTimerDisplay(); }
export function updateSleepUI() { return uiUpdater.updateSleepUI(); }
export function syncAutoUI() { return uiUpdater.syncAutoUI(); }
export function updateTriggerIndicator() { return uiUpdater.updateTriggerIndicator(); }
export function getCurrentModeWorldCount() { return uiUpdater.getCurrentModeWorldCount(); }
export function currentModeAllowsMp3() { return uiUpdater.currentModeAllowsMp3(); }
