import { state } from '../state.js';
import { MODES, WORLD_NAMES, WORLD_COUNT, POMODORO_WORLD_COUNT, SLEEP_WORLD_COUNT } from '../config.js';
import { updatePanelVisibility } from './panelManager.js';
import { updateNarrativeUI } from '../ui/narrativeUI.js';
import { updateFreeUI } from '../ui/freeUI.js';
import { updatePomodoroUI } from '../ui/pomodoroUI.js';

// Atualiza UI do seletor de modo
export function updateModeUI() {
  // Atualiza seletor no header/painel
  const selector = document.getElementById('modeSelector');
  if (selector) {
    selector.value = state.currentMode;
  }

  // Atualiza botão "Modo Automático" (mantém compatibilidade)
  const autoBtn = document.getElementById('btnAutoMode');
  if (autoBtn) {
    const isNarrative = state.currentMode === 'narrative';
    autoBtn.classList.toggle('active', isNarrative);
    autoBtn.setAttribute('aria-pressed', isNarrative);
    const sub = document.getElementById('autoSub');
    if (sub) sub.textContent = isNarrative ? 'ON' : 'OFF';
  }

  // Atualiza label do modo no header se existir
  const modeLabel = document.getElementById('currentModeLabel');
  if (modeLabel) {
    const mode = MODES.find(m => m.id === state.currentMode);
    modeLabel.textContent = mode ? mode.name : '—';
  }

  // Atualiza visibilidade dos painéis por modo
  updatePanelVisibility();
}

// Atualiza UI específica do modo
export function updateModeSpecificUI(modeId) {
  switch (modeId) {
    case 'narrative':
      if (typeof updateNarrativeUI === 'function') updateNarrativeUI();
      break;
    case 'pomodoro':
      if (typeof updatePomodoroUI === 'function') updatePomodoroUI();
      break;
    case 'sleep':
      if (typeof updateSleepUI === 'function') updateSleepUI();
      break;
    case 'free':
      if (typeof updateFreeUI === 'function') updateFreeUI();
      break;
  }
}

// Atualiza display do timer Pomodoro
export function updateTimerDisplay() {
  if (!state.currentMode || state.currentMode !== 'pomodoro') return;

  const timerEl = document.getElementById('pomodoroTimer');
  if (!timerEl) return;

  const { pomodoro } = state;
  const mins = Math.floor(pomodoro.timeRemaining / 60);
  const secs = pomodoro.timeRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (timerEl.textContent !== timeStr) {
    timerEl.textContent = timeStr;
  }

  // Atualiza progress ring
  const progressRing = document.getElementById('pomodoroProgressRing');
  if (progressRing) {
    const progress = 1 - (pomodoro.timeRemaining / pomodoro.totalTime);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - progress);
    progressRing.style.strokeDashoffset = offset;
  }

  // Sincroniza timer do screensaver (modo Pomodoro)
  if (typeof window.syncScreensaverPomodoroTimer === 'function') {
    window.syncScreensaverPomodoroTimer();
  }
}

// Atualiza display do timer Sono
export function updateAlarmTimerDisplay() {
  if (!state.currentMode || state.currentMode !== 'sleep') return;

  const timerEl = document.getElementById('sleepAlarmTimer');
  const labelEl = document.getElementById('sleepAlarmLabel');
  if (!timerEl) return;

  const { alarmTime, wakeWindowMinutes, isWaking } = state.sleep;

  const [hours, minutes] = alarmTime.split(':').map(Number);

  const now = new Date();
  let alarmDate = new Date();
  alarmDate.setHours(hours, minutes, 0, 0);

  if (alarmDate <= new Date()) {
    alarmDate.setDate(alarmDate.getDate() + 1);
  }

  const diffMs = alarmDate.getTime() - Date.now();
  if (diffMs <= 0) {
    timerEl.textContent = 'Despertando...';
    if (labelEl) labelEl.textContent = 'Despertando...';
    return;
  }

  const totalMinutes = Math.ceil((alarmDate.getTime() - Date.now()) / 60000);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minsLeft = totalMinutes % 60;

  let label = 'Até alarme';
  if (state.sleep.isWaking) {
    label = 'Despertando...';
  } else if (totalMinutes <= state.sleep.wakeWindowMinutes) {
    label = 'Janela de despertar';
  }

  timerEl.textContent = `${String(hoursLeft).padStart(2, '0')}:${String(minsLeft).padStart(2, '0')}`;
  if (labelEl) labelEl.textContent = label;
}

