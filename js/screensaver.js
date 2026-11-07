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
    // Timer do Pomodoro (replica a seção Pomodoro) com anel de progresso
    el.style.background = '#000000';
    const t = (typeof window !== 'undefined' && typeof window.t === 'function') ? window.t : (k => k);
    const r = 90;
    const c = 2 * Math.PI * r;
    el.innerHTML = `
      <div style="text-align:center; color:#fff; font-family:monospace; position:relative; width:220px; height:220px; margin:0 auto;">
        <svg width="220" height="220" style="transform:rotate(-90deg);">
          <circle cx="110" cy="110" r="${r}" fill="none" stroke="#222" stroke-width="8"/>
          <circle id="screensaverPomodoroRing" cx="110" cy="110" r="${r}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}"/>
        </svg>
        <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div style="font-size:0.7rem; color:#888; margin-bottom:4px;">${t('pomodoro.title') || 'Pomodoro'}</div>
          <div id="screensaverPomodoroTimer" style="font-size:2.6rem; font-weight:700; letter-spacing:2px;">25:00</div>
          <div style="font-size:0.7rem; color:#888; margin-top:4px;" id="screensaverPomodoroPhase">Atividade</div>
        </div>
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

  // Atualiza anel de progresso
  const ring = document.getElementById('screensaverPomodoroRing');
  if (ring && window.state && window.state.pomodoro) {
    const p = window.state.pomodoro;
    const total = p.totalTime || 1;
    const remaining = p.timeRemaining || 0;
    const progress = 1 - (remaining / total);
    const r = 90;
    const circ = 2 * Math.PI * r;
    ring.setAttribute('stroke-dashoffset', String(circ * (1 - progress)));
  }
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
