import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Voice', () => {
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

  test('Voice preset select exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const voiceSelect = page.locator('#voicePresetSelect');
    await expect(voiceSelect).toBeVisible();
  });

  test('Voice has parameter sliders', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#micGate')).toBeAttached();
    await expect(page.locator('#micDelaySlider')).toBeAttached();
    await expect(page.locator('#micFb')).toBeAttached();
    await expect(page.locator('#micRev')).toBeAttached();
    await expect(page.locator('#micDw')).toBeAttached();
  });
});
