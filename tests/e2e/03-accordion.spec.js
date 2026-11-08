import { test, expect } from '@playwright/test';

test.describe('PASIV Engine - Accordion', () => {
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

  test('accordion opens and closes', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    const title = page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first();
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

    const arrow = page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel'] .accordion-arrow");
    const initial = await arrow.textContent();

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    const opened = await arrow.textContent();

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    const closed = await arrow.textContent();

    expect(initial).not.toBe(opened);
    expect(closed).toBe(initial);
  });

  test('accordion closes other panels when opening', async ({ page }) => {
    await page.selectOption('#modeSelector', 'narrative');
    await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.locator("[data-action='toggleAccordion'][data-arg='worldsPanel']").first().click();
    await expect(page.locator('#worldsPanel')).toHaveClass(/open/);

    await page.locator("[data-action='toggleAccordion'][data-arg='voicePanel']").click();
    await expect(page.locator('#voicePanel')).toHaveClass(/open/);
    await expect(page.locator('#worldsPanel')).not.toHaveClass(/open/);
  });
});
