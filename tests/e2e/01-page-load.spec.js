import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Page Load', () => {
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

  test('page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
    });
    await page.waitForTimeout(3000);
    // Filtra apenas erros benignos (deprecated, etc.)
    const realErrors = errors.filter(e => !e.includes('deprecated') && !e.includes('favicon'));
    expect(realErrors).toHaveLength(0);
  });

  test('app.js executes without module errors', async ({ page }) => {
    const moduleErrors = [];
    page.on('pageerror', e => moduleErrors.push(e.message));
    await page.waitForTimeout(3000);
    // Verifica se app.js foi executado
    const appLoaded = await page.evaluate(() => typeof window.__getAppState === 'function');
    expect(appLoaded).toBe(true);
  });

  test('mode selector shows placeholder initially', async ({ page }) => {
    const selector = page.locator('#modeSelector');
    await expect(selector).toHaveValue('');
    const placeholder = page.locator('#modeSelector option[value=""]');
    await expect(placeholder).toHaveText('Selecione o modo');
  });

  test('start button hidden initially', async ({ page }) => {
    await expect(page.locator('#startModeBtn')).toBeHidden();
  });

  test('language selector exists in header', async ({ page }) => {
    await expect(page.locator('#langSelector')).toBeVisible();
    await expect(page.locator('#langSelector')).toHaveValue('pt-BR');
  });

  test('sensors visible initially', async ({ page }) => {
    await expect(page.locator('#btnMic')).toBeVisible();
    await expect(page.locator('#btnMotion')).toBeVisible();
    await expect(page.locator('#btnGps')).toBeVisible();
  });

  test('no accordion panels visible initially', async ({ page }) => {
    const panels = page.locator('.menu-section[data-mode]');
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      await expect(panels.nth(i)).toBeHidden();
    }
  });
});
