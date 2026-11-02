# Plano v4.0.0 — PASIV Engine: Modos Narrativo, Pomodoro, Sono + IA Generativa

**Data:** 2026-11-02  
**Base:** v3.0.1 (commit 9243fc3)  
**Branch:** `v4-modos`  
**Objetivo:** Evolução do motor com 3 modos narrativos + IA generativa

---

## 📋 RESUMO EXECUTIVO

| Fase | Features | Esforço | Impacto |
|------|----------|---------|---------|
| **Fase 1** | Seletor de Modos + Modo Pomodoro (2 mundos) | Baixo | Alto |
| **Fase 2** | Modo Sono (Binaural/Isocrônico + Alarme) | Médio | Alto |
| **Fase 3** | IA Generativa para todos os sintetizadores | Alto | Diferenciação |

---

## 📦 FASE 1 — QUICK WINS: SELETOR DE MODOS + MODO POMODORO

### 1.1 Seletor de Modos (Substitui toggle Auto On/Off)

**Estado Atual:** `autoMode: true/false` (binário)

**Novo Comportamento:** Seletor com 4 modos mutuamente exclusivos:

| Modo | Nome Interno | Descrição | Ícone |
|------|--------------|-----------|-------|
| **Narrativo** | `narrative` | Antigo "Automático" — 13 mundos, gatilhos sensoriais, narrativo | 📖 |
| **Pomodoro** | `pomodoro` | 2 mundos (Atividade/Descanso), timer, MP3 customizável | 🍅 |
| **Sono** | `sleep` | Batidas binaurais/isocrônicas, alarme, tela preta | 🌙 |
| **Livre** | `free` | Manual — usuário escolhe mundo/synth/fonte sem automação | ✋ |

**Estado:** `state.currentMode` (string) — padrão: `'narrative'`  
**Persistência:** `localStorage` + seed

**UI:** Substituir botão "Modo Automático" por **Segmented Control / Select** com 4 opções no header ou painel "Estado do Sonho"

---

### 1.2 Modo Narrativo (Antigo Automático)

- **Comportamento idêntico ao atual:** 13 mundos, 13 gatilhos, prioridade curada, sensores ativos
- **Mudança:** Renomeado de "Automático" → "Narrativo" na UI
- **Gatilhos, sensores, seeds, migração:** mantidos 100%

---

### 1.3 Modo Pomodoro (NOVO)

#### **Conceito**
- Apenas **2 mundos**: **Atividade** (foco) + **Descanso** (pausa)
- Timer Pomodoro clássico (25/5) + pausa longa (15) configurável
- **Screensaver = Timer visual** do próximo ciclo (contagem regressiva)
- **MP3 customizável por mundo** (Atividade / Descanso)
- **Sem sensores automáticos** — transição só pelo timer
- **Sem 13 mundos / gatilhos narrativos**

#### **Mundos do Modo Pomodoro**

| Mundo | Nome | Síntese Padrão | Cor (bgColor) | Uso |
|-------|------|----------------|---------------|-----|
| 0 | **Atividade** (Focus) | Novo: `Focus Pulse` (beta/gamma, pulse 40-45Hz, pluck ritmado) | `#0a1418` | Trabalho/Estudo |
| 1 | **Descanso** (Break) | Novo: `Break Drift` (alpha/theta, drift lento, pads suaves) | `#0a1210` | Pausa/Relax |

#### **Sínteses Específicas (Novas)**

```javascript
// Focus Pulse - Atividade
{
  name: 'Focus Pulse',
  freqs: [180, 200, 400, 800],      // Beta/Gamma range
  types: ['square', 'sawtooth', 'square', 'sine'],
  gains: [0.08, 0.06, 0.04, 0.03],
  pulse: { gain: 0.12, bpm: 60, offbeat: false },
  binaural: 40,                      // 40Hz gamma = foco
  drift: 0.0005,
  bpm: 60
}

// Break Drift - Descanso
{
  name: 'Break Drift',
  freqs: [85, 110, 170, 220],       // Alpha/Theta
  types: ['sine', 'triangle', 'sine', 'sine'],
  gains: [0.15, 0.10, 0.07, 0.05],
  drift: 0.008,                      // Instabilidade suave
  noise: { gain: 0.015, freq: 200 }, // "Ar" suave
  pulse: { gain: 0.04, bpm: 10, offbeat: true },
  bpm: 10
}
```

