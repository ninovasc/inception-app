import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Sensors', () => {
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

  test('Sensor buttons exist', async ({ page }) => {
    await expect(page.locator('#btnMic')).toBeVisible();
    await expect(page.locator('#btnMotion')).toBeVisible();
    await expect(page.locator('#btnGps')).toBeVisible();
  });
});
