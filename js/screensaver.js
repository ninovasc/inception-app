import { SCREENSAVER_SVG } from './screensaver-svg.js';
import { state } from './state.js';

// Screensaver de inatividade (1 min) — overlay com SVG animado
const SCREENSAVER_DELAY_MS = 60000; // 1 minuto
let screensaverTimer = null;
let screensaverEl = null;
let screensaverVisible = false;
let screensaverWakeLock = null;

export function createScreensaver() {
  if (screensaverEl) return screensaverEl;
  const el = document.createElement('div');
  el.id = 'screensaverOverlay';
  el.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 1.2s ease;
  `;
  // SVG inline (animações CSS funcionam direto no DOM, ao contrário de <object>)
  el.innerHTML = SCREENSAVER_SVG;
  // Click no overlay esconde o screensaver (touchstart removido: click já cobre touch com passive)
  el.addEventListener('click', hideScreensaver);
  document.body.appendChild(el);
  screensaverEl = el;
  return el;
}

export function showScreensaver() {
  if (screensaverVisible) return;
  const el = createScreensaver();
  // Conteúdo depende do modo atual
  renderScreensaverContent(el);
  // Force reflow para a transição funcionar
  el.offsetHeight;
  el.style.pointerEvents = 'auto';
  el.style.opacity = '1';
  screensaverVisible = true;
  // Mantém a tela acesa enquanto o screensaver estiver visível
  requestScreensaverWakeLock();
}

function renderScreensaverContent(el) {
  const mode = (state && state.currentMode) || '';
  if (mode === 'sleep') {
    // Tela preta
    el.innerHTML = '';
    el.style.background = '#000000';
    return;
  }
  if (mode === 'pomodoro') {
    // Timer do Pomodoro (replica a seção Pomodoro)
    el.style.background = '#000000';
    const t = (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t : (k => k);
    el.innerHTML = `
      <div style="text-align:center; color:#fff; font-family:monospace;">
        <div style="font-size:0.7rem; color:#888; margin-bottom:8px;">${t('pomodoro.title') || 'Pomodoro'}</div>
        <div id="screensaverPomodoroTimer" style="font-size:4rem; font-weight:700; letter-spacing:2px;">25:00</div>
        <div style="font-size:0.7rem; color:#888; margin-top:8px;" id="screensaverPomodoroPhase">Atividade</div>
      </div>
    `;
    // Sincroniza com o timer atual
    syncScreensaverPomodoroTimer();
    return;
  }
  // Padrão: SVG animado
  el.style.background = '#000000';
  el.innerHTML = SCREENSAVER_SVG;
}

export function syncScreensaverPomodoroTimer() {
  const src = document.getElementById('pomodoroTimer');
  const dst = document.getElementById('screensaverPomodoroTimer');
  if (src && dst) dst.textContent = src.textContent;
  const srcPhase = document.getElementById('pomodoroPhaseLabel');
  const dstPhase = document.getElementById('screensaverPomodoroPhase');
  if (srcPhase && dstPhase) dstPhase.textContent = srcPhase.textContent;
}

// Expor para sincronização externa
window.syncScreensaverPomodoroTimer = syncScreensaverPomodoroTimer;

async function requestScreensaverWakeLock() {
  try {
    if ('wakeLock' in navigator && navigator.wakeLock && typeof navigator.wakeLock.request === 'function' && !screensaverWakeLock && !state.wakeLock) {
      screensaverWakeLock = await navigator.wakeLock.request('screen');
      if (screensaverWakeLock && typeof screensaverWakeLock.addEventListener === 'function') {
        screensaverWakeLock.addEventListener('release', () => { screensaverWakeLock = null; });
      }
    }
  } catch (e) {}
}

export function hideScreensaver() {
  if (!screensaverVisible) return;
  const el = screensaverEl;
  if (!el) return;
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  screensaverVisible = false;
  // Libera wake lock adquirido pelo screensaver
  releaseScreensaverWakeLock();
  // Reset timer ao voltar
  resetScreensaverTimer();
}

async function releaseScreensaverWakeLock() {
  try {
    if (screensaverWakeLock && typeof screensaverWakeLock.release === 'function') {
      await screensaverWakeLock.release();
    }
  } catch (e) {}
  screensaverWakeLock = null;
}

export function resetScreensaverTimer() {
  if (screensaverTimer) clearTimeout(screensaverTimer);
  // Só inicia o timer se o app estiver "ativo" (não em screensaver)
  if (!screensaverVisible) {
    screensaverTimer = setTimeout(showScreensaver, SCREENSAVER_DELAY_MS);
  }
}

// Eventos de atividade do usuário
const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'click'];
activityEvents.forEach(evt => {
  document.addEventListener(evt, resetScreensaverTimer, { passive: true });
});

// Pausar timer quando tab não visível (evita screensaver em background)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (screensaverTimer) clearTimeout(screensaverTimer);
  } else {
    resetScreensaverTimer();
  }
});

// Iniciar timer
resetScreensaverTimer();

// Pausa/retoma o timer (usado durante reprodução para evitar overlay/tela apagar)
export function pauseScreensaver() {
  if (screensaverTimer) { clearTimeout(screensaverTimer); screensaverTimer = null; }
  if (screensaverVisible) hideScreensaver();
}
export function resumeScreensaver() {
  resetScreensaverTimer();
}

// Expor para debug/teste
window.__screensaver = { show: showScreensaver, hide: hideScreensaver, reset: resetScreensaverTimer, pause: pauseScreensaver, resume: resumeScreensaver };
