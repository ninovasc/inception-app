# PLANO — v3.0.0 "13 Mundos" (PASIV Engine)

- **Data:** 2026-11-01
- **Commit base:** `ce5af79` (v2.9.1) — árvore limpa, sem alterações de código neste plano
- **Versão alvo:** v3.0.0 · SW cache `pasiv-v44`
- **Deploy:** https://ninovasc.github.io/inception-app/ (push só na Fase 7)
- **Como usar este arquivo:** qualquer nova sessão deve ler este documento inteiro antes de escrever código. A seção **"ESTADO ATUAL"** (final) diz exatamente onde parou.

---

## 1. Decisões fechadas (confirmadas pelo usuário)

1. **Bonus Track** = versão alternativa de Old Souls (mesma alma sonora, tratamento diferente).
2. **Half Remembered Dream** = fallback/repouso (mundo padrão quando nenhum gatilho ativo).
3. **13 regras de gatilho**, uma por mundo, **destino remapeável** na UI.
4. **Ordem curada** de prioridade (raro/específico primeiro, repouso por último) — não é a ordem das faixas.
5. **Extensão moderada** do synth: camadas opcionais `pluck`, `pulse` (com BPM), `noise` filtrada, `detune/drift`, `binaural`; BPM e progressão por mundo.
6. **UI aprovada:** lista única Mundos + Fonte Sonora (13 linhas, ▼/▶), Voz como dropdown, gatilhos agrupados por sensor, indicador de gatilho ativo.
7. **Easter eggs (528491, Bonus Track) valem como comportamento real** — são regras normais do automode.
8. **Mapas de migração aprovados** (mundos e gatilhos antigos → novos).
9. **MP3 inteligente:** ao trocar de mundo ou entrar em um mundo com fonte MP3, a música **não recomeça do zero** — escolhe um ponto de início aleatório, mas com lógica; ao chegar ao fim, não termina: retoma de um novo ponto. O algoritmo deve buscar aproveitar grande parte da faixa ao longo do tempo (detalhes em 2.9).

---

## 2. Especificação final

### 2.1 Ordem dos 13 mundos (UI, ordem das faixas)

| # | Mundo | Origem/migração |
|---|-------|-----------------|
| 0 | Half Remembered Dream | ← Realidade |
| 1 | We Built Our Own World | ← Lúcido |
| 2 | Dream Is Collapsing | ← Fortaleza (gatilho freefall) |
| 3 | Radical Notion | novo |
| 4 | Old Souls | ← Chuva |
| 5 | 528491 | novo |
| 6 | Mombasa | novo (gatilho motion) |
| 7 | One Simple Idea | novo |
| 8 | Dream Within a Dream | ← Hotel (gatilho silence) |
| 9 | Waiting for a Train | ← Limbo |
| 10 | Paradox | novo |
| 11 | Time | novo |
| 12 | Bonus Track | novo (variação de Old Souls) |

### 2.2 Prioridade curada (automode — primeira regra verdadeira vence)

`Bonus Track → 528491 → Paradox → Dream Is Collapsing → Mombasa → Radical Notion → One Simple Idea → Dream Within a Dream → Old Souls → We Built Our Own World → Waiting for a Train → Time → Half Remembered Dream (fallback)`

Constante nova em config.js: `CURATED_PRIORITY = [12, 5, 10, 2, 6, 3, 7, 8, 4, 1, 9, 11, 0]` (índices da ordem da UI acima — conferir ao implementar).

### 2.3 Identidade sonora (13 presets — extensão moderada)

