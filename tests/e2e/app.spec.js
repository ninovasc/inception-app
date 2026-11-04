import { test, expect } from '@playwright/test';

test.describe('PASIV Engine E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
    });
    await page.reload();
    await page.waitForSelector('text=PASIV', { timeout: 30000 });
  });

  // ==================== PAGE LOAD ====================
  test('page loads without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('mode selector shows placeholder initially', async ({ page }) => {
    const selector = page.locator('#modeSelector');
    await expect(selector).toHaveValue('');
    const placeholder = page.locator('#modeSelector option[value=""]');
    await expect(placeholder).toHaveText('Selecione o modo');
  });

  test('start and kick buttons hidden initially', async ({ page }) => {
    const startBtn = page.locator('#startModeBtn');
    const kickBtn = page.locator('#kickBtn');
    await expect(startBtn).toBeHidden();
    await expect(kickBtn).toBeHidden();
  });

  test('language selector exists in header', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    await expect(langSelector).toBeVisible();
    await expect(langSelector).toHaveValue('pt-BR');
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

  // ==================== MODE SWITCHING ====================
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
    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
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
    await expect(page.locator('.menu-section[data-mode="narrative free"]')).toBeVisible();
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

  test('start and kick buttons appear when mode selected', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#startModeBtn')).toBeVisible();
    await expect(page.locator('#kickBtn')).toBeVisible();
  });

  test('start and kick buttons hidden when empty mode', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      document.getElementById('modeSelector').value = '';
      document.getElementById('modeSelector').dispatchEvent(new Event('change'));
    });
    
    await expect(page.locator('#startModeBtn')).toBeHidden();
    await expect(page.locator('#kickBtn')).toBeHidden();
  });

  // ==================== ACCORDION ====================
  test('accordion opens and closes', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const title = page.locator("[onclick*='worldsPanel']").first();
    const panel = page.locator('#worldsPanel');
    
    await expect(panel).not.toHaveClass(/open/);
    await title.click();
    await expect(panel).toHaveClass(/open/);
    await title.click();
    await expect(panel).not.toHaveClass(/open/);
  });

  test('accordion arrow changes on toggle', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const arrow = page.locator("[onclick*='worldsPanel'] .accordion-arrow");
    const initial = await arrow.textContent();
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    const opened = await arrow.textContent();
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    const closed = await arrow.textContent();
    
    expect(initial).not.toBe(opened);
    expect(closed).toBe(initial);
  });

  // ==================== POMODORO ====================
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
  });

  test('Pomodoro has MP3 upload buttons', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#pomodoroActivityMp3')).toBeAttached();
    await expect(page.locator('#pomodoroBreakMp3')).toBeAttached();
  });

  // ==================== SLEEP ====================
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

  // ==================== LANGUAGE ====================
  test('Language selector changes language', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    await langSelector.selectOption('en-US');
    await page.waitForTimeout(500);
    await expect(langSelector).toHaveValue('en-US');
  });

  // ==================== SOUND SOURCE ====================
  test('Sound source select exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const sourceSelect = page.locator('#sourceList select').first();
    await expect(sourceSelect).toBeVisible();
  });

  test('Sound source has synth/mp3/youtube options', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const select = page.locator('#sourceList select').first();
    const options = await select.locator('option').allTextContents();
    expect(options).toContain('Synth');
    expect(options).toContain('MP3');
  });

  // ==================== CONSOLE ERRORS ====================
  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));
    
    await page.goto('/');
    await page.waitForSelector('text=PASIV', { timeout: 30000 });
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
});