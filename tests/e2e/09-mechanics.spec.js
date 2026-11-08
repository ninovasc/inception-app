import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Mechanics', () => {
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

  test('Mechanics buttons exist', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#btnMemCatcher')).toBeAttached();
    await expect(page.locator('#btnAutoKick')).toBeAttached();
    await expect(page.locator('#btnSpatial3D')).toBeAttached();
    await expect(page.locator('#btnLucidTimer')).toBeAttached();
    await expect(page.locator('#btnDeprivation')).toBeAttached();
  });
});
