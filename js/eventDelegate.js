// Delegação de eventos: um único listener por tipo de evento,
// despachando para ações registradas via data-action.
const actions = {};

export function registerAction(name, handler) {
  actions[name] = handler;
}

export function getAction(name) {
  return actions[name];
}

function handleEvent(event) {
  const target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
  if (!target) return;
  const action = target.getAttribute('data-action');
  const handler = actions[action];
  if (typeof handler !== 'function') return;
  // Preserva `this` = elemento, como handlers inline faziam.
  handler.call(target, event);
}

// Registra listeners delegados (uma vez).
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleEvent, true);
  document.addEventListener('change', handleEvent, true);
  document.addEventListener('input', handleEvent, true);
}

window.registerAction = registerAction;
window.getAction = getAction;
