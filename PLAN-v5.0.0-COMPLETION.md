# Plano de Conclusão — PASIV Engine v5.0.0

**Base:** PLANO-v5.0.0.md (original)  
**Objetivo:** Completar o que falta para release v5.0.0

---

## 📊 Status Atual vs Meta

| Item | Estado | Meta |
|------|--------|------|
| YouTube removido | ✅ | ✅ |
| Seed removido | ✅ | ✅ |
| `pasivFile.js` + UI Export/Import | ❌ | ✅ |
| Consolidação duplicatas | ❌ | ✅ |
| Limpeza `window.*` completa | ~40% | 100% |
| Modernização código | ~40% | 100% |
| Testes `.PASIV` | 0 | ≥ 10 |
| Cobertura ≥ 80% | ~36% | ≥ 80% (Playwright) |
| CI/CD | ✅ | ✅ |
| Release v5.0.0 | ❌ | ✅ |

---

## 🎯 Fases Restantes (6 semanas)

### Semana 1: `pasivFile.js` + UI Export/Import
**Entregável:** Persistência `.PASIV` funcional

| Tarefa | Arquivo | Detalhes |
|--------|---------|----------|
| 1.1 | `js/pasivFile.js` | Novo módulo: `collectDirtyState()`, `exportPasivFile()`, `importPasivFile()`, `validatePasivJson()` |
| 1.2 | `index.html` | Nova seção accordion `data-mode="narrative pomodoro sleep free"` com botões Exportar (disabled) / Importar |
| 1.3 | `js/app.js` | Import `pasivFile`, registrar actions `exportPasivFile` / `importPasivFile` no `eventDelegate` |
| 1.4 | `js/state.js` | Adicionar campo `isDirty: false`, função `markDirty()`, `clearDirty()` |
| 1.5 | `js/config.js` | Exportar `DEFAULTS` (objeto plano) para comparação dirty state |

**Testes obrigatórios (criar `tests/pasivFile.test.mjs`):**
- Export gera JSON schema `PASIV-1` válido
- Botão Export desabilitado quando `isDirty === false`
- Export habilita após qualquer alteração (mudar modo, nível, volume, MP3, etc.)
- Import restaura estado + UI corretamente
- Rejeita JSON inválido, extensão errada, schema desconhecido
- `isDirty` reset após export/import bem-sucedido

---

### Semana 2: Consolidação de Funções Duplicadas
**Entregável:** Zero duplicação entre módulos

| Duplicata | Onde está | Ação |
|-----------|-----------|------|
| `updateTimerDisplay` | `ui/pomodoroUI.js` + `modes/pomodoroMode.js` | Mover para `uiUpdater.js` |
| `updateSleepUI` / `updateAlarmTimerDisplay` | `ui/sleepUI.js` + `modes/sleepMode.js` | Consolidar em `ui/sleepUI.js` |
| `getCurrentModeWorlds` | `ui/commonUI.js` + `config.js` | Remover de `commonUI.js` (já feito?) |
| `setSensorStatus` | `sensors.js`, `mechanics.js`, `capture.js` | Manter só em `sensors.js` |
| Indicador de gatilho | `app.js`, `commonUI.js`, `narrativeMode.js` | Consolidar em `uiUpdater.js` / `modeManager` |

---

### Semana 3: Limpeza Completa `window.*`
**Entregável:** Zero lógica de negócio em `window.*`

| Arquivo | Funções a remover do `window` | Substituição |
|---------|------------------------------|--------------|
| `js/app.js` | ~38 funções no `Object.assign(window, {...})` | Remover `Object.assign(window, {...})`; usar imports diretos |
| `js/i18n.js` | `t`, `setLang`, `getLang`, `initI18n` | Import direto: `import { t, setLang } from './i18n.js'` |
| `js/screensaver.js` | `syncScreensaverPomodoroTimer`, `__screensaver` | Mover para `features/pomodoroController.js` |
| `js/sensors.js` | `syncSensorsUI` | Mover para `features/accordionController.js` |
| `js/features/modeController.js` | `setMode`, `startCurrentMode`, `stopCurrentMode`, `getCurrentMode` | Expor via `eventDelegate` actions |
| `js/features/accordionController.js` | `toggleAccordion` | Expor via `eventDelegate` action |
| `js/modes/sleepMode.js` | 5 funções (`setSleepAlarmTime`, etc.) | Expor via `eventDelegate` actions |
| `js/modes/pomodoroMode.js` | 6 funções (`startPomodoro`, etc.) | Expor via `eventDelegate` actions |
| `js/ui/pomodoroUI.js` | 7 funções | Mover para `features/pomodoroController.js` |
| `js/ui/generativeUI.js` | 6 funções | Expor via `eventDelegate` actions |

