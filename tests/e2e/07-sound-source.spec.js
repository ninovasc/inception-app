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

  test('Sound source MP3 selection updates state.worldSourceType', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const select = page.locator('#sourceList select').first();
    await select.selectOption('mp3');
    await page.waitForTimeout(500);

    // Verify state was updated
    const worldSourceType = await page.evaluate(() => window.__getAppState()?.worldSourceType);
    expect(worldSourceType).toBeDefined();
    expect(worldSourceType[0]).toBe('mp3');
  });

  test('Sound source synth selection updates state.worldSourceType back to synth', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    // First select MP3
    const select = page.locator('#sourceList select').first();
    await select.selectOption('mp3');
    await page.waitForTimeout(500);

    // Then select synth
    await select.selectOption('synth');
    await page.waitForTimeout(500);

    // Verify state was updated back to synth
    const worldSourceType = await page.evaluate(() => window.__getAppState()?.worldSourceType);
    expect(worldSourceType).toBeDefined();
    expect(worldSourceType[0]).toBe('synth');
  });

  test('Sound source synth type dropdown updates state.worldSynth', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    // First make sure synth is selected
    const select = page.locator('#sourceList select').first();
    await select.selectOption('synth');
    await page.waitForTimeout(500);

    // Find the synth type dropdown (second select)
    const synthSelect = page.locator('#sourceList select').nth(1);
    await expect(synthSelect).toBeVisible();

    // Get initial synth value
    const initialSynth = await page.evaluate(() => window.__getAppState()?.worldSynth?.[0]);
    
    // Change synth type
    await synthSelect.selectOption('1'); // Select second synth type
    await page.waitForTimeout(500);

    // Verify state was updated
    const worldSynth = await page.evaluate(() => window.__getAppState()?.worldSynth);
    expect(worldSynth).toBeDefined();
    // The test might fail if inline handlers don't work - this will tell us
    expect(worldSynth[0]).toBe(1);
  });

  test('Sound source volume slider updates state.worldVolume', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Find the volume slider for world 0
    const volumeSlider = page.locator('#sourceList input[type="range"]').first();
    await expect(volumeSlider).toBeVisible();

    // Change volume
    await volumeSlider.fill('0.5');
    await volumeSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Verify state was updated
    const worldVolume = await page.evaluate(() => window.__getAppState()?.worldVolume);
    expect(worldVolume).toBeDefined();
    expect(worldVolume[0]).toBeCloseTo(0.5, 1);
  });
});
