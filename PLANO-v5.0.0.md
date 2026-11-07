# Plano de Implementação — PASIV Engine v5.0.0 (Revisado)

## 1. Resumo Executivo

O escopo da versão 5.0.0 é limitado a:

| Incluído | Não incluído |
|----------|--------------|
| Remoção completa do YouTube | Qualquer nova funcionalidade (biofeedback, áudio espacial, produtividade, diário, acessibilidade, etc.) |
| Remoção completa do sistema de seed (string base64) | Novas funcionalidades do Pilar C |
| Substituição por exportar/importar JSON em arquivo `.PASIV` | — |
| Limpeza arquitetural: `window.*`, funções duplicadas, módulos monolíticos, padrões desatualizados | — |
| Robustecimento exaustivo de testes (existentes + novos) | — |

**Regra de ouro:** toda alteração de código impacta os testes. Os testes existentes devem ser atualizados e novos testes devem ser criados para cada funcionalidade modificada ou criada.

---

## 2. Situação Atual (Benchmark v4.0.3)

| Item | Estado |
|------|--------|
| Versão | v4.0.3 |
| Arquitetura | ES Modules, mas com poluição de `window.*` (~60 funções expostas) |
| Testes | 109/109 passando (seed, migração v2→v3, decideWorld, computeAnchors) |
| YouTube | Código preservado em `js/youtube.js`, desabilitado via `YOUTUBE_ENABLED = false` |
| Seed | `js/seed.js` serializa estado em string base64 compartilhável |
| Modos | Narrativo, Pomodoro, Sono, Livre |
| PWA | Sim (manifest, service worker, ícones, splash) |

---

## 3. O Que Será Removido (Estirpado)

### 3.1 YouTube — remoção completa

| Arquivo | Ação |
|---------|------|
| `js/youtube.js` | **Deletar arquivo inteiro** |
| `js/app.js` | Remover import `* as yt`, funções `startYouTube`, `stopYouTube`, `startYouTubeWorld`, `stopYouTubeWorld`, `stopAllYouTubeWorld`, `setYouTubeRate`, `loadYouTube`, `setYouTubeVolume`, `YOUTUBE_ENABLED` |
| `js/config.js` | Remover constante `YOUTUBE_ENABLED` e normalização `youtube` → `synth` em `normalizeSourceType` |
| `js/state.js` | Remover campo `worldSources.youtube` |
| `js/audio/world.js` | Remover chamada `window.setYouTubeVolume` |
| `js/audio/synth.js` | Remover chamada `window.setYouTubeRate` |
| `index.html` | Remover 13 `<div id="ytPlayer0..12">`, remover opção YouTube da UI, remover menção no help modal |
| `tests/` | Remover testes que fazem referência a YouTube |

### 3.2 Sistema de seed — remoção completa

| Item | Arquivo | Ação |
|------|---------|------|
| `encodeState`, `decodeState`, `generateFullSeed`, `copySeed`, `applySeed`, `buildSeed` | `js/seed.js` | **Deletar arquivo inteiro** |
| Botões "Copiar" / "Carregar" da seed | `index.html` | Remover da seção "Código do Sonho" |
| Área de texto `#seedInput` | `index.html` | Remover |
| Referências a `window.generateFullSeed`, `window.renderTriggerList`, `window.syncSourceRow`, `window.syncMechanicsUI`, `window.autoResizeSeed` | `audio.js`, `audio/synth.js`, `audio/world.js`, `audio/stems.js`, `capture.js`, `mechanics.js`, `sensors.js`, `modes/narrativeMode.js`, `ui/generativeUI.js`, `features/triggerController.js` | Remover chamadas condicionais |

### 3.3 Poluição de `window.*` — remoção de lógica de negócio

