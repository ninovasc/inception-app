// Cria a interface visual do Pomodoro (timer, controles, config)
export function createPomodoroUI() {
  const container = document.createElement('div');
  container.id = 'pomodoroUI';
  
  container.innerHTML = `
    <div style="margin-bottom: 12px;">
      <!-- Timer principal -->
      <div id="pomodoroTimerContainer" style="text-align:center; padding:16px 0;">
        <div id="pomodoroPhaseLabel" style="font-size:0.7rem; color:var(--muted); font-family:monospace; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">${t('pomodoro.phase.activity') || 'Atividade'}</div>
        <div id="pomodoroTimer" style="font-size:3rem; font-weight:300; font-family:monospace; color:#fff; line-height:1;">25:00</div>
        <div style="margin-top:8px;">
          <svg width="120" height="120" style="transform: rotate(-90deg);">
            <circle id="pomodoroProgressBg" cx="60" cy="60" r="45" fill="none" stroke="#222" stroke-width="6"/>
            <circle id="pomodoroProgressRing" cx="60" cy="60" r="45" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="282.74" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"/>
          </svg>
        </div>
        <div id="pomodoroCycles" style="margin-top:8px; font-size:0.65rem; color:var(--muted); font-family:monospace;">0/4</div>
      </div>
      
      <!-- Controles -->
      <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:12px;">
        <button id="pomodoroPlayPause" class="menu-item" style="flex:1; max-width:100px; justify-content:center;" data-action="togglePomodoro">
          <span id="pomodoroPlayPauseText">${t('pomodoro.start') || 'Iniciar'}</span>
        </button>
        <button class="menu-item" style="flex:1; max-width:100px; justify-content:center;" onclick="window.skipPomodoroPhase()">
          <span>${t('pomodoro.skip') || 'Pular'}</span>
        </button>
        <button class="menu-item" style="flex:1; max-width:100px; justify-content:center;" onclick="window.resetPomodoro()">
          <span>${t('pomodoro.reset') || 'Reset'}</span>
        </button>
      </div>
      
      <!-- Configurações colapsáveis -->
      <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; cursor:pointer;" onclick="togglePomodoroConfig()">
          <span style="font-size:0.65rem; color:var(--muted); font-family:monospace; text-transform:uppercase; letter-spacing:1px;">${t('pomodoro.config') || 'Configurações'}</span>
          <span id="pomodoroConfigArrow" style="color:#fff; transition:transform 0.2s;">▶</span>
        </div>
        <div id="pomodoroConfig" style="max-height:0; overflow:hidden; transition:max-height 0.3s ease; opacity:0; transition:opacity 0.2s, max-height 0.3s;">
          <div class="slider-group" style="margin-bottom:10px;">
            <div class="slider-header"><span>${t('pomodoro.activityDuration') || 'Atividade'}</span><span id="pomodoroActivityVal">25 min</span></div>
            <input type="range" id="pomodoroActivityDuration" min="5" max="60" step="1" value="25" oninput="updatePomodoroActivityDuration(this.value)">
          </div>
          <div class="slider-group" style="margin-bottom:10px;">
            <div class="slider-header"><span>${t('pomodoro.shortBreakDuration') || 'Pausa Curta'}</span><span id="pomodoroShortBreakVal">5 min</span></div>
            <input type="range" id="pomodoroShortBreakDuration" min="1" max="15" step="1" value="5" oninput="updatePomodoroShortBreakDuration(this.value)">
          </div>
          <div class="slider-group" style="margin-bottom:10px;">
            <div class="slider-header"><span>${t('pomodoro.longBreakDuration') || 'Pausa Longa'}</span><span id="pomodoroLongBreakVal">15 min</span></div>
            <input type="range" id="pomodoroLongBreakDuration" min="5" max="30" step="1" value="15" oninput="updatePomodoroLongBreakDuration(this.value)">
          </div>
          <div class="slider-group" style="margin-bottom:10px;">
            <div class="slider-header"><span>${t('pomodoro.cyclesUntilLongBreak') || 'Ciclos p/ Pausa Longa'}</span><span id="pomodoroCyclesVal">4</span></div>
            <input type="range" id="pomodoroCyclesUntilLongBreak" min="2" max="8" step="1" value="4" oninput="updatePomodoroCyclesUntilLongBreak(this.value)">
          </div>
        </div>
      </div>
    </div>
  `;
  
  return container;
}

