# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> PASIV Engine E2E Tests >> Pomodoro has play/pause/skip/reset buttons
- Location: tests\e2e\app.spec.js:212:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button:has-text("Reset")')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('button:has-text("Reset")') with timeout 5000ms
  - waiting for locator('button:has-text("Reset")')

```

```yaml
- banner:
  - text: PASIV Engine v4.0.3 PARADO Idioma
  - combobox "Idioma":
    - option "English (US)"
    - option "Español"
    - option "Português (BR)" [selected]
  - button "Ajuda": "?"
- text: Estado do Sonho
- button "Disparar O Chute": O Chute (Piaf + BRAAAM) Queda Livre
- button "Microfone": Mic
- button "Giroscópio": Giro
- button "GPS"
- text: Toque em um sensor para ligar ou desligar. Modo
- combobox "Modo":
  - option "Selecione o modo"
  - option "📖 Narrativo"
  - option "🍅 Pomodoro" [selected]
  - option "🌙 Sono"
  - option "✋ Livre"
- button "Iniciar modo": Iniciar
- text: Mundos ▶
- combobox "Selecionar mundo":
  - option "Atividade" [selected]
  - option "Descanso"
- text: Velocidade 0.65x
- slider: "0.65"
- text: Filtro 18000 Hz
- slider: "18000"
- text: Eco (Delay) 12%
- slider: "0.12"
- text: Reverb 30%
- slider: "0.3"
- text: Voz ▶
- combobox "Preset de voz":
  - option "Personalizado" [selected]
- text: "Cada mundo tem sua própria voz; o Modo Narrativo troca junto. LED: silêncio Gate -30 dB"
- slider [disabled]: "-30"
- text: Delay 0.08s
- slider [disabled]: "0.08"
- text: Feedback 5%
- slider [disabled]: "0.05"
- text: Reverb 10%
- slider [disabled]: "0.1"
- text: Dry/Wet 85/15
- slider [disabled]: "0.15"
- text: Fonte Sonora ▶
- strong: Atividade
- text: ● ATIVO
- combobox:
  - option "Synth" [selected]
  - option "MP3"
  - option "YouTube" [disabled]
- combobox:
  - option "Zimmer Ambient"
  - option "Brass Drone"
  - option "Sub Limbo"
  - option "Glass Choir"
  - option "Binaural Pulse"
  - option "Half Dream Pad" [selected]
  - option "Architect Pluck"
  - option "Collapse Drone"
  - option "Radical Strings"
  - option "Old Souls Piano"
  - option "Combination Blips"
  - option "Mombasa Pulse"
  - option "Pure Idea"
  - option "Nested Pads"
  - option "Station Drone"
  - option "Paradox Loop"
  - option "Time Bell"
  - option "Old Souls Bonus"
- slider [disabled]: "0.2"
- text: 20%
- strong: Descanso
- combobox:
  - option "Synth" [selected]
  - option "MP3"
  - option "YouTube" [disabled]
- combobox:
  - option "Zimmer Ambient"
  - option "Brass Drone"
  - option "Sub Limbo"
  - option "Glass Choir"
  - option "Binaural Pulse"
  - option "Half Dream Pad"
  - option "Architect Pluck" [selected]
  - option "Collapse Drone"
  - option "Radical Strings"
  - option "Old Souls Piano"
  - option "Combination Blips"
  - option "Mombasa Pulse"
  - option "Pure Idea"
  - option "Nested Pads"
  - option "Station Drone"
  - option "Paradox Loop"
  - option "Time Bell"
  - option "Old Souls Bonus"
- slider [disabled]: "0.2"
- text: 20% Pomodoro ▶ Atividade 24:55
- img
- text: 0/4
- button "Pausar" [pressed]
- button "Pular Fase"
- button "Reiniciar"
- text: Configuração ▶ Duração Atividade 25 min
- slider: "25"
- text: Duração Pausa Curta 5 min
- slider: "5"
- text: Duração Pausa Longa 15 min
- slider: "15"
- text: Ciclos Até Pausa Longa 4
- slider: "4"
- text: MP3 Atividade [Selecionar MP3] 📁 MP3 Pausa [Selecionar MP3] 📁
```

# Test source

```ts
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
  137 |       await expect(panels.nth(i)).toBeHidden();
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
> 219 |     await expect(page.locator('button:has-text("Reset")')).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
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
  238 |     await expect(slider).toBeVisible();
  239 |   });
  240 | 
  241 |   test('Language selector changes language', async ({ page }) => {
  242 |     const langSelector = page.locator('#langSelector');
  243 |     await langSelector.selectOption('en-US');
  244 |     
  245 |     // Check if some text changed to English
  246 |     await page.waitForTimeout(500);
  247 |     const status = page.locator('#topStatus');
  248 |     // Just verify the selector changed
  249 |     await expect(langSelector).toHaveValue('en-US');
  250 |   });
  251 | 
  252 |   test('No console errors on page load', async ({ page }) => {
  253 |     const errors = [];
  254 |     page.on('console', msg => {
  255 |       if (msg.type() === 'error') errors.push(msg.text());
  256 |     });
  257 |     page.on('pageerror', e => errors.push(e.message));
  258 |     
  259 |     await page.goto('/');
  260 |     await page.waitForSelector('text=PASIV', { timeout: 30000 });
  261 |     await page.waitForTimeout(2000);
  262 |     
  263 |     // Filter out deprecation warnings
  264 |     const realErrors = errors.filter(e => !e.includes('deprecated'));
  265 |     expect(realErrors).toHaveLength(0);
  266 |   });
  267 | 
  268 |   test('No console errors on mode switch', async ({ page }) => {
  269 |     const errors = [];
  270 |     page.on('console', msg => {
  271 |       if (msg.type() === 'error') errors.push(msg.text());
  272 |     });
  273 |     page.on('pageerror', e => errors.push(e.message));
  274 |     
  275 |     await page.selectOption('#modeSelector', 'pomodoro');
  276 |     await page.waitForFunction(() => document.getElementById('modeSelector').value === 'pomodoro', { timeout: 5000 });
  277 |     await page.waitForTimeout(500);
  278 |     await page.waitForTimeout(1000);
  279 |     
  280 |     const realErrors = errors.filter(e => !e.includes('deprecated'));
  281 |     expect(realErrors).toHaveLength(0);
  282 |   });
  283 | });
```