#### **Timer Pomodoro**

| Parâmetro | Padrão | Configurável |
|-----------|--------|--------------|
| Atividade | 25 min | 5-60 min |
| Pausa Curta | 5 min | 1-15 min |
| Pausa Longa | 15 min | 5-30 min |
| Ciclos até Pausa Longa | 4 | 2-8 |

**Comportamento:**
- Inicia em **Atividade** (timer roda)
- Ao terminar → transição suave (crossfade 2s) → **Descanso**
- Ao terminar pausa → volta **Atividade** (ciclo++)
- A cada N ciclos → **Pausa Longa** (substitui pausa curta)
- Usuário pode **pausar/pular** manualmente

#### **Screensaver no Modo Pomodoro**
- **Conteúdo:** Timer centralizado (MM:SS) + label "Atividade" / "Descanso" / "Pausa Longa"
- **Estilo:** Fonte mono grande, cor do mundo atual, fundo = `bgColor` do mundo
- **Progresso:** Barra circular sutil (progress ring) ao redor do timer
- **Sem pião animado** — apenas timer limpo, escuro, legível

#### **MP3 Customizável**
- Cada mundo (Atividade/Descanso) tem slot MP3 independente
- UI: mesma lista colapsável de Fonte Sonora, mas apenas 2 linhas
- Se MP3 carregado → usa MP3; senão usa synth padrão do mundo

#### **Estado do Modo Pomodoro (state.pomodoro)**
```javascript
pomodoro: {
  enabled: false,           // true quando modo == 'pomodoro'
  phase: 'activity',        // 'activity' | 'shortBreak' | 'longBreak'
  timeRemaining: 1500,      // segundos
  totalTime: 1500,
  cyclesCompleted: 0,
  cyclesUntilLongBreak: 4,
  isRunning: false,
  timerInterval: null,
  // Config
  activityDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  cyclesUntilLongBreak: 4,
  // MP3 por fase
  activityMp3: '',
  breakMp3: ''
}
```

---

## 📦 FASE 2 — MÉDIO ESFORÇO: MODO SONO (BINAURAL/ISOCRÔNICO + ALARME)

### 2.1 Conceito
- **Objetivo:** Indução de sono + despertar suave
- **Mundos = Batidas** (um mundo por frequência alvo)
- **Sem MP3** — apenas síntese pura (binaural/isocrônica)
- **Alarme programado** — horário fixo para acordar
- **Screensaver = Tela preta + Timer escuro** (hora restante até alarme)

### 2.2 Mundos do Modo Sono (8 mundos = 8 batidas)

| Mundo | Nome | Frequência Alvo | Tipo | Uso |
|-------|------|-----------------|------|-----|
| 0 | **Delta Profundo** | 0.5-2 Hz | Binaural | Sono profundo, regeneração |
| 1 | **Delta Sono** | 1-3 Hz | Binaural | Início do sono |
| 2 | **Theta Meditação** | 4-7 Hz | Binaural | Relaxamento profundo, hipnagógico |
| 3 | **Theta Sono** | 5-6 Hz | Isocrônico | Transição sono leve |
| 4 | **Alpha Relax** | 8-12 Hz | Binaural | Relaxamento pré-sono |
| 5 | **Alpha-Isocrônico** | 10 Hz | Isocrônico | Relaxamento ativo |
| 6 | **SMR (12-15Hz)** | 12-15 Hz | Binaural | Relaxamento corporal, redução ansiedade |
| 7 | **Despertar Suave** | 14-18 Hz (Beta baixo) | Binaural | Transição vigília |

**Sínteses:** Novas, otimizadas para batidas binaurais/isocrônicas puras — sem camadas extras (pluck, noise, etc.) que atrapalhem entrainment.