| Arquivo | Funções a remover do `window` |
|---------|------------------------------|
| `js/app.js` | ~38 funções (dentro do `Object.assign(window, {...})` + diretas) |
| `js/i18n.js` | `t`, `setLang`, `getLang`, `initI18n` |
| `js/screensaver.js` | `syncScreensaverPomodoroTimer`, `__screensaver` |
| `js/sensors.js` | `syncSensorsUI` |
| `js/features/modeController.js` | `setMode`, `startCurrentMode`, `stopCurrentMode`, `getCurrentMode` |
| `js/features/accordionController.js` | `toggleAccordion` |
| `js/modes/sleepMode.js` | `setSleepAlarmTime`, `setSleepWakeWindow`, `setSleepWakeWorld`, `cancelSleepAlarm`, `testSleepAlarm` |
| `js/modes/pomodoroMode.js` | `startPomodoro`, `pausePomodoro`, `resumePomodoro`, `skipPomodoroPhase`, `resetPomodoro`, `setPomodoroDurations` |
| `js/ui/pomodoroUI.js` | `updatePomodoroActivityDuration`, `updatePomodoroShortBreakDuration`, `updatePomodoroLongBreakDuration`, `updatePomodoroCyclesUntilLongBreak`, `loadPomodoroActivityMp3`, `loadPomodoroBreakMp3`, `togglePomodoroConfig` |
| `js/ui/generativeUI.js` | `applyGenerativeSeed` (2×), `toggleGenerative`, `updateGenerativeVariation`, `generateNewVariation`, `saveGenerativeVariation`, `resetGenerative` |
| `js/eventDelegate.js` | `registerAction`, `getAction` (avaliar se ainda necessário externamente) |

**Permanece apenas:** APIs do navegador (`window.AudioContext`, `window.showSaveFilePicker`, `window.addEventListener`, etc.) — não são poluição de lógica de negócio.

---

## 4. O Que Será Criado (Persistência `.PASIV`)

### 4.1 Novo módulo: `js/pasivFile.js`

Responsabilidades:
- Coletar estado não-padrão do `state` (detecção de `isDirty` comparando com defaults do `config.js`).
- Serializar como JSON com schema `PASIV-1`.
- Exportar arquivo `.PASIV` via File System Access API (`showSaveFilePicker`) com fallback para download de blob.
- Importar arquivo `.PASIV`, validar estrutura, aplicar no `state` e sincronizar UI.
- Gerenciar estado `isDirty` (habilitar/desabilitar botão Exportar).

### 4.2 Nova seção UI: "Exportar / Importar Configurações"

Local: painel visível em **todos os 4 modos** (`data-mode="narrative pomodoro sleep free"`).

```html
<div class="menu-section" data-mode="narrative pomodoro sleep free">
  <div class="menu-title" data-action="toggleAccordion" data-arg="pasivConfigPanel">
    <span>Exportar / Importar Configurações</span>
    <span class="accordion-arrow">▶</span>
  </div>
  <div id="pasivConfigPanel" class="accordion-panel">
    <button id="btnExportPasiv" data-action="exportPasivFile" disabled>Exportar</button>
    <button id="btnImportPasiv" data-action="importPasivFile">Importar</button>
  </div>
</div>
```

Regras:
- **Exportar**: desabilitado por padrão; habilita apenas quando `isDirty === true`.
- **Importar**: sempre habilitado.

### 4.3 Mudanças no `app.js` e `eventDelegate.js`

- Registrar actions `exportPasivFile` e `importPasivFile`.
- Importar funções do `pasivFile.js` diretamente.
- Remover `Object.assign(window, {...})` e todas as atribuições `window.*`.

---

## 5. Limpeza Arquitetural Adicional

### 5.1 Consolidar funções duplicadas

| Função duplicada | Onde está | Ação |
|------------------|-----------|------|
| `updateTimerDisplay` | `ui/pomodoroUI.js` + `modes/pomodoroMode.js` | Consolidar em `uiUpdater.js` / `modeManager` |
| `updateSleepUI` + `updateAlarmTimerDisplay` | `ui/sleepUI.js` + `modes/sleepMode.js` | Consolidar em `sleepUI.js` |
| `getCurrentModeWorlds` | `ui/commonUI.js` + `config.js` | Manter apenas em `config.js` |
| `setSensorStatus` | `sensors.js`, `mechanics.js`, `capture.js` | Manter apenas em `sensors.js` |
| Indicador de gatilho | `app.js`, `commonUI.js`, `narrativeMode.js` | Consolidar em `modeManager/uiUpdater` |

### 5.2 Dividir módulos monolíticos

