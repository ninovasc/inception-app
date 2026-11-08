import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Pomodoro', () => {
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

  test('Pomodoro timer displays 25:00', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    const timer = page.locator('#pomodoroTimer');
    await expect(timer).toHaveText('25:00');
  });

  test('Pomodoro has play/pause/skip/reset buttons', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#pomodoroPlayPause')).toBeVisible();
    await expect(page.locator('button:has-text("Pular")')).toBeVisible();
    await expect(page.locator('button:has-text("Reiniciar")')).toBeVisible();
  });

  test('Pomodoro has config panel', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#pomodoroConfig')).toBeAttached();
    await expect(page.locator('#pomodoroActivityDuration')).toBeAttached();
    await expect(page.locator('#pomodoroShortBreakDuration')).toBeAttached();
    await expect(page.locator('#pomodoroLongBreakDuration')).toBeAttached();
    await expect(page.locator('#pomodoroCyclesUntilLongBreak')).toBeAttached();
  });

  test('Pomodoro config has no MP3 upload buttons', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#pomodoroActivityMp3')).toHaveCount(0);
    await expect(page.locator('#pomodoroBreakMp3')).toHaveCount(0);
  });

  test('Pomodoro phase label shows Atividade', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    const phaseLabel = page.locator('#pomodoroPhaseLabel');
    await expect(phaseLabel).toHaveText('Atividade');
  });

  test('Pomodoro config toggle works', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const el = document.querySelector("[data-action='togglePomodoroConfig']");
      if (el) el.click();
    });
    await page.waitForTimeout(300);
    const config = page.locator('#pomodoroConfig');
    const maxHeight = await config.evaluate(el => el.style.maxHeight);
    expect(maxHeight).not.toBe('0px');
  });
});
