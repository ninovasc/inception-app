# Plano de Refatoração Arquitetural - PASIV Engine

## Visão Geral
Este documento detalha o plano de refatoração arquitetural para melhorar a testabilidade, manutenibilidade e cobertura de testes do PASIV Engine, mantendo total compatibilidade com a funcionalidade existente.

---

## 1. Decisões de Arquitetura

### 1.1 Injeção de Dependências - Opção A (Parâmetro de Função)
- **Escolha**: Parâmetro de função explícito
- **Razão**: Mais explícito, mais fácil de testar, sem container mágico
- **Exemplo**:
  ```javascript
  // Antes
  export function toggleMic() {
    const audio = await import('./audio.js');
    audio.initAudio();
  }

  // Depois
  export function toggleMic(audioModule) {
    audioModule.initAudio();
  }
  ```

---

### 1.2 Browser Abstraction Layer - Todas as APIs
Todas as APIs do navegador serão centralizadas em `js/browser.js`:

| API Atual | Nova Função | Arquivo Origem |
|-----------|-------------|----------------|
| `document.getElementById(id)` | `browser.getElement(id)` | Vários |
| `document.querySelector(selector)` | `browser.querySelector(selector)` | Vários |
| `document.querySelectorAll(selector)` | `browser.querySelectorAll(selector)` | Vários |
| `window.addEventListener(type, handler)` | `browser.addEventListener(type, handler)` | Vários |
| `window.removeEventListener(type, handler)` | `browser.removeEventListener(type, handler)` | Vários |
| `navigator.mediaDevices.getUserMedia()` | `browser.getUserMedia(constraints)` | `sensors.js` |
| `navigator.geolocation.watchPosition()` | `browser.watchPosition(callback, error, opts)` | `sensors.js` |
| `AudioContext / webkitAudioContext` | `browser.createAudioContext()` | `audio/core.js` |
| `navigator.geolocation.clearWatch()` | `browser.clearWatch(id)` | `sensors.js` |

---

## 2. Ordem de Refatoração

### Ordem Prioritária (mantida conforme solicitado):
1. **`js/audio.js`** - Mais complexo, mais dependências de window/state
2. **`js/sensors.js`** - Depende muito de navigator e window
3. **`js/ui/commonUI.js`** - Acessa DOM diretamente em muitas funções
3. **`js/ui/pomodoroUI.js`** - Acessa DOM diretamente
4. **`js/ui/sleepUI.js`** - Acessa DOM diretamente

---

## 3. Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Propósito |
|---------|-----------|
| `js/browser.js` | Abstração de APIs do navegador |
| `tests/mocks/browser.mock.mjs` | Mock completo do browser para testes |
| `tests/mocks/audio.mock.mjs` | Mock específico do AudioContext |
| `tests/unit/` | Pasta para testes de unidade |
| `tests/integration/` | Pasta para testes de integração |

### Arquivos a Modificar (em ordem)
1. `js/browser.js` - **NOVO**: Abstração de APIs do navegador
2. `tests/mocks/browser.mock.mjs` - **NOVO**: Mock completo do browser
3. `js/audio.js` - Injetar dependências, usar browser.js
4. `js/sensors.js` - Injetar dependências, usar browser.js
5. `js/ui/commonUI.js` - Usar browser.js
4. `js/ui/pomodoroUI.js` - Usar browser.js
5. `js/ui/sleepUI.js` - Usar browser.js
6. `js/app.js` - Injetar dependências nos módulos

---

## 4. Estrutura de Mocks e Testes

### `tests/mocks/browser.mock.mjs`
```javascript
export const mockBrowser = {
  document: {
    getElementById: (id) => ({ value: '', textContent: '', style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }, setAttribute: () => {}, getAttribute: () => null, addEventListener: () => {}, removeEventListener: () => {}, disabled: false, id: '', dataset: {}, classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} } }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }, appendChild: () => {} }),
  },
  window: {
    addEventListener: () => {},
    removeEventListener: () => {},
    AudioContext: class {},
    webkitAudioContext: class {},
  },
  navigator: {
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [] }),
      getDisplayMedia: async () => ({ getAudioTracks: () => [], getVideoTracks: () => [], getTracks: () => [] }),
    },
    geolocation: {
      watchPosition: (success, error, opts) => { setTimeout(() => success({ coords: { latitude: 0, longitude: 0, speed: 0 } }), 0); return 1; },
      clearWatch: () => {},
    },
  },
};
```

