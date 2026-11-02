import { state } from '../state.js';
import { SLEEP_LEVELS, SLEEP_WORLD_NAMES } from '../config.js';
import { t } from '../i18n.js';

// Cria a interface visual do Modo Sono
export function createSleepUI() {
  const container = document.createElement('div');
  container.id = 'sleepUI';
  
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <!-- Seleção de mundo (batida) -->
      <div style="margin-bottom: 12px;">
        <label style="font-size:0.6rem; color:var(--muted); margin-bottom:4px; display:block; font-family:monospace;">${t('sleep.title') || 'Sono'}</label>
        <select id="sleepWorldSelect" onchange="window.setSleepWorld(this.value)" aria-label="${t('sleep.title') || 'Batida'}" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:8px 10px;font-size:0.75rem;border-radius:6px;width:100%;">
          ${SLEEP_WORLD_NAMES.map((w, i) => `<option value="${i}">${w}</option>`).join('')}
        </select>
        <div style="font-size:0.62rem; color:var(--muted); font-family:monospace; margin-top:4px;">${t('sleep.worldDesc') || 'Cada mundo é uma batida binaural/isocrônica para indução de sono'}</div>
      </div>
      
      <!-- Alarme -->
      <div style="margin-bottom: 12px;">
        <label style="font-size:0.6rem; color:var(--muted); margin-bottom:4px; display:block; font-family:monospace;">${t('sleep.alarmTime') || 'Hora do Alarme'}</label>
        <input type="time" id="sleepAlarmTime" onchange="window.setSleepAlarmTime(this.value)" style="background:#0a0a0a;border:1px solid var(--border);color:#fff;padding:8px 10px;font-size:0.75rem;border-radius:6px;width:100%;">
        <div style="font-size:0.62rem; color:var(--muted); font-family:monospace; margin-top:4px;">${t('sleep.alarmDesc') || 'Horário para acordar. O despertar suave começa 15 min antes.'}</div>
      </div>
      
      <!-- Janela de despertar -->
      <div style="margin-bottom: 12px;">
        <div class="slider-group" style="margin-bottom:10px;">
          <div class="slider-header"><span>${t('sleep.wakeWindow') || 'Janela de Despertar'}</span><span id="sleepWakeWindowVal">15 min</span></div>
          <input type="range" id="sleepWakeWindow" min="5" max="60" step="1" value="15" oninput="window.updateSleepWakeWindow(this.value)">
        </div>
      </div>
      
      <!-- Timer até alarme -->
      <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); text-align: center;">
        <div style="font-size:0.65rem; color:var(--muted); font-family:monospace; margin-bottom:4px; text-transform:uppercase; letter-spacing:1px;">${t('sleep.untilAlarm') || 'Até o Alarme'}</div>
        <div id="sleepAlarmTimer" style="font-size:2rem; font-weight:300; font-family:monospace; color:#fff; line-height:1;">07:00</div>
        <div id="sleepAlarmLabel" style="font-size:0.65rem; color:var(--muted); font-family:monospace; margin-top:4px;">${t('sleep.untilAlarm') || 'Até o Alarme'}</div>
      </div>
      
      <!-- Controles -->
      <div style="margin-top: 16px; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
        <button id="sleepTestAlarm" class="menu-item" style="flex:1; max-width:140px; justify-content:center;" onclick="window.testSleepAlarm()">
          <span>${t('sleep.testAlarm') || 'Testar Alarme'}</span>
        </button>
      </div>
    </div>
  `;
  
  return container;
}

// Atualiza UI do Sono
export function updateSleepUI() {
  const { sleep } = state;
  if (!sleep.enabled) return;
  
  // Atualiza seletor de mundo
  const worldSelect = document.getElementById('sleepWorldSelect');
  if (worldSelect) {
    worldSelect.value = sleep.currentWorld;
  }
  
  // Atualiza time picker
  const alarmTimeInput = document.getElementById('sleepAlarmTime');
  if (alarmTimeInput) {
    alarmTimeInput.value = sleep.alarmTime;
  }
  
  // Atualiza display do timer
  updateAlarmTimerDisplay();
}

function updateAlarmTimerDisplay() {
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
    document.getElementById('sleepAlarmTimer').textContent = 'Despertando...';
    if (labelEl) labelEl.textContent = 'Despertando...';
    return;
  }
  
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hoursLeft = Math.floor(totalMinutes / 60);
  const minsLeft = totalMinutes % 60;
  
  let label = 'Até o Alarme';
  if (state.sleep.isWaking) {
    label = 'Despertando...';
  } else if (totalMinutes <= state.sleep.wakeWindowMinutes) {
    label = 'Janela de Despertar';
  }
  
  if (document.getElementById('sleepAlarmTimer')) {
    document.getElementById('sleepAlarmTimer').textContent = 
      `${String(hoursLeft).padStart(2, '0')}:${String(minsLeft).padStart(2, '0')}`;
  }
  if (labelEl) labelEl.textContent = label;
}

// Handlers globais
window.setSleepAlarmTime = function(timeStr) {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return;
  state.sleep.alarmTime = timeStr;
  if (state.sleep.enabled) {
    cancelAlarm();
    scheduleAlarm();
  }
  updateAlarmTimerDisplay();
};

window.setSleepWakeWindow = function(val) {
  state.sleep.wakeWindowMinutes = Math.max(5, Math.min(60, parseInt(val) || 15));
  document.getElementById('sleepWakeWindowVal').textContent = `${state.sleep.wakeWindowMinutes} min`;
};

window.setSleepWorld = function(val) {
  state.sleep.currentWorld = parseInt(val);
};

window.testSleepAlarm = function() {
  playAlarmSound();
};