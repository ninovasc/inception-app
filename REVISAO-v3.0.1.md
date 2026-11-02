# Revisão e Plano de Correções — PASIV Engine v3.0.1

**Data:** 2026-11-02  
**Base:** v3.0.0 (commit 5ceba5b)  
**Objetivo:** Corrigir bugs críticos, remover hardcodes, limpar código morto, melhorar UX

---

## 📊 RESUMO EXECUTIVO

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| 🔴 Críticos (quebram funcionalidade) | 5 | ✅ **5/5 Concluídos** |
| 🟡 Médios (arquitetura/código morto) | 5 | ✅ **5/5 Concluídos** |
| 🟢 UX/Polish | 5 | ✅ **5/5 Concluídos** |
| 🗑️ Limpeza (arquivos legados) | 3 | ✅ **3/3 Concluídos** |
| **Total** | **18** | **18/18** |

---

## 🔴 FASE A — CRÍTICOS (implementar primeiro)

### A1: youtube.js — expandir arrays para 13 mundos ✅
- **Arquivo:** `js/youtube.js`
- **Linhas:** 3, 134
- **Problema:** `players = [null...]` (6), `stopAllYouTubeWorld` loopa 6, mas mundos vão 0-12
- **Fix:** `Array(13).fill(null)`, loops usam `WORLD_NAMES.length` ou `WORLD_COUNT`

### A2: seed.js — salvar volumes dos 13 mundos na seed ✅
- **Arquivo:** `js/seed.js`
- **Linhas:** 255-262
- **Problema:** `volumes = [worldVolume[0], [1], [2], vs]` — só 4 valores
- **Fix:** `volumes = [...state.worldVolume]` (13) + vs como fallback

### A3: audio.js — remover delayNode não usado / corrigir Memory Catcher ✅
- **Arquivo:** `js/audio.js`, `js/state.js`
- **Linhas:** state.js:28, audio.js:1060
- **Problema:** `delayNode` declarado mas nulo; `captureAndPlaySubconsciousMemory` conecta nele
- **Fix:** Remover do state, usar `delayLeft`/`delayRight` ou criar delay dedicado

### A4: audio.js:triggerKick — remover hardcodes de nível ✅
- **Arquivo:** `js/audio.js`
- **Linhas:** 1013, 1044
- **Problema:** `selectLevel(9)` hardcode, `currentLevel === 9` hardcode
- **Fix:** Usar `WORLD_NAMES.indexOf('Waiting for a Train')` ou constante `WAITING_FOR_TRAIN_IDX = 9`

### A5: audio.js — parar breath LFOs ao parar audio ✅
- **Arquivo:** `js/audio.js`
- **Linhas:** 101-115, 361-388, 757-801
- **Problema:** LFOs rodam indefinidamente, vazam recursos
- **Fix:** `stopSynth` e `toggleMasterPlay(false)` param LFOs

---

## 🟡 FASE B — ARQUITETURA / CÓDIGO MORTO ✅ CONCLUÍDA

### B1: remover delayNode/feedbackGain do state ✅ (feito na A3)
### B2: MIC_PRESETS cópia profunda ✅
### B3: app.js limpar currentWorldTab/selectWorldTab ✅
### B4: mechanics.js constantes Waiting for a Train ✅
### B5: config.js separar presets legados/novos ✅

### B1: audio.js/state.js — remover delayNode
- **Arquivo:** `js/state.js` linha 28, `js/audio.js` linhas 28-29, 1060

### B2: sensors.js — MIC_PRESETS cópia profunda
- **Arquivo:** `js/sensors.js` linha 296
- **Problema:** `export const MIC_PRESETS = WORLD_VOICE_PRESETS` — mutação afeta config

### B3: app.js — remover código morto
- **Arquivo:** `js/app.js`
- **Linhas:** 249-255 (`currentWorldTab`, `selectWorldTab`)

### B4: mechanics.js — constante para Waiting for a Train
- **Arquivo:** `js/mechanics.js` linha 333
- **Problema:** `audio.setWorldSynth(9, 4); audio.selectLevel(9)` hardcode

### B5: config.js — separar presets legados
- **Arquivo:** `js/config.js` linhas 27-50
- **Problema:** 5 presets legados (0-4) órfãos, WORLD_SYNTH usa 5-17

---

## 🟢 FASE C — UX / POLISH ✅ CONCLUÍDA

### C1: app.js screensaver — SVG inline para animações ✅
### C2: app.js screensaver — remover touchstart duplicado ✅
### C3: audio.js applyParameters — stems condicional ✅
### C4: manifest.webmanifest — icons maskable completos ✅
### C5: mechanics.js — activateDreamDefaults flag no state ✅

### C1: app.js screensaver — SVG inline para animações
- **Arquivo:** `js/app.js` linha 410
- **Problema:** `<object>` não anima CSS em alguns browsers

### C2: app.js screensaver — remover touchstart duplicado
- **Arquivo:** `js/app.js` linhas 413-414
- **Problema:** `click` + `touchstart` = double-fire mobile

### C3: audio.js applyParameters — não mexer stems inativos
- **Arquivo:** `js/audio.js` linha 925-926

### C4: manifest.webmanifest — icons maskable completos
- **Arquivo:** `manifest.webmanifest`
- **Problema:** Só 192/512 têm maskable

### C5: mechanics.js — activateDreamDefaults flag no state
- **Arquivo:** `js/mechanics.js` linha 351-361
- **Problema:** Flag `defaultsActivated` local, perde no reload

---

## 🗑️ FASE D — LIMPEZA ✅ CONCLUÍDA

### D1: remover gen-pawn.js, gen-icon.js ✅
### D2: ui.js remover handleXYMove ✅
### D3: version bump v3.0.1 + tag v3.0.1 ✅

### D1: Remover scripts legados
- **Arquivos:** `scripts/gen-pawn.js`, `scripts/gen-icon.js`

### D2: ui.js — remover handleXYMove
- **Arquivo:** `js/ui.js` linhas 26-48

### D3: Version bump v3.0.1
- **Arquivos:** `index.html` (version), `sw.js` (cache), tag git

---

## 📋 CHECKLIST DE EXECUÇÃO

```
FASE A (CRÍTICOS)
☐ A1: youtube.js → 13 mundos
☐ A2: seed.js → volumes[13]
☐ A3: audio.js → delayNode / Memory Catcher
☐ A4: audio.js:triggerKick → constantes
☐ A5: audio.js → parar breath LFOs

FASE B (ARQUITETURA)
☐ B1: remover delayNode do state
☐ B2: MIC_PRESETS cópia profunda
☐ B3: app.js limpar currentWorldTab
☐ B4: mechanics.js constante Waiting for a Train
☐ B5: config.js separar presets legados

FASE C (UX)
☐ C1: screensaver SVG inline
☐ C2: screensaver remover touchstart
☐ C3: applyParameters stems condicional
☐ C4: manifest icons maskable
☐ C5: activateDreamDefaults flag persistente

FASE D (LIMPEZA)
☐ D1: remover gen-pawn.js, gen-icon.js
☐ D2: ui.js remover handleXYMove
☐ D3: version bump + tag

---

## 🔄 PROTOCOLO DE RECUPERAÇÃO DE CONTEXTO

Se perder contexto, ler este arquivo e:
1. `git log --oneline -10` → ver último commit feito
2. `git status` → ver alterações não commitadas
3. Rodar `node scripts/test-seed.mjs` — deve passar 109/109
4. Continuar pelo primeiro ☐ não marcado
5. **Nunca refazer fases concluídas** — commits mostram progresso
6. Atualizar este arquivo a cada fase concluída