| Módulo atual | Divisão sugerida |
|--------------|------------------|
| `js/audio.js` | `AudioEngine`, `SynthEngine`, `Mp3Player`, `CaptureManager`, `EffectsManager`, `VolumeManager` |
| `js/app.js` | `bootstrapper.js` + feature modules já existentes em `features/` |

### 5.3 Modernizar padrões de código

- Converter `.then()` → `async/await` (6 arquivos pendentes).
- Substituir `var` → `const`/`let`.
- Remover `console.log`/`warn`/`error` de produção.
- Migrar strings hardcoded para `i18n.js`.
- TypeScript estrito em todos os módulos (`tsconfig.pure.json` já existe).

---

## 6. Plano de Execução por Fases

| Fase | Atividade | Escopo | Impacto nos testes |
|------|-----------|--------|-------------------|
| **1** | Remover YouTube completamente | `youtube.js`, `app.js`, `config.js`, `state.js`, `audio/world.js`, `audio/synth.js`, `index.html` | Atualizar testes que referenciam YouTube; remover obsoletos |
| **2** | Remover sistema de seed completamente | `seed.js`, `index.html` (botões + textarea), todas as chamadas `window.*` à seed | Remover testes de seed existentes; criar testes de validação de ausência |
| **3** | Criar `pasivFile.js` + UI Exportar/Importar | Novo módulo, novo HTML, `app.js`, `eventDelegate.js` | Criar testes exaustivos: exportar, importar, dirty state, JSON inválido, arquivo sem extensão `.PASIV` |
| **4** | Consolidar funções duplicadas | `timer`, `sleep`, `triggers`, `setSensorStatus` | Atualizar testes que cobrem funções consolidadas |
| **5** | Dividir `audio.js` | Módulos focados | Criar testes unitários para cada sub-módulo de áudio |
| **6** | Dividir `app.js` | Bootstrapper + features | Testes de integração de boot |
| **7** | Modernizar código | `async/await`, `const`/`let`, sem `console.log`, i18n | Testes de regressão após cada mudança |
| **8** | TypeScript estrito | Todos os módulos | Testes de tipos |
| **9** | Robustecimento exaustivo de testes | Sessão dedicada (ver seção 7) | Cobertura ≥ 80%, testes de borda, integração E2E |
| **10** | CI/CD | GitHub Actions lint + testes | Pipeline verde |
| **11** | QA + documentação + release v5.0.0 | — | — |

---

## 7. Sessão Dedicada — Robustecimento Exaustivo de Testes

### 7.1 Princípio

**Nenhuma alteração de código é considerada concluída sem que seus testes correspondentes estejam atualizados ou criados.** Isso se aplica a:

- Remoção de código (YouTube, seed): testes que cobriam essas funcionalidades devem ser removidos ou substituídos por testes que validam a ausência.
- Novo código (`.PASIV`): testes novos obrigatórios.
- Refatoração (consolidação, divisão de módulos): testes existentes devem continuar passando; adicionar testes de regressão.

### 7.2 Testes Existentes a Atualizar

| Teste atual | O que cobre | Ação necessária |
|-------------|-------------|-----------------|
| `tests/unit.test.mjs` | config helpers (`normalizeSourceType`, `getCurrentModeWorlds`, `normalizeWorldTriggers`) | Remover referências a YouTube em `normalizeSourceType`; manter outros |
| `tests/runtime.test.mjs` | — | Revisar se referencia seed ou YouTube; atualizar ou remover |
| `tests/comprehensive.test.mjs` | — | Revisar referências a seed/YouTube |
| `scripts/test-seed.mjs` | 109 testes de seed (encode/decode, migração v2→v3, decideWorld, computeAnchors) | **Remover completamente** — substituído por testes de `.PASIV` |
| `tests/e2e/app.spec.js` | E2E Playwright | Revisar fluxos que usam seed ou YouTube; atualizar |

### 7.3 Novos Testes Obrigatórios para `.PASIV`

