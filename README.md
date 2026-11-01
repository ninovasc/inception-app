# PASIV Engine (inception-app)

Motor de áudio psicoacústico inspirado nos níveis de sonho de *A Origem (Inception)*.
App web estático, mobile-first, instalável como PWA, publicado via GitHub Pages.

**Demo:** https://ninovasc.github.io/inception-app/

## Funcionalidades

- **6 níveis de sonho** (Realidade, Chuva, Hotel, Fortaleza, Limbo, Lúcido) que ajustam velocidade, filtro, delay e reverb.
- **Fonte sonora por mundo**: cada mundo escolhe entre 5 sintetizadores (Zimmer Ambient, Brass Drone, Sub Limbo, Glass Choir, Binaural Pulse), um MP3 próprio ou um link do YouTube, com volume independente.
- **Efeitos DSP** via Web Audio API: lowpass, delay com feedback, convolver reverb, dry/wet, stereo panner, compressor.
- **"O Chute" (Kick)**: fanfarra de metais + BRAAAM grave.
- **Sensores reais** (opt-in): microfone, giroscópio e GPS (clima via Open-Meteo).
- **Mecânicas psicoacústicas**: Memory Catcher, Auto-Kick, Áudio Espacial 3D, Timer de Sonho Lúcido, Privação Sensorial.
- **Seed**: serializa todo o estado em uma string compartilhável.

## Estrutura

```
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/styles.css
├── js/
│   ├── app.js          # bootstrap, wiring, globals
│   ├── state.js        # estado compartilhado
│   ├── config.js       # constantes (níveis, presets)
│   ├── audio.js        # grafo de áudio e DSP
│   ├── sensors.js      # mic, motion, gps
│   ├── mechanics.js    # mecânicas psicoacústicas
│   ├── seed.js         # serialização/restauração
│   └── ui.js           # helpers de UI
├── assets/icons/       # ícones PWA
└── scripts/            # utilitários (geração de ícones)
```

## Desenvolvimento

É um app estático. Basta servir a pasta:

```bash
node scripts/serve.js .
# ou
npx serve .
```

Abra em `http://localhost:8099`. Sensores (mic/giroscópio/GPS) exigem HTTPS ou `localhost`.

## Testes

Testes unitários (seed encode/decode):

```bash
node scripts/test-seed.mjs
```

## Permissões

O app pede, mediante ação do usuário:
- Microfone (Memory Catcher, Privação Sensorial, entrada de áudio)
- Giroscópio/Orientação (Auto-Kick, Áudio 3D, Privação Sensorial)
- Geolocalização (GPS + clima)

Coordenadas são enviadas à API Open-Meteo apenas quando o GPS é ativado.

## Licença

MIT
