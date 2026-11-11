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

// Attach direct event listener to select elements for iOS Safari compatibility
// iOS Safari has a known bug where change events don't fire on dynamically added select elements
function attachSelectListener(select) {
  if (select.dataset.actionAttached) return;
  select.dataset.actionAttached = 'true';
  select.addEventListener('change', handleEvent);
}

// Observe DOM for dynamically added select elements with data-action
if (typeof document !== 'undefined' && typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check the added element itself
          if (node.matches && node.matches('select[data-action]')) {
            attachSelectListener(node);
          }
          // Check descendants
          const selects = node.querySelectorAll ? node.querySelectorAll('select[data-action]') : [];
          selects.forEach(attachSelectListener);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Registra listeners delegados (uma vez).
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleEvent, true);
  document.addEventListener('change', handleEvent, true);
  document.addEventListener('input', handleEvent, true);
}

window.registerAction = registerAction;
window.getAction = getAction;