// Atualiza UI do modo Sono
export function updateSleepUI() {
  if (!state.currentMode || state.currentMode !== 'sleep') return;

  // Atualiza seletor de mundo
  const worldSelect = document.getElementById('sleepWorldSelect');
  if (worldSelect) {
    worldSelect.value = state.sleep.currentWorld;
  }

  // Atualiza time picker
  const alarmTimeInput = document.getElementById('sleepAlarmTime');
  if (alarmTimeInput) {
    alarmTimeInput.value = state.sleep.alarmTime;
  }

  // Atualiza display do timer
  updateAlarmTimerDisplay();
}

// Sincroniza UI do modo automático
export function syncAutoUI() {
  const btn = document.getElementById('btnAutoMode');
  const sub = document.getElementById('autoSub');
  if (btn) {
    btn.classList.toggle('active', state.autoMode);
    btn.setAttribute('aria-pressed', state.autoMode ? 'true' : 'false');
  }
  if (sub) sub.textContent = state.autoMode ? 'ON' : 'OFF';
}

// Retorna contagem de mundos do modo atual
export function getCurrentModeWorldCount() {
  if (!state.currentMode) return 0;
  switch (state.currentMode) {
    case 'pomodoro':
      return POMODORO_WORLD_COUNT;
    case 'sleep':
      return SLEEP_WORLD_COUNT;
    default:
      return WORLD_COUNT;
  }
}

// Verifica se modo atual permite MP3
export function currentModeAllowsMp3() {
  if (!state.currentMode) return false;
  return state.currentMode === 'pomodoro' || state.currentMode === 'free' || state.currentMode === 'narrative';
}

// Atualiza indicador do gatilho ativo
export function updateTriggerIndicator() {
  const el = document.getElementById('triggerActive');
  if (!el) return;

  const { worldTriggers } = state;

  const TRIGGER_DEFS = [
    { key: 'bonusRain', label: 'Chuva Intensa', icon: '🌧️' },
    { key: 'clap', label: 'Duas Palmas', icon: '👏' },
    { key: 'inverted', label: 'Invertido', icon: '🔄' },
    { key: 'freefall', label: 'Queda Livre', icon: '💥' },
    { key: 'motion', label: 'Movimento', icon: '🏃' },
    { key: 'vehicle', label: 'Veículo', icon: '🚗' },
    { key: 'sessionStart', label: 'Início Sessão', icon: '⏱️' },
    { key: 'silence', label: 'Silêncio', icon: '🤫' },
    { key: 'rain', label: 'Chuva', icon: '🌧️' },
    { key: 'flat', label: 'Aparelho Apoiado', icon: '📱' },
    { key: 'night', label: 'Noite', icon: '🌙' },
    { key: 'sessionLong', label: 'Sessão Longa', icon: '🏆' },
    { key: 'fallback', label: 'Sem Gatilho', icon: '🏠' }
  ];

  const t = window.t || ((k) => k);

  for (const def of TRIGGER_DEFS) {
    const targetWorld = worldTriggers[def.key];
    if (targetWorld === -1 || targetWorld === undefined) continue;

    const worldName = WORLD_NAMES?.[targetWorld] || `Mundo ${targetWorld}`;
    const triggerActive = document.getElementById('triggerActive');
    if (triggerActive) {
      triggerActive.textContent = `${t('trigger.active') || 'gatilho ativo'}: ${def.icon} ${t('trigger.label.' + def.key) || def.label} → ${worldName}`;
      triggerActive.dataset.activeTrigger = def.key;
    }
    return;
  }

  const triggerActive = document.getElementById('triggerActive');
  if (triggerActive) {
    const t2 = window.t || ((k) => k);
    triggerActive.textContent = t2('trigger.none') || 'gatilho ativo: nenhum';
    triggerActive.dataset.activeTrigger = 'none';
  }
}
