import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Generative AI', () => {
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

  test('Generative UI exists in DOM', async ({ page }) => {
    const genUI = page.locator('#generativeUI');
    await expect(genUI).toBeAttached();
  });

  test('Generative toggle exists', async ({ page }) => {
    const toggle = page.locator('#generativeEnabled');
    await expect(toggle).toBeAttached();
  });

  test('Generative variation slider exists', async ({ page }) => {
    const slider = page.locator('#generativeVariation');
    await expect(slider).toBeAttached();
  });

  test('Generative new variation button exists', async ({ page }) => {
    const btn = page.locator('#generativeNew');
    await expect(btn).toBeAttached();
  });
});
