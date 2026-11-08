import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Sleep', () => {
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

  test('Sleep mode shows alarm time input', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    const alarmInput = page.locator('#sleepAlarmTime');
    await expect(alarmInput).toBeVisible();
    await expect(alarmInput).toHaveValue('07:00');
  });

  test('Sleep mode shows wake window slider', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    const slider = page.locator('#sleepWakeWindow');
    await expect(slider).toBeVisible();
  });

  test('Sleep mode shows test alarm button', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#sleepTestAlarm')).toBeVisible();
  });

  test('Sleep mode shows alarm timer display', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#sleepAlarmTimer')).toBeVisible();
  });

  test('Sleep mode shows world selector', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);

    const worldSelect = page.locator('#sleepWorldSelect');
    await expect(worldSelect).toBeVisible();
  });
});
