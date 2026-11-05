export function toggleAccordion(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  const isOpen = panel.classList.contains('open');

  // Close all other accordion panels
  document.querySelectorAll('.accordion-panel').forEach(p => {
    if (p !== panel) {
      p.classList.remove('open');
      // Update arrow
      const title = p.previousElementSibling;
      if (title) {
        const arrow = title.querySelector('.accordion-arrow');
        if (arrow) arrow.textContent = '▶';
      }
    }
  });

  // Toggle current panel
  panel.classList.toggle('open');

  // Update arrow for current panel
  const title = panel.previousElementSibling;
  if (title) {
    const arrow = title.querySelector('.accordion-arrow');
    if (arrow) arrow.textContent = panel.classList.contains('open') ? '▼' : '▶';
  }
}

window.toggleAccordion = toggleAccordion;
