import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Language', () => {
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

  test('Language selector changes language', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    await langSelector.selectOption('en-US');
    await page.waitForTimeout(500);
    await expect(langSelector).toHaveValue('en-US');
  });

  test('Language selector shows flag options', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    const options = await langSelector.locator('option').allTextContents();
    expect(options).toContain('🇺🇸');
    expect(options).toContain('🇪🇸');
    expect(options).toContain('🇧🇷');
  });
});
