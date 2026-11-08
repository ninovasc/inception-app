# PASIV Engine (inception-app)

Motor de áudio psicoacústico inspirado nos níveis de sonho de *A Origem (Inception)*.
App web estático, mobile-first, instalável como PWA, publicado via GitHub Pages.

**Demo:** https://ninovasc.github.io/inception-app/

## Funcionalidades

- **13 mundos** nomeados pelas faixas da OST: *Half Remembered Dream, We Built Our Own World, Dream Is Collapsing, Radical Notion, Old Souls, 528491, Mombasa, One Simple Idea, Dream Within a Dream, Waiting for a Train, Paradox, Time, Bonus Track*. Cada mundo ajusta velocidade, filtro, delay e reverb, e tem seu próprio sintetizador, voz e progressão de acordes/BPM.
- **Fonte sonora por mundo**: cada mundo escolhe entre 18 sintetizadores (5 legados + 13 novos com camadas pluck/pulse/noise/drift/binaural/BPM) ou um MP3 próprio, com volume independente. **MP3 inteligente**: ao trocar de mundo a música retoma de um ponto musical aleatório (não do zero); ao terminar, continua de outro ponto — a faixa inteira circula.
- **Efeitos DSP** via Web Audio API: lowpass, delay estéreo com feedback, convolver reverb, dry/wet, stereo panner, compressor.
- **"O Chute" (Kick)**: fanfarra de metais + BRAAAM grave, desce para *Waiting for a Train*.
- **Sensores reais**: microfone, giroscópio e GPS (clima via Open-Meteo).
- **Modo Automático** (ligado por padrão): 13 gatilhos exclusivos avaliados em ordem curada (prioridade: Chuva intensa → Palmas → Invertido → Queda livre → Movimento → Veículo → Início da sessão → Silêncio → Chuva → Aparelho apoiado → Noite → Sessão longa → Sem gatilho). Só o primeiro verdadeiro escolhe o mundo. Destinos são remapeáveis pela UI.
- **Mecânicas psicoacústicas**: Memory Catcher (Ecos do Ambiente), Auto-Kick, Áudio Espacial 3D, Timer de Sonho Lúcido (descida progressiva), Privação Sensorial (modo batimento após 15s silêncio + celular virado). Mecânicas ligadas por padrão (exceto Timer), ativam no primeiro play para respeitar permissões iOS.
- **Persistência .PASIV**: export/import de estado completo em arquivo JSON, com tracking de mudanças (isDirty).
- **Modos de operação**: Narrativo (automático), Pomodoro (timer + batidas), Sono (alarme + batidas), Livre (manual).
- **IA Generativa**: variação de parâmetros de synth via seed, com save/reset de presets.
- **Screensaver**: overlay com SVG animado após 1 minuto de inatividade.
- **i18n**: suporte a 3 idiomas (pt-BR, en-US, es-ES).

## Estrutura

```
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/styles.css
├── js/
│   ├── app.js          # bootstrap, wiring, event delegation
│   ├── state.js        # estado compartilhado (13 mundos)
│   ├── config.js       # constantes (13 níveis, 18 presets, 13 gatilhos)
│   ├── audio.js        # orquestrador de áudio
│   ├── audio/          # módulos de áudio (core, synth, mp3, stems, world, effects)
│   ├── sensors.js      # mic, motion, gps, detectores
│   ├── mechanics.js    # mecânicas psicoacústicas
│   ├── modes/          # modo manager, switcher, panel manager, ui updater
│   ├── modes/          # narrativeMode, pomodoroMode, sleepMode
│   ├── features/       # modeController, triggerController, pomodoroController, sleepController, accordionController
│   ├── ui/             # commonUI, modeSelector, narrativeUI, pomodoroUI, sleepUI, freeUI, generativeUI
│   ├── synth/          # generativeEngine
│   ├── pasivFile.js    # persistência .PASIV (export/import)
│   ├── i18n.js         # internacionalização
│   ├── eventDelegate.js # delegação de eventos (data-action)
│   ├── screensaver.js  # screensaver de inatividade
│   └── capture.js      # captura de áudio do sistema
├── assets/icons/       # ícones PWA
├── scripts/            # utilitários (serve.js, bump-version.js)
├── tests/              # testes unitários, funcionais, E2E
├── .github/workflows/  # CI/CD (GitHub Actions)
└── tsconfig.pure.json  # TypeScript scaffold (checkJs: true)
```

## Desenvolvimento

É um app estático. Basta servir a pasta:

```bash
node scripts/serve.js .
# ou
npx serve .
```

## Testes

```bash
# Testes unitários + TypeScript check
npm test

# Testes funcionais
node --test tests/functional.test.mjs

# Testes E2E (Playwright)
npm run test:e2e

# Todos os testes
npm run test:all

# Cobertura
npm run test:coverage
```

## CI/CD

O pipeline de CI/CD roda automaticamente no GitHub Actions:
- **Unit & Static**: TypeScript check + testes unitários
- **E2E**: testes Playwright (Chromium)

## Pre-commit Hook

O pre-commit hook roda TypeScript check + todos os testes unitários antes de cada commit.

## Arquitetura

- **Event Delegation**: Todas as interações UI usam `data-action` attributes, sem `window.*` globals
- **Modularidade**: Módulos separados por responsabilidade (audio, sensors, mechanics, modes, ui, features)
- **TypeScript Scaffold**: `tsconfig.pure.json` com `checkJs: true` para verificação gradual de tipos
- **Persistência**: Arquivos .PASIV (JSON) para export/import de estado

## Licença

ISC