| Mundo | Base (pad) | Camadas extras | BPM | Progressão |
|-------|-----------|----------------|-----|------------|
| Half Remembered Dream | sine+triangle suave, filtro aberto | noise leve (vento), drift lento | — | Am–Fmaj7 (flutuante) |
| We Built Our Own World | pad warm | **pluck** arpejado, binaural leve | 72 | Cmaj7–Am7–Fmaj7–G |
| Dream Is Collapsing | drones graves, detune largo | **pulse** martelante, noise grave crescendo | 60 | Dm–Bb–Gm–A |
| Radical Notion | saw com filtro fechado (tensão) | **pulse** nervoso | 96 | Em–F (cromático curto) |
| Old Souls | pad melancólico + **pluck** tipo piano | — | 68 | Am–Em–F–C |
| 528491 | sintético seco, cortes curtos | **pulse** em blips (motivo 5-2-8-4-9-1) | 84 | Cm–Ab |
| Mombasa | **pulse** percussivo + **pluck** rápido, filtro abre/fecha | — | 120 | riff em Em |
| One Simple Idea | sine puro, quase estático | binaural sutil | — | pedal C com adicionais lentos |
| Dream Within a Dream | dois pads detunados (camada dentro de camada) | **pulse** esparso | 56 | Gm–Eb–Bb–F |
| Waiting for a Train | pad longo | noise "estação" filtrado, **pulse** tipo trilho | 100 | Am–G–F–Em (descendo) |
| Paradox | pads em loop que não resolve (efeito Shepard via detune) | **pulse** irregular | — | B–C–B–C |
| Time | pad grande, amplo | **pluck** de sino | 48 | Bb–F–Gm–Eb (hino) |
| Bonus Track | mesma base de Old Souls | drift forte (fit-wobble), filtro mais fechado, pulse off-beat | 68 | Gm–Dm–Eb–Bb (Old Souls reharmonizada) |

Regras de motor (audio.js): cada campo é **opcional**; presets sem camada não pagam o custo. Manter de pé as correções v2.7 (feedback fixo, delay wet, compressor suave, fades, `latencyHint: 'playback'`). Limitar vozes simultâneas por preset para não picotar.

### 2.4 Vozes (13 presets)

Estilo por mundo (aplicar no motor de voz existente): HRD narrador grave lento · WBOW construtor pausado · DIC voz em ruína (pitch baixo + echo) · RN sussurro tenso · OS feminina suave · 528491 rádio abafada (bandpass) · Mombasa percussiva/rítmica · OSI quase sopro · DWaD eco duplo distante · WFaT anúncio de estação (flat, pausado) · Paradox pitch deslocado/drift · Time coral grave · Bonus = voz de Old Souls mais abafada.

### 2.5 Regras de gatilho (13, destino remapeável, exclusivas)

Sensores disponíveis/ativos: mic (silêncio, chuva, transientes), acelerômetro (freefall, movimento), orientação (inclinação, plano, invertido), GPS (velocidade), relógio (noite), sessão (duração/início).

| Prioridade | Mundo (destino padrão) | Sensor | Condição |
|-----------|------------------------|--------|----------|
| 1 | Bonus Track | mic | chuva **intensa** (nível > limiar alto por ~6 s) |
| 2 | 528491 | mic | **duas palmas**: 2 transientes > limiar em ≤ 2,5 s |
| 3 | Paradox | orientação | aparelho **invertido** (|beta| > 135°) por ~2 s |
| 4 | Dream Is Collapsing | acelerômetro | freefall (detector existente) |
| 5 | Mombasa | acelerômetro | movimento intenso (variância alta/corrida) |
| 6 | Radical Notion | GPS | velocidade > ~5 m/s (veículo) sem padrão de passos |
| 7 | One Simple Idea | sessão | janela inicial (~25 s) — "a semente no início do sonho" |
| 8 | Dream Within a Dream | mic | silêncio contínuo (~30 s, existente) |
| 9 | Old Souls | mic | chuva moderada (existente) |
| 10 | We Built Our Own World | orientação | aparelho apoiado/plano (|beta|≤15° e |gamma|≤15°) por ~30 s |
| 11 | Waiting for a Train | relógio | noite (existente) |
| 12 | Time | sessão | **recompensa one-shot**: 20 min contínuos → transita para Time por ~60–90 s (1× por sessão), depois volta à avaliação normal. Única exceção à ordem pura (semântica de recompensa). |
| 13 | Half Remembered Dream | — | fallback: nada ativo (também quando um gatilho cessa, com histerese) |

- Exclusividade: **primeira verdadeira na ordem curada**. Sem sobreposição.
- Chuva moderada (9) vs intensa (1): divididas por limiar + prioridade — nunca coexistem.
- Destino de cada regra é **remapeável** na UI (dropdown com nomes, sem números — padrão v2.9.1).
- Histerese/hold por regra para evitar flapping.
- Todas as escolhas (destinos, thresholds, on/off) vão para o **seed** (`g`).

### 2.6 Mapas de migração (aprovados)

