import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Console Errors', () => {
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

  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));

    await page.waitForTimeout(2000);

    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });

  test('No console errors on mode switch', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));

    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(1000);

    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });

  test('No console errors on Sleep mode switch', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));

    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(1000);

    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });

  test('No console errors on Free mode switch', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));

    await page.selectOption('#modeSelector', 'free');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'free', { timeout: 5000 });
    await page.waitForTimeout(1000);

    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });
});