### 2.3 Alarme Inteligente
- **Input:** Hora desejada (ex: 07:00) via time picker
- **Janela de Despertar:** ±15 min antes do horário (padrão 15 min)
- **Fase de Despertar:** Nos últimos 15 min → transição gradual para mundo **Despertar Suave** (Beta baixo) + fade-in de volume + luz (se device suportar)
- **Som de Alarme:** Tom suave ascendente (synth) + vibração (se mobile) — **não** MP3

### 2.4 Screensaver Modo Sono
- **Fundo:** Preto puro (`#000000`)
- **Conteúdo:** Timer central (HH:MM:SS até alarme) + label "Sono" / "Despertando em XX min"
- **Estilo:** Fonte mono muito grande, cor `#1a1a2e` (quase preto, legível no escuro total)
- **Sem animações** — apenas timer, o mais discreto possível
- **Brilho mínimo** — respeita `prefers-reduced-motion` e brilho do sistema

### 2.4 Restrições Modo Sono
- ❌ Sem MP3 (síntese pura obrigatória)
- ❌ Sem 13 mundos narrativos
- ❌ Sem gatilhos automáticos (exceto alarme)
- ❌ Sensores desligados (exceto alarme)

---

## 📦 FASE 3 — ALTO ESFORÇO: IA GENERATIVA PARA TODOS OS SINTETIZADORES

### 3.1 Objetivo
**Cada sintetizador (18 atuais + novos) ganha "motor generativo" opcional** que cria variações infinitas, coerentes e musicalmente relevantes a partir dos parâmetros base.

### 3.2 Arquitetura Técnica

#### **Modelo:** Transformer leve (TFLite/ONNX) rodando **on-device** (WebAssembly/WebGPU)
- **Tamanho alvo:** < 2MB quantizado (INT8)
- **Latência:** < 50ms por inferência
- **Offline-first:** Sem rede, roda no navegador

#### **Entradas (Conditioning)**
```typescript
interface GenerativeInput {
  // Parâmetros base do synth
  baseFreqs: number[4];
  baseTypes: string[4];
  baseGains: number[4];
  baseLfo: number;
  // Camadas opcionais
  pluck?: { gain: number; bpm: number };
  pulse?: { gain: number; bpm: number; offbeat: boolean };
  noise?: { gain: number; freq: number };
  drift: number;
  binaural: number;
  bpm: number;
  // Contexto
  worldName: string;           // ex: "Mombasa"
  worldBgColor: string;        // "#1a0f08"
  targetMood: 'focus' | 'relax' | 'sleep' | 'energy' | 'melancholy' | 'neutral';
  // Controle usuário
  variationIntensity: 0..1;    // 0 = original, 1 = máxima variação
  seed: number;                // Para reprodutibilidade
}
```

#### **Saídas (Deltas Aplicáveis)**
```typescript
interface GenerativeOutput {
  // Deltas suaves aplicados aos parâmetros base
  freqDeltas: number[4];       // +/- semitons (max +/- 12)
  gainDeltas: number[4];       // +/- dB (max +/- 12dB)
  typeChanges?: string[4];     // Opcional: mudança de waveform
  lfoDelta: number;
  // Camadas
  pluck?: { gainDelta: number; bpmDelta: number };
  pulse?: { gainDelta: number; bpmDelta: number; offbeatFlip: boolean };
  noise?: { gainDelta: number; freqDelta: number };
  driftDelta: number;
  binauralDelta: number;
  bpmDelta: number;
  // Metadados
  confidence: 0..1;            // Qualidade da geração
  variationHash: string;       // Para reprodução exata
}
```

#### **Aplicação (Tempo Real)**
```javascript
function applyGenerativeVariation(baseSynth, output, intensity) {
  const t = intensity; // 0..1
  return {
    freqs: baseSynth.freqs.map((f, i) => f * Math.pow(2, output.freqDeltas[i] * t / 12)),
    gains: baseSynth.gains.map((g, i) => g * Math.pow(10, output.gainDeltas[i] * t / 20)),
    types: output.typeChanges?.map((nt, i) => nt || baseSynth.types[i]) || baseSynth.types,
    lfo: baseSynth.lfo + output.lfoDelta * t,
    // ... demais campos
  };
}
```