Mundos: `Realidade→Half Remembered Dream, Chuva→Old Souls, Hotel→Dream Within a Dream, Fortaleza→Dream Is Collapsing, Limbo→Waiting for a Train, Lúcido→We Built Our Own World`.

Gatilhos: `freefall→Dream Is Collapsing, rain→Old Souls, night→Waiting for a Train, silence→Dream Within a Dream, motion→Mombasa, fallback→Half Remembered Dream`.

### 2.7 Seed v3

- Prefixo `V:3` com **versão de schema** explícita.
- Arrays de comprimento 13 (mundos, synths, vozes, gatilhos).
- Índices de synth/voz em base36 com 2 caracteres.
- Gatilhos: destino por regra em base36 (1 caractere basta, 0–12) + flags on/off + thresholds quando configuráveis.
- Manter chaves `a` (auto/mecânicas) e `g` (gatilhos).
- **Migração automática** de seeds `V:2` (6 mundos) usando os mapas 2.6; links de YouTube preservados como em v2.8.
- Seed inválida → defaults; nunca quebrar o app.

### 2.8 Hardcodes encontrados (verificados hoje — devem sumir/migrar)

- `js/app.js:139-140` — listas fixas `['Realidade','Chuva',...]` e nomes de synth (tornar data-driven de config).
- `js/sensors.js:31,242-246` — `MIC_PRESETS` chaveado por nomes antigos ('Realidade','Fortaleza','Limbo').
- `js/mechanics.js:333` — `setWorldSynth(4, 4)` comentado como "Limbo".
- `js/config.js:21` — `WORLD_SYNTH` com 6 índices e comentário dos mundos antigos.

### 2.9 Reprodução inteligente de MP3 (aprovada)

Aplica-se **apenas** quando a Fonte Sonora é MP3 do usuário. O synth gerativo não muda.

- **Envelope:** ao decodificar o arquivo (`decodeAudioData` em callback — padrão iOS preservado), computar RMS por janelas (~1 s) uma única vez por arquivo; derivar **âncoras candidatas**: janelas com energia musical (acima de limiar relativo ao pico), excluindo ~5% inicial e ~8% final da faixa.
- **Entrar/trocar de mundo:** iniciar de uma âncora escolhida com aleatoriedade ponderada por **menos-recentemente-usada** (LRU) entre as candidatas — aleatório com lógica. Nunca recomeçar do 0:00, salvo faixa muito curta (< ~20 s).
- **Fim da faixa:** não parar. Com ~2 s de antecipação (lookahead), saltar para nova âncora (LRU + aleatório, diferente da atual) com fade curto (método v2.7). O repertório circula, aproveitando a maior parte da música ao longo da sessão.
- **Histórico de âncoras** por arquivo, em memória (não vai para o seed).
- **Fallback seguro:** sem envelope/decode falho/faixa curta → comportamento atual preservado (toca e loopa do início), sem erros.

---

## 3. Restrições invioláveis

- `YOUTUBE_ENABLED = false` e **todo o código do player preservado** (não remover).
- iOS: MP3 com `accept="*"`, `decodeAudioData` em callback, permissões de mic/giroscópio/orientação só com gesto do usuário.
- Não regredir as correções de áudio de v2.7 (sem picotar).
- UI em português, estética mono/minimal, painéis colapsáveis ▼/▶.
- Não remover funcionalidades existentes; Timer de Sonho Lúcido permanece (Lúcido deixa de ser mundo).
- Testes verdes (`node scripts/test-seed.mjs`) antes de **cada** commit de fase.
- `node --check` em todo JS alterado.
- Push apenas na Fase 7 (produção só recebe v3.0.0 completa).

---

## 4. Fases

Cada fase termina com: testes verdes → atualizar "ESTADO ATUAL" deste arquivo → commit com prefixo `fase N:`. Trabalhar na branch `v3-13-mundos` (criada na Fase 0) para não expor estados intermediários.

### Fase 0 — Preparação ✅
- [x] Criar branch `v3-13-mundos`
- [x] (Opcional) tag `v2.9.1-rollback` em `ce5af79`
- [x] Confirmar `node scripts/test-seed.mjs` → 46/46
- [x] Commit: `fase 0: plano v3.0.0 13 mundos` (este arquivo)