| Teste | Descrição |
|-------|-----------|
| `exportPasivFile gera JSON válido` | Verifica que o arquivo exportado tem schema `PASIV-1` e campos obrigatórios |
| `exportPasivFile usa extensão .PASIV` | Verifica nome do arquivo com extensão correta |
| `exportPasivFile desabilitado quando sem alterações` | `isDirty === false` → botão desabilitado |
| `exportPasivFile habilitado após alteração` | Qualquer mudança no estado (incluindo seleção de MP3) → botão habilitado |
| `importPasivFile aplica configurações` | Carrega arquivo `.PASIV` válido e restaura estado + UI |
| `importPasivFile rejeita JSON inválido` | Arquivo corrompido → erro capturado, app não quebra |
| `importPasivFile rejeita arquivo sem extensão .PASIV` | Valida extensão antes de processar |
| `importPasivFile rejeita schema desconhecido` | JSON válido mas schema não é `PASIV-1` → rejeitado |
| `isDirty reset após exportar bem-sucedido` | Após exportar, `isDirty` volta para `false` |
| `isDirty reset após importar bem-sucedido` | Após importar, `isDirty` volta para `false` |

### 7.4 Novos Testes Obrigatórios para Limpeza Arquitetural

| Teste | Descrição |
|-------|-----------|
| `Nenhuma referência a YouTube no código-fonte` | `grep` automatizado sobre `js/` e `index.html` |
| `Nenhuma referência a seed/generateFullSeed/copySeed/applySeed` | `grep` automatizado |
| `Nenhuma atribuição window.* de lógica de negócio` | Verifica que apenas APIs de navegador permanecem em `window` |
| `Consolidação de updateTimerDisplay` | Existe apenas uma implementação |
| `Consolidação de updateSleepUI/updateAlarmTimerDisplay` | Existe apenas uma implementação |
| `Áudio dividido em módulos` | `audio/core.js`, `audio/effects.js`, `audio/mp3.js`, `audio/synth.js`, `audio/stems.js`, `audio/world.js` existem e exportam funções esperadas |

### 7.5 Cobertura Alvo

| Métrica | Atual | Alvo v5.0.0 |
|---------|-------|-------------|
| Testes passando | 109/109 | 100% dos testes criados |
| Cobertura de código | Seed apenas | ≥ 80% (linhas e branches) |
| Testes unitários de áudio | 0 | ≥ 10 |
| Testes de integração (modo + `.PASIV`) | 0 | ≥ 5 |
| Testes E2E (Playwright) | 28 | Manter ou ampliar para fluxos `.PASIV` |

### 7.6 Execução

- `npm test` deve rodar todos os testes unitários + `test-seed.mjs` (substituído por testes `.PASIV`).
- `npm run test:e2e` roda Playwright.
- `npm run test:all` roda ambos.
- Cada fase só é considerada concluída quando todos os testes passam.

---

## 8. Matriz de Arquivos Impactados (Consolidada)

| Arquivo | YouTube | Seed → .PASIV | window.* | Áudio split | App split | Testes | UI nova |
|---------|---------|---------------|----------|-------------|-----------|--------|---------|
| `js/youtube.js` | ❌ deletar | — | — | — | — | — | — |
| `js/app.js` | ✅ limpar | ✅ remover refs | ✅ remover `Object.assign` | — | ✅ bootstrapper | ✅ atualizar | — |
| `js/config.js` | ✅ remover `YOUTUBE_ENABLED` | — | — | — | — | ✅ atualizar unit | — |
| `js/state.js` | ✅ remover `worldSources.youtube` | — | — | — | — | — | — |
| `js/seed.js` | — | ❌ deletar | — | — | — | ❌ remover `test-seed.mjs` | — |
| `js/pasivFile.js` | — | ✅ criar | — | — | — | ✅ criar testes | — |
| `js/audio.js` | — | — | — | ✅ dividir | — | ✅ criar testes | — |
| `js/audio/{core,effects,mp3,synth,stems,world}.js` | — | — | — | ✅ criar/ajustar | — | ✅ criar testes | — |
| `js/i18n.js` | — | — | ✅ remover `window.t` etc. | — | — | ✅ atualizar | — |
| `js/screensaver.js` | — | — | ✅ remover exposições | — | — | — | — |
| `js/sensors.js` | — | — | ✅ remover `syncSensorsUI` | — | — | — | — |
| `js/features/modeController.js` | — | — | ✅ remover 4 funções | — | — | — | — |
| `js/features/accordionController.js` | — | — | ✅ remover `toggleAccordion` | — | — | — | — |
| `js/modes/sleepMode.js` | — | — | ✅ remover 5 funções | — | — | ✅ criar testes | — |
| `js/modes/pomodoroMode.js` | — | — | ✅ remover 6 funções | — | — | ✅ criar testes | — |
| `js/ui/pomodoroUI.js` | — | — | ✅ remover 7 funções | — | — | ✅ criar testes | — |
| `js/ui/generativeUI.js` | — | — | ✅ remover 6 funções | — | — | — | — |
| `js/eventDelegate.js` | — | — | ⚠️ avaliar `registerAction` | — | — | — | — |
| `index.html` | ✅ remover players YT | ✅ remover seed UI | — | — | — | — | ✅ seção Exportar/Importar |
| `tests/unit.test.mjs` | — | — | — | — | — | ✅ atualizar | — |
| `tests/runtime.test.mjs` | — | — | — | — | — | ✅ revisar | — |
| `tests/comprehensive.test.mjs` | — | — | — | — | — | ✅ revisar | — |
| `scripts/test-seed.mjs` | — | ❌ remover | — | — | — | ❌ remover | — |
| `tests/e2e/app.spec.js` | — | — | — | — | — | ✅ revisar fluxos | — |
| `tests/pasivFile.test.mjs` | — | ✅ criar | — | — | — | ✅ criar (novo) | — |
| `tests/audio/*.test.mjs` | — | — | — | ✅ criar (novos) | — | ✅ criar (novos) | — |