### 3.3 Treinamento / Modelo (Fora do App)
- **Dataset:** Geração sintética a partir dos 18 presets + variações procedurais controladas + dados de preferência (futuro: feedback usuário)
- **Arquitetura:** Transformer encoder-decoder pequeno (4 layers, 256 dim, 4 heads) + heads de regressão para cada parâmetro
- **Loss:** MSE nos parâmetros + loss adversarial (discriminador de "musicalidade") + regularização de suavidade temporal
- **Export:** ONNX → TFLite INT8 → carrega via `fetch` + `WebAssembly` no app

### 3.5 UI/UX no App
| Elemento | Comportamento |
|----------|---------------|
| **Toggle "Generativo"** | Por synth (no painel Fonte Sonora) — liga/desliga |
| **Slider "Variação"** | 0% (original) → 100% (máxima) — tempo real |
| **Botão "Nova Variação"** | Re-gera com nova seed (animação suave de transição) |
| **Botão "Salvar Variação"** | Cria preset customizado (nome + seed) |
| **Indicador** | Badge "🤖 Generativo" no badge do synth na lista |

### 3.5 Escopo por Fase
| Fase | Entregável |
|------|-------------|
| **3A** | Infra: loader WASM/TFLite, pipeline de inferência, aplicação de deltas tempo real |
| **3B** | Modelo base treinado (18 synths) + 3 variações por synth validadas |
| **3C** | UI: toggle, slider, botões, seed save/load |
| **3D** | Otimização: quantização, cache, fallback graceful (sem IA se falhar) |

---

## 🗂️ BACKLOG FUTURO (Guardado para Discussão Posterior)

> **Não implementar agora — guardado para v5+**

| Categoria | Features |
|-----------|----------|
| **Spatial/Imersão** | Ambisonics 3ª ordem, Head-tracking AirPods, Renderização binaural HRTF personalizada |
| **Bio/Neuro** | HealthKit (HRV, Sleep Stages), rPPG via câmera, HR via accel, Neurofeedback EEG (Muse) |
| **Social** | Sessões multiplayer WebRTC, Sync de mundos, Chat áudio opcional |
| **AI Avançada** | Modelo maior server-side, Fine-tuning por usuário, Geração de melodias/harmonias |
| **Produtividade** | Perfis (Trabalho/Estudo/Sono), Agendamento/rotinas, API/Webhooks, Shortcuts avançados |
| **Diário** | Dream Journal integrado (voz/texto), Correlação mundo+sensores+relato |
| **Hardware** | Apollo Neuro, Apollo Wearable, MIDI/OSC out, DMX lighting sync |
| **Acessibilidade** | VoiceOver/TalkBack completo, High contrast, Reduced motion, Legendas live |

---

## 📅 CRONOGRAMA SUGERIDO (Estimativa)

| Sprint | Foco | Entregável |
|--------|------|------------|
| **1-2** | Fase 1a: Seletor de Modos + Estado | Seletor 4 modos, estado persistido, UI |
| **3-4** | Fase 1b: Modo Pomodoro (Core) | 2 mundos, timer, transições, screensaver timer |
| **5** | Fase 1c: Pomodoro Polish | MP3 custom, configurações, persistência seed |
| **6-7** | Fase 2a: Modo Sono (Core) | 8 mundos binaural/isocrônico, alarme |
| **8** | Fase 2b: Sono Polish | Screensaver preto, alarme inteligente, transição despertar |
| **9-11** | Fase 3a: IA Infra | Loader WASM, pipeline inferência, aplicação deltas |
| **12-14** | Fase 3b | Modelo base treinado (18 synths) + validação |
| **15** | Fase 3c | UI Generativa (toggle, slider, seed save) |
| **16** | Fase 3d | Otimização, fallback, testes iOS/Android |

**Total estimado:** ~16 sprints (~4 meses com 1 dev full-time)

---

## 📝 ARQUIVOS A CRIAR/MODIFICAR (Resumo)

