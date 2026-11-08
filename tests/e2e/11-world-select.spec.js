import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - World Select', () => {
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

  test('World select exists in Mundos panel', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const worldSelect = page.locator('#worldSelect');
    await expect(worldSelect).toBeVisible();
  });

  test('World select has 13 options in narrative mode', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const worldSelect = page.locator('#worldSelect');
    const options = await worldSelect.locator('option').count();
    expect(options).toBe(13);
  });

  test('Pomodoro mode hides Mundos section', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('.menu-section:has(#worldsPanel)')).toBeHidden();
  });

  test('Sleep mode has 8 worlds', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    const worldSelect = page.locator('#sleepWorldSelect');
    const options = await worldSelect.locator('option').count();
    expect(options).toBe(8);
  });
});
