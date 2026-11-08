import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Mode Switching', () => {
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

  test('selecting Narrative mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
  });

  test('selecting Pomodoro mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeVisible();
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
    await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  });

  test('selecting Sleep mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeVisible();
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
  });

  test('selecting Free mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'free');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'free', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
    await expect(page.locator('#mechPanel').locator('..')).toBeVisible();
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
    await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  });

  test('returning to empty mode hides all panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      document.getElementById('modeSelector').value = '';
      document.getElementById('modeSelector').dispatchEvent(new Event('change'));
    });

    const panels = page.locator('.menu-section[data-mode]');
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      await expect(panels.nth(i)).toBeHidden();
    }
  });

  test('start button appears when mode selected', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#startModeBtn')).toBeVisible();
  });

  test('start button hidden when empty mode', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      document.getElementById('modeSelector').value = '';
      document.getElementById('modeSelector').dispatchEvent(new Event('change'));
    });

    await expect(page.locator('#startModeBtn')).toBeHidden();
  });
});