### Fase 1 — Dados: 13 mundos + seed v3 ✅
Arquivos: `config.js`, `state.js`, `seed.js`, `scripts/test-seed.mjs`
- [x] `LEVELS` com 13 entradas (ordem 2.1), `WORLD_NAMES`, `WORLD_SYNTH` (13, usando o vocabulário **atual** do motor), `WORLD_VOICE_PRESETS` (13), `CHORD_PROGRESSIONS` (13)
- [ ] `SYNTH_PRESETS` já com campos novos (pluck/pulse/noise/detune/binaural/bpm) como dados — audio.js só os consome na Fase 2 (campos desconhecidos são ignorados hoje: forward-compatible)
- [ ] `TRIGGER_DEFS` → 13 regras (tabela 2.5) com sensor, threshold, hold, destino padrão
- [ ] `CURATED_PRIORITY` (2.2) + defaults/normalização para 13
- [ ] `state.js`: arrays/loops genéricos (sem tamanho fixo 6), `worldTriggers` para 13
- [ ] `seed.js`: encode/decode v3 + migração V:2→V:3 (mapas 2.6) + normalização
- [ ] Testes: migração V:2 (cada mundo/gatilho antigo no destino certo), roundtrip V:3, comprimento 13, remap de gatilho persistido, seed inválida → defaults
- [ ] Neste ponto a UI ainda mostra as listas antigas (ok — corrigido na Fase 4), mas nada pode quebrar
- [ ] `node --check` nos 3 arquivos + testes verdes
- [ ] Commit: `fase 1: dados 13 mundos, 13 regras, seed v3 com migração`

### Fase 2 — Motor de áudio: extensão moderada + 13 presets + MP3 inteligente ✅
Arquivos: `audio.js`
- [x] Implementar camadas opcionais: `pluck`, `pulse` (gate no BPM), `noise` (buffer + filtro + LFO), `detune/drift` (LFO lento), `binaural` (ΔHz baixo, volume contido)
- [x] BPM e progressão por mundo (consumir `CHORD_PROGRESSIONS` de 13)
- [x] Aplicar os 13 `WORLD_SYNTH` e 13 `WORLD_VOICE_PRESETS` (voz incluída aqui)
- [x] Caps de vozes/polyfonia; smoke test local (`scripts/serve.js`, porta 8099): sem picotar, sem clipping, fades OK
- [x] Reprodução inteligente de MP3 (2.9): âncoras por energia, início aleatório-lógico ao trocar de mundo, retomada com lookahead ao fim, LRU + aleatório, fades nos saltos, fallback seguro
- [x] `node --check` + testes
- [x] Commit: `fase 2: motor de synth com camadas, 13 presets e MP3 inteligente`

### Fase 3 — Automode: prioridade curada + novos sensores ✅
Arquivos: `automode.js`, `sensors.js`
- [x] `decideWorld()`: iterar `CURATED_PRIORITY`, primeira verdadeira vence; fallback HRD
- [x] Novos detectores: palmas duplas no mic (transientes), orientação invertida, aparelho plano, GPS veículo, janela de início de sessão, recompensa one-shot Time (20 min → 60–90 s)
- [x] Histerese/hold por regra; manter detecções existentes (freefall, chuva, noite, silêncio, motion)
- [x] Sincronizar voz ao trocar de mundo (comportamento v2.9 mantido)
- [x] `MIC_PRESETS`: migrar chaves para os 13 nomes novos (mantendo os valores equivalentes + presets para os novos mundos)
- [x] `node --check` + testes (102/102, incluindo decideWorld)
- [x] Commit: `fase 3: automode com prioridade curada e 13 gatilhos exclusivos`

### Fase 4 — UI: lista única, vozes em dropdown, gatilhos por sensor ✅
Arquivos: `app.js`, `index.html`
- [x] Remover hardcodes de `app.js:139-140` (listas de config)
- [x] Lista única Mundos + Fonte Sonora: 13 linhas colapsáveis (▼/▶), nome + synth + controles (nome clicável seleciona o mundo; linha do mundo atual destacada)
- [x] Seleção manual de mundo continua funcionando (grade de 13 botões data-driven)
- [x] Voz como dropdown único (13 presets + Personalizado; sincronizado com applyMicPreset)
- [x] Gatilhos agrupados por sensor (tag por linha; ordem curada preservada), destino remapeável (dropdown sem números), on/off, thresholds
- [x] Indicador de gatilho ativo (`#triggerActive`, atualizado pelo automode)
- [x] "Realidade"/"Lúcido" saem da UI como mundos; Timer de Sonho Lúcido permanece
- [x] Help/textos atualizados; sem regressão mobile; 13 players YT ocultos
- [x] Smoke test no browser: 0 erros de console; play/selectLevel/remap/seed OK; migração v2 aplicada ao vivo
- [x] MP3 inteligente validado ao vivo: início offset 10 → salto de fim para âncora 19 com lookahead exato
- [x] `node --check` + testes (109/109, incl. computeAnchors)
- [x] Commit: `fase 4: UI única de 13 mundos, vozes e gatilhos por sensor`

