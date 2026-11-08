import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Sliders', () => {
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

  test('Speed slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const slider = page.locator('#sliderSpeed');
    await expect(slider).toBeVisible();
  });

  test('Filter slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const slider = page.locator('#sliderFilter');
    await expect(slider).toBeVisible();
  });

  test('Delay slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const slider = page.locator('#sliderDelay');
    await expect(slider).toBeVisible();
  });

  test('Reverb slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await page.waitForTimeout(300);

    const slider = page.locator('#sliderReverb');
    await expect(slider).toBeVisible();
  });
});