// Atualiza UI do Pomodoro baseado no estado
export function updatePomodoroUI() {
  const { pomodoro } = state;
  if (!pomodoro.enabled) return;
  
  // Atualiza label da fase
  const phaseLabel = document.getElementById('pomodoroPhaseLabel');
  if (phaseLabel) {
    const labels = {
      activity: 'Atividade',
      shortBreak: 'Pausa Curta',
      longBreak: 'Pausa Longa'
    };
    phaseLabel.textContent = labels[pomodoro.phase] || pomodoro.phase;
  }
  
  // Atualiza timer (delegated to uiUpdater)
  if (typeof window.updateTimerDisplay === 'function') {
    window.updateTimerDisplay();
  }
  
  // Atualiza ciclos
  const cyclesEl = document.getElementById('pomodoroCycles');
  if (cyclesEl) {
    cyclesEl.textContent = `${pomodoro.cyclesCompleted}/${pomodoro.cyclesUntilLongBreak}`;
  }
  
  // Atualiza botão play/pause
  const playPauseBtn = document.getElementById('pomodoroPlayPause');
  const playPauseText = document.getElementById('pomodoroPlayPauseText');
  if (playPauseBtn && playPauseText) {
    const isRunning = state.pomodoro.isRunning;
    playPauseText.textContent = state.pomodoro.isRunning ? 'Pausar' : 'Iniciar';
    playPauseBtn.setAttribute('aria-pressed', state.pomodoro.isRunning);
  }
}

export function togglePomodoroConfig() {
  const config = document.getElementById('pomodoroConfig');
  const arrow = document.getElementById('pomodoroConfigArrow');
  if (!config) return;
  
  const isOpen = config.style.maxHeight !== '0px' && config.style.maxHeight !== '';
  
  if (isOpen) {
    config.style.maxHeight = '0px';
    config.style.opacity = '0';
    document.getElementById('pomodoroConfigArrow').style.transform = 'rotate(0deg)';
  } else {
    config.style.maxHeight = config.scrollHeight + 'px';
    config.style.opacity = '1';
    document.getElementById('pomodoroConfigArrow').style.transform = 'rotate(90deg)';
  }
}

// Handlers de configuração
window.updatePomodoroActivityDuration = function(val) {
  document.getElementById('pomodoroActivityVal').textContent = `${val} min`;
  state.pomodoro.activityDuration = parseInt(val) * 60;
  if (state.pomodoro.phase === 'activity') {
    state.pomodoro.totalTime = state.pomodoro.activityDuration;
    if (!state.pomodoro.isRunning) {
      state.pomodoro.timeRemaining = state.pomodoro.totalTime;
      if (typeof window.updateTimerDisplay === 'function') window.updateTimerDisplay();
    }
  }
};

window.updatePomodoroShortBreakDuration = function(val) {
  document.getElementById('pomodoroShortBreakVal').textContent = `${val} min`;
  state.pomodoro.shortBreakDuration = parseInt(val) * 60;
};

window.updatePomodoroLongBreakDuration = function(val) {
  document.getElementById('pomodoroLongBreakVal').textContent = `${val} min`;
  state.pomodoro.longBreakDuration = parseInt(val) * 60;
};

window.updatePomodoroCyclesUntilLongBreak = function(val) {
  document.getElementById('pomodoroCyclesVal').textContent = val;
  state.pomodoro.cyclesUntilLongBreak = parseInt(val);
};

// Carregar MP3 para Atividade
window.loadPomodoroActivityMp3 = function(file) {
  if (!file) return;
  import('../audio.js').then(({ audio }) => {
    const idx = 0; // Atividade = índice 0
    
    audio.loadWorldMp3(idx, file).then(() => {
      state.pomodoro.activityMp3 = file.name;
      document.getElementById('pomodoroActivityMp3Label').textContent = file.name.slice(0, 30);
    });
  });
};

// Carregar MP3 para Pausa
window.loadPomodoroBreakMp3 = function(file) {
  if (!file) return;
  import('../audio.js').then(({ audio }) => {
    const idx = 1; // Descanso = índice 1
    
    audio.loadWorldMp3(idx, file).then(() => {
      state.pomodoro.breakMp3 = file.name;
      document.getElementById('pomodoroBreakMp3Label').textContent = file.name.slice(0, 30);
    });
  });
};

// Expor funções globalmente
window.togglePomodoroConfig = function() {
  const config = document.getElementById('pomodoroConfig');
  const arrow = document.getElementById('pomodoroConfigArrow');
  if (!config) return;
  
  const isOpen = config.style.maxHeight !== '0px' && config.style.maxHeight !== '';
  
  if (isOpen) {
    config.style.maxHeight = '0px';
    config.style.opacity = '0';
    document.getElementById('pomodoroConfigArrow').style.transform = 'rotate(0deg)';
  } else {
    config.style.maxHeight = config.scrollHeight + 'px';
    config.style.opacity = '1';
    document.getElementById('pomodoroConfigArrow').style.transform = 'rotate(90deg)';
  }
};