### Estrutura de Pastas de Testes
```
tests/
├── unit/          # Testes de unidade (funções puras)
│   ├── audio.test.mjs
│   ├── sensors.test.mjs
│   └── mechanics.test.mjs
├── integration/   # Testes de integração (múltiplos módulos)
│   ├── audio-sensors.test.mjs
│   └── state-audio.test.mjs
├── e2e/           # Testes E2E (já existem)
│   └── ...
└── mocks/         # Mocks do browser
    ├── browser.mock.mjs
    └── audio.mock.mjs
```

---

## 4. Critérios de Aceitação por Etapa

### Semana 1 - Parte 1: Browser Abstraction Layer
- [ ] `js/browser.js` criado com pelo menos 8 funções
- [ ] `tests/mocks/browser.mock.mjs` criado
- [ ] `js/audio.js` refatorado para usar `browser.js` (pelo menos 3 funções)
- [ ] `js/sensors.js` refatorado para usar `browser.js` (pelo menos 3 funções)
- +10 testes unitários passando
- TypeScript check passando

### Semana 1 - Parte 2: Injeção de Dependências
- [ ] `audio.js` aceita dependências via parâmetro
- [ ] `sensors.js` aceita dependências via parâmetro
- [ ] `app.js` injeta dependências nos módulos
- +10 testes unitários passando
- TypeScript check passando

### Semana 1 - Parte 3: UI Modules
- [ ] `commonUI.js` refatorado para usar `browser.js`
- [ ] `pomodoroUI.js` refatorado para usar `browser.js`
- [ ] `sleepUI.js` refatorado para usar `browser.js`
- +15 testes unitários passando
- TypeScript check passando

---

## 5. Regras de Ouro

1. **Não quebrar a funcionalidade existente** - todos os testes E2E devem continuar passando
2. **Não quebrar a API pública** - funções exportadas mantêm a mesma assinatura
3. **Cada commit deve ser testável** - não deixe código sem teste
4. **Não mude o comportamento** - apenas como o código acessa dependências
5. **TypeScript check sempre passando** - `npx tsc --noEmit -p tsconfig.pure.json`

---

## 6. Exemplos Práticos

### Antes (difícil de testar)
```javascript
export function updateFromSliders(forceUpdate) {
  const speed = document.getElementById('sliderSpeed').value;
  audio.setSpeed(speed);
  document.getElementById('speedVal').textContent = speed;
}
```

### Depois (testável)
```javascript
// Puro - testável
export function calcularNovoValor(valorAtual, novoValor) {
  return Math.min(Math.max(parseFloat(novoValor), 0), 1.0);
}

// Efeito colateral - testável com mock
export function aplicarValorSlider(elementId, valor) {
  const el = document.getElementById(elementId);
  if (el) el.value = valor;
}

// Orquestração - testável com mocks
export function updateFromSliders(worldIdx, modo, getElement, setAudioParam) {
  const speedEl = getElement('sliderSpeed');
  const novoValor = calcularNovoValor(0, speedEl.value);
  setAudioParam('speed', novoValor);
  aplicarValorSlider('speedVal', novoValor);
}
```

---

## 7. Ordem de Implementação

### Semana 1 - Parte 1: Browser Abstraction Layer
1. Criar `js/browser.js` com 8+ funções
2. Criar `tests/mocks/browser.mock.mjs`
3. Refatorar `js/audio.js` para usar `browser.js` (3+ funções)
4. Refatorar `js/sensors.js` para usar `browser.js` (3+ funções)
5. +10 testes unitários passando
6. TypeScript check passando

### Semana 1 - Parte 2: Injeção de Dependências
- `audio.js` aceita dependências via parâmetro
- `sensors.js` aceita dependências via parâmetro
- `app.js` injeta dependências nos módulos
- +10 testes unitários passando

### Semana 1 - Parte 3: UI Modules
- `commonUI.js` usa `browser.js`
- `pomodoroUI.js` usa `browser.js`
- `sleepUI.js` usa `browser.js`

---

## Checklist de Decisões (Já Definidas)

- [x] Injeção de dependência: **Opção A** (parâmetro de função)
- [x] Browser APIs: **Todas** no `browser.js`
- [x] Ordem dos módulos: `audio.js` → `sensors.js` → `commonUI.js` → `pomodoroUI.js` → `sleepUI.js`
- [x] Iniciar: **Agora**
- [x] Documentar plano: **Este arquivo**

---

## Próximos Passos Imediatos

1. ✅ Criar este arquivo de plano
2. ⏳ Criar `js/browser.js` com todas as APIs listadas
3. ⏳ Criar `tests/mocks/browser.mock.mjs`
3. ⏳ Refatorar `js/audio.js` para usar `browser.js`
4. ⏳ Refatorar `js/sensors.js` para usar `browser.js`
5. ⏳ Criar testes unitários básicos
5. ⏳ Rodar TypeScript check + todos os testes