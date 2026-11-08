import { state } from './state.js';

export function toggleHelp() {
  const el = document.getElementById('helpModal');
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
