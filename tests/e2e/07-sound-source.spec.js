import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Sound Source', () => {
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

  test('Sound source select exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const sourceSelect = page.locator('#sourceList select').first();
    await expect(sourceSelect).toBeVisible();
  });

  test('Sound source has synth/mp3 options', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const select = page.locator('#sourceList select').first();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Synth');
    expect(options).toContain('MP3');
  });

  test('Sound source MP3 selection shows file input', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const select = page.locator('#sourceList select').first();
    await select.selectOption('mp3');
    await page.waitForTimeout(500);

    const fileInput = page.locator('#sourceList input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('Sound source synth selection shows synth dropdown', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const select = page.locator('#sourceList select').first();
    await select.selectOption('synth');
    await page.waitForTimeout(500);

    const synthSelect = page.locator('#sourceList select').nth(1);
    await expect(synthSelect).toBeVisible();
  });
});
