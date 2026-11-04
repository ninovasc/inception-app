# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> PASIV Engine E2E Tests >> returning to empty mode hides all panels
- Location: tests\e2e\app.spec.js:125:3

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('.menu-section[data-mode]').first()
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" locator('.menu-section[data-mode]').first() with timeout 5000ms
  - waiting for locator('.menu-section[data-mode]').first()
    13 × locator resolved to <div class="menu-section" data-mode="narrative pomodoro sleep free">…</div>
       - unexpected value "visible"

```

```yaml
- text: Mundos ▶
- combobox "Selecionar mundo":
  - option "Half Remembered Dream" [selected]
  - option "We Built Our Own World"
  - option "Dream Is Collapsing"
  - option "Radical Notion"
  - option "Old Souls"
  - option "528491"
  - option "Mombasa"
  - option "One Simple Idea"
  - option "Dream Within a Dream"
  - option "Waiting for a Train"
  - option "Paradox"
  - option "Time"
  - option "Bonus Track"
- text: Velocidade 0.65x
- slider: "0.35"
- text: Filtro 18000 Hz
- slider: "18000"
- text: Eco (Delay) 12%
- slider: "0.12"
- text: Reverb 30%
- slider: "0.3"
```

# Test source

```ts
  37  |   test('start and kick buttons hidden initially', async ({ page }) => {
  38  |     const startBtn = page.locator('#startModeBtn');
  39  |     const kickBtn = page.locator('#kickBtn');
  40  |     await expect(startBtn).toBeHidden();
  41  |     await expect(kickBtn).toBeHidden();
  42  |   });
  43  | 
  44  |   test('language selector exists in header', async ({ page }) => {
  45  |     const langSelector = page.locator('#langSelector');
  46  |     await expect(langSelector).toBeVisible();
  47  |     await expect(langSelector).toHaveValue('pt-BR');
  48  |   });
  49  | 
  50  |   test('sensors visible initially', async ({ page }) => {
  51  |     const micBtn = page.locator('#btnMic');
  52  |     const motionBtn = page.locator('#btnMotion');
  53  |     const gpsBtn = page.locator('#btnGps');
  54  |     await expect(micBtn).toBeVisible();
  55  |     await expect(motionBtn).toBeVisible();
  56  |     await expect(gpsBtn).toBeVisible();
  57  |   });
  58  | 
  59  |   test('no accordion panels visible initially', async ({ page }) => {
  60  |     const panels = ['.menu-section[data-mode]'];
  61  |     for (const sel of panels) {
  62  |       const elements = page.locator(sel);
  63  |       const count = await elements.count();
  64  |       for (let i = 0; i < count; i++) {
  65  |         await expect(elements.nth(i)).toBeHidden();
  66  |       }
  67  |     }
  68  |   });
  69  | 
  70  |   test('selecting Narrative mode shows correct panels', async ({ page }) => {
  71  |     await page.selectOption('#modeSelector', 'narrative');
  72  |     await page.waitForSelector('text=Mundos', { timeout: 5000 });
  73  |     
  74  |     // Mundos should be visible
  75  |     await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
  76  |     // Pomodoro should be hidden
  77  |     await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
  78  |     // Sleep should be hidden
  79  |     await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
  80  |   });
  81  | 
  82  |   test('selecting Pomodoro mode shows correct panels', async ({ page }) => {
  83  |     await page.selectOption('#modeSelector', 'pomodoro');
  84  |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
  85  |     await page.waitForTimeout(500);
  86  |     
  87  |     // Pomodoro should be visible
  88  |     await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeVisible();
  89  |     // Mundos should be visible
  90  |     await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
  91  |     // Sleep should be hidden
  92  |     await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
  93  |     // Trigger should be hidden
  94  |     await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  95  |   });
  96  | 
  97  |   test('selecting Sleep mode shows correct panels', async ({ page }) => {
  98  |     await page.selectOption('#modeSelector', 'sleep');
  99  |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
  100 |     await page.waitForTimeout(500);
  101 |     
  102 |     // Sleep should be visible
  103 |     await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeVisible();
  104 |     // Pomodoro should be hidden
  105 |     await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
  106 |   });
  107 | 
  108 |   test('selecting Free mode shows correct panels', async ({ page }) => {
  109 |     await page.selectOption('#modeSelector', 'free');
  110 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'free', { timeout: 5000 });
  111 |     await page.waitForTimeout(500);
  112 |     
  113 |     // Mundos should be visible
  114 |     await expect(page.locator('#worldsPanel').locator('..')).toBeVisible();
  115 |     // Mechanics should be visible
  116 |     await expect(page.locator('.menu-section[data-mode="narrative free"]')).toBeVisible();
  117 |     // Pomodoro should be hidden
  118 |     await expect(page.locator('.menu-section[data-mode="pomodoro"]')).toBeHidden();
  119 |     // Sleep should be hidden
  120 |     await expect(page.locator('.menu-section[data-mode="sleep"]')).toBeHidden();
  121 |     // Triggers should be hidden
  122 |     await expect(page.locator('.menu-section[data-mode="narrative"]')).toBeHidden();
  123 |   });
  124 | 
  125 |   test('returning to empty mode hides all panels', async ({ page }) => {
  126 |     await page.selectOption('#modeSelector', 'narrative');
  127 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
  128 |     await page.waitForTimeout(500);
  129 |     
  130 |     // Select empty option
  131 |     await page.selectOption('#modeSelector', '');
  132 |     
  133 |     // All panels should be hidden
  134 |     const panels = page.locator('.menu-section[data-mode]');
  135 |     const count = await panels.count();
  136 |     for (let i = 0; i < count; i++) {
> 137 |       await expect(panels.nth(i)).toBeHidden();
      |                                   ^ Error: expect(locator).toBeHidden() failed
  138 |     }
  139 |   });
  140 | 
  141 |   test('start and kick buttons appear when mode selected', async ({ page }) => {
  142 |     await page.selectOption('#modeSelector', 'narrative');
  143 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
  144 |     await page.waitForTimeout(500);
  145 |     
  146 |     const startBtn = page.locator('#startModeBtn');
  147 |     const kickBtn = page.locator('#kickBtn');
  148 |     await expect(startBtn).toBeVisible();
  149 |     await expect(kickBtn).toBeVisible();
  150 |   });
  151 | 
  152 |   test('start and kick buttons hidden when empty mode', async ({ page }) => {
  153 |     await page.selectOption('#modeSelector', 'narrative');
  154 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
  155 |     await page.waitForTimeout(500);
  156 |     
  157 |     await page.selectOption('#modeSelector', '');
  158 |     
  159 |     const startBtn = page.locator('#startModeBtn');
  160 |     const kickBtn = page.locator('#kickBtn');
  161 |     await expect(startBtn).toBeHidden();
  162 |     await expect(kickBtn).toBeHidden();
  163 |   });
  164 | 
  165 |   test('accordion opens and closes', async ({ page }) => {
  166 |     await page.selectOption('#modeSelector', 'narrative');
  167 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
  168 |     await page.waitForTimeout(500);
  169 |     
  170 |     const title = page.locator("[onclick*='worldsPanel']").first();
  171 |     const panel = page.locator('#worldsPanel');
  172 |     
  173 |     // Initially closed
  174 |     await expect(panel).not.toHaveClass(/open/);
  175 |     
  176 |     // Click to open
  177 |     await title.click();
  178 |     await expect(panel).toHaveClass(/open/);
  179 |     
  180 |     // Click to close
  181 |     await title.click();
  182 |     await expect(panel).not.toHaveClass(/open/);
  183 |   });
  184 | 
  185 |   test('accordion arrow changes on toggle', async ({ page }) => {
  186 |     await page.selectOption('#modeSelector', 'narrative');
  187 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'narrative', { timeout: 5000 });
  188 |     await page.waitForTimeout(500);
  189 |     
  190 |     const arrow = page.locator("[onclick*='worldsPanel'] .accordion-arrow");
  191 |     const initial = await arrow.textContent();
  192 |     
  193 |     await page.locator("[onclick*='worldsPanel']").first().click();
  194 |     const opened = await arrow.textContent();
  195 |     
  196 |     await page.locator("[onclick*='worldsPanel']").first().click();
  197 |     const closed = await arrow.textContent();
  198 |     
  199 |     expect(initial).not.toBe(opened);
  200 |     expect(closed).toBe(initial);
  201 |   });
  202 | 
  203 |   test('Pomodoro timer displays 25:00', async ({ page }) => {
  204 |     await page.selectOption('#modeSelector', 'pomodoro');
  205 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
  206 |     await page.waitForTimeout(500);
  207 |     
  208 |     const timer = page.locator('#pomodoroTimer');
  209 |     await expect(timer).toHaveText('25:00');
  210 |   });
  211 | 
  212 |   test('Pomodoro has play/pause/skip/reset buttons', async ({ page }) => {
  213 |     await page.selectOption('#modeSelector', 'pomodoro');
  214 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
  215 |     await page.waitForTimeout(500);
  216 |     
  217 |     await expect(page.locator('#pomodoroPlayPause')).toBeVisible();
  218 |     await expect(page.locator('button:has-text("Pular")')).toBeVisible();
  219 |     await expect(page.locator('button:has-text("Reset")')).toBeVisible();
  220 |   });
  221 | 
  222 |   test('Sleep mode shows alarm time input', async ({ page }) => {
  223 |     await page.selectOption('#modeSelector', 'sleep');
  224 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
  225 |     await page.waitForTimeout(500);
  226 |     
  227 |     const alarmInput = page.locator('#sleepAlarmTime');
  228 |     await expect(alarmInput).toBeVisible();
  229 |     await expect(alarmInput).toHaveValue('07:00');
  230 |   });
  231 | 
  232 |   test('Sleep mode shows wake window slider', async ({ page }) => {
  233 |     await page.selectOption('#modeSelector', 'sleep');
  234 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'sleep', { timeout: 5000 });
  235 |     await page.waitForTimeout(500);
  236 |     
  237 |     const slider = page.locator('#sleepWakeWindow');
```