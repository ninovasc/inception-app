import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Screensaver', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      localStorage.clear();
      sessionStorage.clear();
      if (navigator.serviceWorker) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    });
    await page.reload();
    await page.waitForSelector('text=PASIV', { timeout: 30000 });
  });

  test('Screensaver module loads without errors', async ({ page }) => {
    // Verifica que não há erros de console relacionados ao screensaver
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForTimeout(2000);
    const screensaverErrors = errors.filter(e => e.toLowerCase().includes('screensaver'));
    expect(screensaverErrors).toHaveLength(0);
  });
});
