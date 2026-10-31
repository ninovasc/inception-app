import { state } from './state.js';

export function togglePanel(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
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

export function showToast(msg) {
  let toast = document.getElementById('statusToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'statusToast';
    toast.className = 'status-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}
