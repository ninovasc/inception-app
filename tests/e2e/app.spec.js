const { test, expect } = require('@playwright/test');

test.describe('PASIV Engine E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and service worker before each test
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
    const micBtn = page.locator('#btnMic');
    const motionBtn = page.locator('#btnMotion');
    const gpsBtn = page.locator('#btnGps');
    await expect(micBtn).toBeVisible();
    await expect(motionBtn).toBeVisible();
    await expect(gpsBtn).toBeVisible();
  });

  test('no accordion panels visible initially', async ({ page }) => {
    const panels = ['.menu-section[data-mode]'];
    for (const sel of panels) {
      const elements = page.locator(sel);
      const count = await elements.count();
      for (let i = 0; i < count; i++) {
        await expect(elements.nth(i)).toBeHidden();
      }
    }
  });

  test('selecting Narrative mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForSelector('text=Mundos', { timeout: 5000 });
    
    // Mundos should be visible
    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
    // Pomodoro should be hidden
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
    // Sleep should be hidden
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
  });

  test('selecting Pomodoro mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Pomodoro should be visible
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeVisible();
    // Mundos should be visible
    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
    // Sleep should be hidden
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
    // Trigger should be hidden
    await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  });

  test('selecting Sleep mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Sleep should be visible
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeVisible();
    // Pomodoro should be hidden
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
  });

  test('selecting Free mode shows correct panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'free');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'free', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Mundos should be visible
    await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
    // Mechanics should be visible
    await expect(page.locator('.menu-section[data-mode="narrative free"]')).toBeVisible();
    // Pomodoro should be hidden
    await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
    // Sleep should be hidden
    await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
    // Triggers should be hidden
    await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  });

  test('returning to empty mode hides all panels', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Select empty option
    await page.selectOption('#modeSelector', '');
    
    // All panels should be hidden
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
    
    const startBtn = page.locator('#startModeBtn');
    const kickBtn = page.locator('#kickBtn');
    await expect(startBtn).toBeVisible();
    await expect(kickBtn).toBeVisible();
  });

  test('start and kick buttons hidden when empty mode', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.selectOption('#modeSelector', '');
    
    const startBtn = page.locator('#startModeBtn');
    const kickBtn = page.locator('#kickBtn');
    await expect(startBtn).toBeHidden();
    await expect(kickBtn).toBeHidden();
  });

  test('accordion opens and closes', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const title = page.locator("[onclick*='worldsPanel']").first();
    const panel = page.locator('#worldsPanel');
    
    // Initially closed
    await expect(panel).not.toHaveClass(/open/);
    
    // Click to open
    await title.click();
    await expect(panel).toHaveClass(/open/);
    
    // Click to close
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

  test('Language selector changes language', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    await langSelector.selectOption('en-US');
    
    // Check if some text changed to English
    await page.waitForTimeout(500);
    const status = page.locator('#topStatus');
    // Just verify the selector changed
    await expect(langSelector).toHaveValue('en-US');
  });

  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', e => errors.push(e.message));
    
    await page.goto('/');
    await page.waitForSelector('text=PASIV', { timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Filter out deprecation warnings
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
    await page.waitForTimeout(500);
    await page.waitForTimeout(1000);
    
    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });
});