**Regra:** `window.*` mantém apenas APIs do navegador (`AudioContext`, `showSaveFilePicker`, `addEventListener`, `localStorage`, etc.)

---

### Semana 4: Modernização Código
**Entregável:** Código moderno, sem `var`, sem `console.log`, i18n completo

| Item | Ação | Arquivos |
|------|------|----------|
| `var` → `const`/`let` | `grep -r "var " js/ --include="*.js" | sed/fix` | Todos |
| `.then()` → `async/await` | 6 arquivos pendentes | Ver `grep -r "\.then(" js/` |
| `console.log/warn/error` produção | Remover ou `if (DEBUG)` | Todos |
| Strings hardcoded → `i18n.t()` | `grep -r "[A-Z][a-z].*[A-Z]" js/` | UI modules |
| TypeScript strict | `tsc --noEmit -p tsconfig.pure.json` sem erros | Todos |

---

### Semana 5: Testes Exaustivos + Cobertura ≥ 80%
**Entregável:** Testes cobrindo `.PASIV`, consolidações, regressões

| Categoria | Testes Necessários |
|-----------|-------------------|
| `.PASIV` | 10 testes (export, import, dirty, validação, erros) |
| Áudio | ≥ 10 testes unitários (synth, mp3, stems, effects, world, core) |
| Integração | ≥ 5 testes (modo + `.PASIV`, dirty state, UI sync) |
| E2E Playwright | Fluxos `.PASIV` + regressões consolidações |
| Ausência YouTube/Seed | `grep` automatizado no CI |
| Ausência `window.*` negócio | `grep` automatizado no CI |

**Cobertura alvo:**
- Playwright com `--coverage` para ≥ 80% linhas/branches
- `npm run test:coverage` (Node) para módulos testáveis em Node

---

### Semana 5b: CI/CD + QA Final
**Entregável:** Pipeline verde, release pronto

| Item | Ação |
|------|------|
| GitHub Actions | Lint + Testes Unit + E2E + Coverage check ≥ 80% |
| Pre-commit hook | Rodar `npm test` + `tsc --noEmit` |
| Release v5.0.0 | Tag, GitHub Release, deploy GitHub Pages |

---

## 📅 Cronograma Resumido

| Semana | Foco | Entregável Principal |
|--------|------|----------------------|
| 1 | `.PASIV` module + UI | `js/pasivFile.js` + UI Export/Import funcional |
| 2 | Consolidação duplicatas | Zero funções duplicadas |
| 3 | Limpeza `window.*` | Zero lógica de negócio em `window` |
| 4 | Modernização | `async/await`, `const/let`, i18n, TS strict |
| 5 | Testes + Coverage | ≥ 80% coverage (Playwright), testes `.PASIV` |
| 5b | CI/CD + Release | Pipeline verde, tag v5.0.0, deploy |

---

## ✅ Critérios de Aceitação (Definition of Done)

### Arquitetura
- [ ] `grep "window\." js/` retorna apenas APIs do navegador
- [ ] Nenhuma função duplicada entre módulos
- [ ] `audio.js` dividido em 6 módulos com responsabilidade única
- [ ] `app.js` é apenas bootstrapper
- [ ] Todos `.then()` → `async/await`
- [ ] Zero `var`, zero `console.log` produção
- [ ] Strings visíveis via `i18n.t()`
- [ ] `tsc --noEmit -p tsconfig.pure.json` sem erros

### Persistência `.PASIV`
- [ ] `js/pasivFile.js` existe e exporta funções
- [ ] UI "Exportar / Importar Configurações" visível nos 4 modos
- [ ] Botão Export desabilitado quando `isDirty === false`
- [ ] Arquivo `.PASIV` com schema `PASIV-1` válido
- [ ] Import restaura estado + UI
- [ ] Validação: JSON inválido, extensão errada, schema desconhecido rejeitados

### Testes (Obrigatório)
- [ ] `npm test` passa 100%
- [ ] Playwright coverage ≥ 80% (linhas + branches)
- [ ] Testes `.PASIV`: export, import, dirty, validação, erros
- [ ] `grep` automatizado: zero YouTube, zero seed, zero `window.*` negócio
- [ ] `npm run lint` sem erros
- [ ] CI/CD verde

---

## 🚀 Próximos Passos Imediatos (Esta Semana)

1. **Criar `js/pasivFile.js`** com funções base
2. **Adicionar UI Export/Import** no `index.html`
3. **Integrar no `app.js`** + `eventDelegate.js`
4. **Criar `tests/pasivFile.test.mjs`** com 10 testes
5. **Rodar `npm test`** e confirmar verde

---

*Plano criado em: 2026-11-08*  
*Baseado em: PLANO-v5.0.0.md (original)*