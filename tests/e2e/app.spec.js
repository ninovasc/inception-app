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
    const realErrors = errors.filter(e => !e.includes('deprecated'));
    expect(realErrors).toHaveLength(0);
  });

  test('mode selector shows placeholder initially', async ({ page }) => {
    const selector = page.locator('#modeSelector');
    await expect(selector).toHaveValue('');
    const placeholder = page.locator('#modeSelector option[value=""]');
    await expect(placeholder).toHaveText('Selecione o modo');
  });

  test('start and kick buttons hidden initially', async ({ page }) => {
    await expect(page.locator('#startModeBtn')).toBeHidden();
    await expect(page.locator('#kickBtn')).toBeHidden();
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

  test('accordion closes other panels when opening', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await expect(page.locator('#worldsPanel')).toHaveClass(/open/);
    
    await page.locator("[onclick*='voicePanel']").click();
    await expect(page.locator('#voicePanel')).toHaveClass(/open/);
    await expect(page.locator('#worldsPanel')).not.toHaveClass(/open/);
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
    await expect(page.locator('#pomodoroCyclesUntilLongBreak')).toBeAttached();
  });

  test('Pomodoro has MP3 upload buttons', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#pomodoroActivityMp3')).toBeAttached();
    await expect(page.locator('#pomodoroBreakMp3')).toBeAttached();
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
    
    await page.evaluate(() => window.togglePomodoroConfig());
    await page.waitForTimeout(300);
    const config = page.locator('#pomodoroConfig');
    const maxHeight = await config.evaluate(el => el.style.maxHeight);
    expect(maxHeight).not.toBe('0px');
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

  test('Sleep mode shows world selector', async ({ page }) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const worldSelect = page.locator('#sleepWorldSelect');
    await expect(worldSelect).toBeVisible();
  });

  // ==================== LANGUAGE ====================
  test('Language selector changes language', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    await langSelector.selectOption('en-US');
    await page.waitForTimeout(500);
    await expect(langSelector).toHaveValue('en-US');
  });

  test('Language selector shows all options', async ({ page }) => {
    const langSelector = page.locator('#langSelector');
    const options = await langSelector.locator('option').allTextContents();
    expect(options).toContain('English (US)');
    expect(options).toContain('Español');
    expect(options).toContain('Português (BR)');
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

  // ==================== VOICE ====================
  test('Voice preset select exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const voiceSelect = page.locator('#voicePresetSelect');
    await expect(voiceSelect).toBeVisible();
  });

  test('Voice has parameter sliders', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#micGate')).toBeAttached();
    await expect(page.locator('#micDelaySlider')).toBeAttached();
    await expect(page.locator('#micFb')).toBeAttached();
    await expect(page.locator('#micRev')).toBeAttached();
    await expect(page.locator('#micDw')).toBeAttached();
  });

  // ==================== MECHANICS ====================
  test('Mechanics buttons exist', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('#btnMemCatcher')).toBeAttached();
    await expect(page.locator('#btnAutoKick')).toBeAttached();
    await expect(page.locator('#btnSpatial3D')).toBeAttached();
    await expect(page.locator('#btnLucidTimer')).toBeAttached();
    await expect(page.locator('#btnDeprivation')).toBeAttached();
  });

  // ==================== SENSORS ====================
  test('Sensor buttons exist', async ({ page }) => {
    await expect(page.locator('#btnMic')).toBeVisible();
    await expect(page.locator('#btnMotion')).toBeVisible();
    await expect(page.locator('#btnGps')).toBeVisible();
  });

  // ==================== WORLD SELECT ====================
  test('World select exists in Mundos panel', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const worldSelect = page.locator('#worldSelect');
    await expect(worldSelect).toBeVisible();
  });

  test('World select has 13 options in narrative mode', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const worldSelect = page.locator('#worldSelect');
    const options = await worldSelect.locator('option').count();
    expect(options).toBe(13);
  });

  test('Pomodoro world select has 2 options', async ({ page }) => {
    await page.selectOption('#modeSelector', 'pomodoro');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const worldSelect = page.locator('#worldSelect');
    const options = await worldSelect.locator('option').count();
    expect(options).toBe(2);
  });

  test('Sleep mode has 8 worlds', async ({ page}) => {
    await page.selectOption('#modeSelector', 'sleep');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    const worldSelect = page.locator('#sleepWorldSelect');
    const options = await worldSelect.locator('option').count();
    expect(options).toBe(8);
  });

  // ==================== SLIDERS ====================
  test('Speed slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const slider = page.locator('#sliderSpeed');
    await expect(slider).toBeVisible();
  });

  test('Filter slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const slider = page.locator('#sliderFilter');
    await expect(slider).toBeVisible();
  });

  test('Delay slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const slider = page.locator('#sliderDelay');
    await expect(slider).toBeVisible();
  });

  test('Reverb slider exists', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.locator("[onclick*='worldsPanel']").first().click();
    await page.waitForTimeout(300);
    
    const slider = page.locator('#sliderReverb');
    await expect(slider).toBeVisible();
  });

  // ==================== SEED ====================
  test('Seed panel is hidden', async ({ page }) => {
    const seedPanel = page.locator('.menu-section:has(#dspPanel)');
    await expect(seedPanel).toBeHidden();
  });

  test('Seed textarea exists', async ({ page }) => {
    const textarea = page.locator('#seedInput');
    await expect(textarea).toBeAttached();
  });

  test('Seed copy button exists', async ({ page }) => {
    const btn = page.locator('button:has-text("Copiar")');
    await expect(btn).toBeAttached();
  });

  test('Seed load button exists', async ({ page }) => {
    const btn = page.locator('button:has-text("Carregar")');
    await expect(btn).toBeAttached();
  });

  // ==================== GENERATIVE AI ====================
  test('Generative UI exists in DOM', async ({ page}) => {
    const genUI = page.locator('#generativeUI');
    await expect(genUI).toBeAttached();
  });

  test('Generative toggle exists', async ({ page }) => {
    const toggle = page.locator('#generativeEnabled');
    await expect(toggle).toBeAttached();
  });

  test('Generative variation slider exists', async ({ page }) => {
    const slider = page.locator('#generativeVariation');
    await expect(slider).toBeAttached();
  });

  test('Generative new variation button exists', async ({ page }) => {
    const btn = page.locator('#generativeNew');
    await expect(btn).toBeAttached();
  });

  test('Generative seed input exists', async ({ page}) => {
    const input = page.locator('#generativeSeedInput');
    await expect(input).toBeAttached();
  });

  // ==================== SCREENSAVER ====================
  test('Screensaver is defined', async ({ page}) => {
    const hasScreensaver = await page.evaluate(() => typeof window.__screensaver !== 'undefined');
    expect(hasScreensaver).toBe(true);
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