---

## 9. Critérios de Aceitação (v5.0.0)

### Arquitetura
- [ ] `grep window\.` em `js/` retorna apenas APIs do navegador.
- [ ] Nenhuma função duplicada entre módulos.
- [ ] `audio.js` dividido em módulos com responsabilidade única.
- [ ] `app.js` atua apenas como bootstrapper.
- [ ] Todos os `.then()` convertidos para `async/await`.
- [ ] Nenhum `var` restante.
- [ ] Nenhum `console.log` de produção.
- [ ] Todas as strings visíveis ao usuário via `i18n.t()`.
- [ ] TypeScript estrito habilitado em todos os módulos.

### Persistência `.PASIV`
- [ ] Nenhum arquivo `youtube.js` ou referência a YouTube no código-fonte.
- [ ] Nenhuma referência a `seed`, `generateFullSeed`, `copySeed`, `applySeed` no código ativo.
- [ ] Seção "Exportar / Importar Configurações" visível nos 4 modos.
- [ ] Botão Exportar desabilitado inicialmente; habilita após qualquer alteração (`isDirty`).
- [ ] Arquivo exportado usa extensão `.PASIV` e contém JSON válido com schema `PASIV-1`.
- [ ] Importar `.PASIV` restaura estado e UI corretamente.
- [ ] Arquivo JSON inválido, sem extensão `.PASIV` ou com schema desconhecido é rejeitado sem quebrar o app.

### Testes (Obrigatório)
- [ ] `npm test` passa com 100% dos testes.
- [ ] Cobertura de código ≥ 80%.
- [ ] Testes de `.PASIV` cobrem exportar, importar, dirty state, validação de arquivo e JSON inválido.
- [ ] Testes automatizados confirmam ausência de YouTube e seed no código-fonte.
- [ ] `npm run lint` sem erros.
- [ ] CI/CD (GitHub Actions) rodando lint + testes em PR.

---

## 10. Decisões Tomadas (Confirmadas)

| Item | Decisão |
|------|---------|
| Novas funcionalidades além de remover YouTube | **Nenhuma** (apenas limpeza + `.PASIV`) |
| Ordem de início | Remover YouTube e Seed primeiro |
| `js/seed.js` | Deletar completamente e corrigir todos os imports |
| Biofeedback / áudio espacial / produtividade / diário / acessibilidade | **Não será implementado** |
| Nome da seção UI | "Exportar / Importar Configurações" |
| Botões | "Exportar" e "Importar" |
| Extensão do arquivo | `.PASIV` |
| Detecção de dirty state | Comparação com defaults do `config.js` |
| Impacto nos testes | Toda alteração impacta testes; testes novos obrigatórios |

---

*Plano salvo em: C:\Users\ninov\.opencode\plan\PLANO-v5.0.0.md*
