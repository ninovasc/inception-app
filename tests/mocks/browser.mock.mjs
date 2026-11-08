// tests/mocks/browser.mock.mjs - Mock Browser Environment for Testing
// Mock completo do navegador para testes unitários

// Mock AudioContext
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = { connect: () => {} };
    this.sampleRate = 44100;
    this.baseLatency = 0.01;
    this.outputLatency = 0.01;
  }

  createOscillator() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      frequency: { value: 440, setTargetAtTime: () => {}, cancelScheduledValues: () => {} },
      detune: { value: 0 },
      type: 'sine',
      onended: null,
    };
  }

  createGain() {
    return {
      connect: () => {},
      disconnect: () => {},
      gain: { value: 1, setTargetAtTime: () => {}, cancelScheduledValues: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
    };
  }

  createBiquadFilter() {
    return {
      connect: () => {},
      disconnect: () => {},
      frequency: { value: 1000, setTargetAtTime: () => {} },
      type: 'lowpass',
      Q: { value: 1 },
      gain: { value: 0 },
    };
  }

  createPanner() {
    return {
      connect: () => {},
      disconnect: () => {},
      pan: { value: 0, setTargetAtTime: () => {} },
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
    };
  }

  createStereoPanner() {
    return {
      connect: () => {},
      disconnect: () => {},
      pan: { value: 0, setTargetAtTime: () => {} },
    };
  }

  createDelay() {
    return {
      connect: () => {},
      disconnect: () => {},
      delayTime: { value: 0, setTargetAtTime: () => {} },
    };
  }

  createConvolver() {
    return {
      connect: () => {},
      disconnect: () => {},
      buffer: null,
    };
  }

  createBuffer(numChannels, length, sampleRate) {
    const buffer = {
      numberOfChannels: numChannels,
      length: length,
      sampleRate: sampleRate,
      duration: length / sampleRate,
      getChannelData: (channel) => new Float32Array(length),
      copyFromChannel: () => {},
      copyToChannel: () => {},
    };
    return buffer;
  }

  createDynamicsCompressor() {
    return {
      connect: () => {},
      disconnect: () => {},
      threshold: { value: -24, setTargetAtTime: () => {} },
      knee: { value: 30, setTargetAtTime: () => {} },
      ratio: { value: 12, setTargetAtTime: () => {} },
      attack: { value: 0.003, setTargetAtTime: () => {} },
      release: { value: 0.25, setTargetAtTime: () => {} },
    };
  }

  createAnalyser() {
    return {
      connect: () => {},
      disconnect: () => {},
      fftSize: 128,
      frequencyBinCount: 64,
      getByteFrequencyData: (arr) => arr.fill(0),
      getByteTimeDomainData: (arr) => arr.fill(128),
    };
  }

  createMediaStreamSource() {
    return {
      connect: () => {},
      disconnect: () => {},
    };
  }

  createScriptProcessor(bufferSize, inChannels, outChannels) {
    return {
      connect: () => {},
      disconnect: () => {},
      onaudioprocess: null,
      bufferSize: 4096,
    };
  }

  createPeriodicWave(real, imag) {
    return {};
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  decodeAudioData(arrayBuffer) {
    return Promise.resolve({
      duration: 1,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 44100,
      getChannelData: () => new Float32Array(44100),
    });
  }
}

// Mock HTMLElement factory
function createMockElement(id, tag = 'div') {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    id: id || '',
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
      toggle: () => {},
      value: '',
    },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => null,
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    textContent: '',
    innerHTML: '',
    value: '0.5',
    dataset: {},
    disabled: false,
    checked: false,
    options: [],
    scrollHeight: 100,
    offsetHeight: 100,
    type: 'text',
    name: '',
    selectedIndex: -1,
    parentNode: null,
    parentElement: null,
    children: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    previousSibling: null,
  };
  return el;
}

// Element registry for tests
const elementRegistry = new Map();

function getOrCreateElement(id) {
  if (!elementRegistry.has(id)) {
    elementRegistry.set(id, createMockElement(id));
  }
  return elementRegistry.get(id);
}

function clearElementRegistry() {
  elementRegistry.clear();
}

function setElement(id, element) {
  elementRegistry.set(id, element);
}

// Setup global mocks
global.window = global.window || {};
global.document = global.document || document;
global.navigator = global.navigator || {};

Object.assign(global.window, {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  document: {
    createElement: (tag) => document.createElement(tag),
    querySelector: (selector) => null,
    querySelectorAll: (selector) => [],
    getElementById: (id) => getOrCreateElement(id),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
  },
  navigator: {
    mediaDevices: {
      getUserMedia: async (constraints) => ({
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      }),
      getDisplayMedia: async () => ({
        getAudioTracks: () => [],
        getVideoTracks: () => [],
        getTracks: () => [],
      }),
    },
    geolocation: {
      watchPosition: (success, error, opts) => {
        setTimeout(() => {
          if (success) success({ coords: { latitude: 0, longitude: 0, speed: 0 } });
        }, 0);
        return 1;
      },
      clearWatch: () => {},
    },
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  location: { href: '', reload: () => {} },
  getComputedStyle: () => ({ display: 'none' }),
  screen: { orientation: { lock: () => Promise.resolve() } },
  APP_VERSION: 50000,
  fetch: async () => ({ json: async () => ({ current: { rain: 0, is_day: 1 } }), ok: true, status: 200 }),
});

// Export for use in tests
export const mockBrowser = {
  window: global.window,
  document: global.document,
  navigator: global.navigator,
  elementRegistry,
  getOrCreateElement,
  clearElementRegistry,
  setElement,
  MockAudioContext,
};