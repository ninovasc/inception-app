import { state } from './state.js';

export function autoResizeSeed() {
  const el = document.getElementById('seedInput');
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
}

export function toggleHelp() {
  const m = document.getElementById('helpModal');
  if (m) m.classList.toggle('open');
}

export function togglePanel(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isOpen = el.classList.toggle('open');
  const prev = el.previousElementSibling;
  if (prev) {
    const arrow = prev.querySelector('span:last-child');
    if (arrow) arrow.textContent = isOpen ? '▼' : '▶';
  }
}


