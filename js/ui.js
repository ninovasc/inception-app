import { state } from './state.js';

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

export function handleXYMove(clientX, clientY) {
  const xyPad = document.getElementById('xyPad');
  const rect = xyPad.getBoundingClientRect();
  let x = (clientX - rect.left) / rect.width;
  let y = (clientY - rect.top) / rect.height;
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));

  state.xyState = { x, y };
  const cursor = document.getElementById('xyCursor');
  cursor.style.left = (x * 100) + '%';
  cursor.style.top = (y * 100) + '%';
  document.getElementById('xyCoords').textContent = `X: ${Math.round(x * 100)}% | Y: ${Math.round((1 - y) * 100)}%`;

  const mappedSpeed = 0.25 + x * 1.15;
  const mappedFilter = 160 + (1 - y) * (18000 - 160);

  document.getElementById('sliderSpeed').value = mappedSpeed;
  document.getElementById('sliderFilter').value = mappedFilter;
  import('./audio.js').then(a => a.applyParameters());
}


