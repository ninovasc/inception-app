# PASIV Engine (inception-app)

Motor de áudio psicoacústico inspirado nos níveis de sonho de *A Origem (Inception)*.
App web estático, mobile-first, instalável como PWA, publicado via GitHub Pages.

**Demo:** https://ninovasc.github.io/inception-app/

## Funcionalidades

- **13 mundos** nomeados pelas faixas da OST: *Half Remembered Dream, We Built Our Own World, Dream Is Collapsing, Radical Notion, Old Souls, 528491, Mombasa, One Simple Idea, Dream Within a Dream, Waiting for a Train, Paradox, Time, Bonus Track*. Cada mundo ajusta velocidade, filtro, delay e reverb, e tem seu próprio sintetizador, voz e progressão de acordes/BPM.
- **Fonte sonora por mundo**: cada mundo escolhe entre 18 sintetizadores (5 legados + 13 novos com camadas pluck/pulse/noise/drift/binaural/BPM) ou um MP3 próprio, com volume independente. **MP3 inteligente**: ao trocar de mundo a música retoma de um ponto musical aleatório (não do zero); ao terminar, continua de outro ponto — a faixa inteira circula. (A fonte YouTube está temporariamente indisponível; o código do player foi preservado em `js/youtube.js`.)
- **Efeitos DSP** via Web Audio API: lowpass, delay estéreo com feedback, convolver reverb, dry/wet, stereo panner, compressor.
- **"O Chute" (Kick)**: fanfarra de metais + BRAAAM grave, desce para *Waiting for a Train*.
- **Sensores reais**: microfone, giroscópio e GPS (clima via Open-Meteo).
- **Modo Automático** (ligado por padrão): 13 gatilhos exclusivos avaliados em ordem curada (prioridade: Chuva intensa → Palmas → Invertido → Queda livre → Movimento → Veículo → Início da sessão → Silêncio → Chuva → Aparelho apoiado → Noite → Sessão longa → Sem gatilho). Só o primeiro verdadeiro escolhe o mundo. Destinos são remapeáveis pela UI e vão para o seed. Easter eggs reais: duas palmas disparam *528491*; chuva intensa no mic dispara *Bonus Track*; 20 min de sessão rendem uma passagem por *Time*.
- **Mecânicas psicoacústicas**: Memory Catcher (Ecos do Ambiente), Auto-Kick, Áudio Espacial 3D, Timer de Sonho Lúcido (descida progressiva), Privação Sensorial (modo batimento após 15s silêncio + celular virado). Mecânicas ligadas por padrão (exceto Timer), ativam no primeiro play para respeitar permissões iOS.
- **Seed v3**: serializa todo o estado (incluindo 13 mundos, 13 gatilhos, thresholds, voz) em string compartilhável. Migração automática de seeds v2 (6 mundos) preservando links YouTube.

## Estrutura

```
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/styles.css
├── js/
│   ├── app.js          # bootstrap, wiring, globals
│   ├── state.js        # estado compartilhado (13 mundos)
│   ├── config.js       # constantes (13 níveis, 18 presets, 13 gatilhos, migração)
│   ├── audio.js        # grafo de áudio, DSP, synth camadas, MP3 inteligente
│   ├── sensors.js      # mic, motion, gps, detectores novos (palmas, invertido, plano, veículo)
│   ├── mechanics.js    # mecânicas psicoacústicas
│   ├── automode.js     # modo automático (13 regras, prioridade curada, exclusividade)
│   ├── seed.js         # serialização/restauração v3 + migração v2→v3
│   └── ui.js           # helpers de UI
├── assets/icons/       # ícones PWA
└── scripts/            # utilitários (test-seed.mjs, serve.js)
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

Testes unitários (seed encode/decode, migração v2→v3, decideWorld, computeAnchors):

```bash
node scripts/test-seed.mjs
```

## Permissões

O app pede, mediante ação do usuário:
- Microfone (Memory Catcher, Privação Sensorial, entrada de áudio, detecção de silêncio/chuva/palmas)
- Giroscópio/Orientação (Auto-Kick, Áudio 3D, Privação Sensorial, detecção invertida/apoiada)
- Geolocalização (GPS + clima + detecção de veículo)

Coordenadas são enviadas à API Open-Meteo apenas quando o GPS é ativado.

## Licença

MIT