### Novos Arquivos
```
js/
├── modes/
│   ├── modeManager.js       # Gerenciador de modos (estado, transições)
│   ├── narrativeMode.js     # Lógica modo narrativo (extraído de automode)
│   ├── pomodoroMode.js      # Timer, fases, 2 mundos, screensaver
│   └── sleepMode.js         # 8 mundos binaural, alarme, screensaver preto
├── synth/
│   ├── generativeEngine.js  # Loader WASM, inferência, aplicação deltas
│   └── generativeModels/    # Arquivos .tflite/.onnx (git-lfs)
├── ui/
│   ├── modeSelector.js      # Seletor 4 modos (header/painel)
│   ├── pomodoroUI.js        # Timer visual, config, MP3 slots
│   └── sleepUI.js           # Alarme picker, mundo selector, screensaver
└── i18n/
    └── (novas keys para pomodoro, sleep, generative)
```

### Arquivos Modificados
```
js/
├── app.js           # Inicialização modos, toggleAccordion, initI18n
├── audio.js         # crossfadeMp3Worlds, selectLevel (modo-aware)
├── state.js         # Novos campos: currentMode, pomodoro, sleep
├── config.js        # NOVOS: POMODORO_SYNTH_PRESETS, SLEEP_SYNTH_PRESETS, LEVELS por modo
├── automode.js      # Renomeado/integrado em narrativeMode.js
├── sensors.js       # Desligar sensores em modos pomodoro/sleep
└── seed.js          # Serialização novos campos (mode, pomodoro, sleep)

css/styles.css       # Estilos accordion, timer screensaver, mode selector
index.html           # Nova estrutura menu (ordem + accordion + mode selector)
```

---

## ✅ CHECKLIST DE EXECUÇÃO

```
FASE 1 (QUICK WINS)
☐ 1a: Branch v4-modos + tag v3.0.1-rollback + baseline tests
☐ 1b: config.js - adicionar POMODORO_SYNTH_PRESETS, SLEEP_SYNTH_PRESETS, LEVELS por modo
☐ 1c: state.js - adicionar currentMode, pomodoro, sleep
☐ 1d: modeManager.js - gerenciador central de modos
☐ 1e: narrativeMode.js - extrair lógica automode atual
☐ 1f: pomodoroMode.js - timer, 2 mundos, transições, screensaver
☐ 1g: modeSelector.js - UI seletor 4 modos
☐ 1f: pomodoroUI.js - timer visual, config, MP3 slots
☐ 1g: app.js - integração modeManager, initI18n, renderWorldSelect
☐ 1h: config.js - POMODORO_SYNTH_PRESETS (Focus Pulse, Break Drift)
☐ 1h: config.js - LEVELS_POMODORO (2 mundos)
☐ 1i: audio.js - crossfadeMp3Worlds para Pomodoro
☐ 1j: seed.js - serialização mode, pomodoro
☐ 1k: index.html - mode selector UI, accordion order
☐ 1l: css/styles.css - mode selector styles, pomodoro screensaver
☐ 1m: Tests + smoke test browser

FASE 2 (MÉDIO)
☐ 2a: sleepMode.js - 8 mundos binaural/isocrônico
☐ 2b: sleepUI.js - alarme picker, mundo selector, screensaver preto
☐ 2c: config.js - SLEEP_SYNTH_PRESETS (8 batidas)
☐ 2d: config.js - LEVELS_SLEEP (8 mundos)
☐ 2e: audio.js - binaural/isocrônico synthesis
☐ 2f: alarm system - time picker, smart wake window
☐ 2g: sleep screensaver - tela preta + timer escuro
☐ 2h: Tests + smoke test

FASE 3 (IA)
☐ 3a: generativeEngine.js - WASM loader, inference pipeline
☐ 3b: Modelo base treinado (TFLite/ONNX)
☐ 3c: generativeModels/ (git-lfs)
☐ 3c: UI generativa (toggle, slider, seed save)
☐ 3d: Otimização + fallback

DOCS
☐ PLANO-v4-MODOS.md commitado
☐ REVISAO-v4.0.0.md atualizado
```

---

## 🔄 PROTOCOLO DE RECUPERAÇÃO

1. Ler `PLANO-v4-MODOS.md` (fonte de verdade)
2. `git log --oneline -10` → ver último commit
3. `git status` → trabalho não commitado
4. `node scripts/test-seed.mjs` — deve passar 109/109
5. Continuar pelo primeiro ☐ não marcado
5. **Nunca refazer fases concluídas**
6. Atualizar checklist a cada commit