### Fase 5 — Mecânicas e integração restante ✅
Arquivos: `mechanics.js`, demais pontas
- [x] Migrar `mechanics.js:333` (alvo Limbo) para o novo índice (Waiting for a Train) via config
- [x] `grep` global por nomes antigos ('Realidade','Chuva','Hotel','Fortaleza','Limbo','Lúcido','Sub Limbo') — limpar/resolver tudo (restam só: preset legados, labels de gatilhos novos, comentários)
- [x] Conferir `power.js`, `capture.js`, `ui.js`, `youtube.js` intactos
- [x] `node --check` em todos + testes (109/109)
- [x] Commit: `fase 5: mecanicas e integracao nos 13 mundos`

### Fase 6 — QA completo ☐
- [ ] Suite de seed inteira verdes (novo total registrado)
- [ ] Checklist manual: primeiro play/ativação; auto mode exclusivo; mic silêncio/chuva/palmas; orientação invertida/plana; GPS; noite; sessão (início + 20 min); troca manual; voz sincronizada; seed compartilhar/abrir (v2 e v3); MP3: início aleatório-lógico ao trocar de mundo + retomada ao fim sem estalos; YouTube desativado; offline (SW); iOS gestures
- [ ] Commit: `fase 6: QA v3.0.0`

### Fase 7 — Release v3.0.0 ☐
- [ ] Versão v3.0.0 em `index.html` (+ help) e `sw.js` cache `pasiv-v44`
- [ ] README atualizado (13 mundos, gatilhos, seed v3)
- [ ] Marcar fases ✅ neste plano; commit `fase 7: release v3.0.0`
- [ ] Merge na main + push → validar produção (versão, cache, seed de teste)
- [ ] Encerrar servidor local

---

## 5. Protocolo de recuperação (interrupção / perda de contexto)

1. Ler **este arquivo inteiro** (é a fonte da verdade do trabalho).
2. `git log --oneline -10` → commits `fase N:` mostram o que já foi feito; `git status` → trabalho não commitado pertence à fase atual.
3. Rodar `node scripts/test-seed.mjs` — se falhar, a fase atual ficou pela metade: terminá-la antes de avançar.
4. Retomar pelo primeiro checkbox **não marcado** da fase correspondente. **Nunca refazer fases concluídas.**
5. Ao terminar qualquer unidade de trabalho: atualizar "ESTADO ATUAL" abaixo + commit `fase N: ...`.
6. Custo máximo de uma perda de contexto: re-trabalhar **a fase em curso**, nunca as anteriores.

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Áudio picotar com mais camadas | Caps de vozes, camadas opcionais, QA de áudio na Fase 2 (método v2.7) |
| Perda de dados na migração de seeds | Testes dedicados V:2→V:3 na Fase 1 |
| Flapping entre mundos com 13 regras | Histerese/hold por regra + ordem curada + fallback |
| iOS quebrar | Preservar `accept="*"`, decode em callback, gesto para permissões |
| Estados intermediários expostos | Branch `v3-13-mundos`; push só na Fase 7 |
| Hardcodes esquecidos | Grep de nomes antigos na Fase 5 |
| Estalos ao saltar ponto de MP3 | Fades curtos (método v2.7) + lookahead agendado antes do fim |

---

## ESTADO ATUAL

> **Fase concluída:** 0–5 (dados, seed v3, áudio+MP3 inteligente, automode, UI, mecânicas/hardcodes; testes 109/109; smoke test browser limpo)
> **Próximo passo:** Fase 6 — QA completo
> **Última atualização:** 2026-11-01 (Fase 5 commitada; hardcodes eliminados)
