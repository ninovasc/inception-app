// Week 5 TDD: Enhanced mock browser environment with full DOM simulation
// This file provides comprehensive browser API mocks for testing

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { value: 440, setTargetAtTime: () => {} } }; }
  createGain() { return { connect: () => {}, gain: { value: 1, setTargetAtTime: () => {}, cancelScheduledValues: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
  createBiquadFilter() { return { connect: () => {}, frequency: { value: 1000 }, type: 'lowpass' }; }
  createPanner() { return { connect: () => {}, pan: { value: 0, setTargetAtTime: () => {} }, positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 } }; }
  createStereoPanner() { return { connect: () => {}, pan: { value: 0, setTargetAtTime: () => {} } }; }
  createDelay() { return { connect: () => {}, delayTime: { value: 0, setTargetAtTime: () => {} } }; }
  createConvolver() { return { connect: () => {}, buffer: null }; }

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

  createAnalyser() { return { connect: () => {}, fftSize: 128, frequencyBinCount: 64, getByteFrequencyData: () => {} }; }
  createMediaStreamSource() { return { connect: () => {}, disconnect: () => {} }; }
  createScriptProcessor() { return { connect: () => {}, onaudioprocess: null }; }
  close() { this.state = 'closed'; }
}

// Enhanced mock element factory
function createMockElement(id, tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    id: id || '',
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute: () => {},
    getAttribute: () => null,
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
    offsetHeight: 100
  };
  return el;
}

// Mock document with element registry
const elementRegistry = new Map();
const mockDocument = {
  createElement: (tag) => createMockElement('', tag),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  getElementById: (id) => {
    if (!elementRegistry.has(id)) {
      elementRegistry.set(id, createMockElement(id));
    }
    return elementRegistry.get(id);
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { appendChild: () => {} },
  head: { appendChild: () => {} },
  getComputedStyle: () => ({ display: 'none' })
};

// Mock window
const mockWindow = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  document: mockDocument,
  navigator: {
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [] }),
      getDisplayMedia: async () => ({ getAudioTracks: () => [], getVideoTracks: () => [], getTracks: () => [] })
    },
    geolocation: {
      watchPosition: (success, error, opts) => { 
        // Don't call success synchronously to avoid network calls
        setTimeout(() => { if (success) success({ coords: { latitude: 0, longitude: 0, speed: 0 } }); }, 0);
        return 1; 
      },
      clearWatch: () => {}
    }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  location: { href: '', reload: () => {} },
  getComputedStyle: () => ({ display: 'none' }),
  screen: { orientation: { lock: () => Promise.resolve() } },
  addEventListener: () => {},
  removeEventListener: () => {},
  APP_VERSION: 50000,
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext
};

// Set globals
global.window = mockWindow;
Object.defineProperty(global, 'localStorage', { value: mockWindow.localStorage, writable: true, configurable: true });
Object.defineProperty(global, 'sessionStorage', { value: mockWindow.sessionStorage, writable: true, configurable: true });
global.document = mockDocument;
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
Object.defineProperty(global, 'navigator', { value: mockWindow.navigator, writable: true, configurable: true });
global.getComputedStyle = mockWindow.getComputedStyle;
global.screen = mockWindow.screen;
// Mock fetch to prevent real network calls
global.fetch = async () => ({
  json: async () => ({ current: { rain: 0, is_day: 1 } }),
  ok: true,
  status: 200
});

// Export for use in tests
export { mockWindow, mockDocument, MockAudioContext, createMockElement, elementRegistry };