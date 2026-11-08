// Week 5 TDD: Comprehensive mock browser environment
// This file sets up all browser APIs needed for testing

// Mock AudioContext
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
  createAnalyser() { return { connect: () => {}, fftSize: 128, frequencyBinCount: 64, getByteFrequencyData: () => {} }; }
  createMediaStreamSource() { return { connect: () => {}, disconnect: () => {} }; }
  createScriptProcessor() { return { connect: () => {}, onaudioprocess: null }; }
  close() { this.state = 'closed'; }
}

// Mock document
const mockDocument = {
  createElement: (tag) => ({
    tagName: tag.toUpperCase(),
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => null,
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    textContent: '',
    innerHTML: '',
    value: '',
    dataset: {},
    id: '',
    disabled: false
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => ({
    value: '0.5',
    textContent: '',
    style: {},
    dataset: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    appendChild: () => {},
    disabled: false,
    id: id
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { appendChild: () => {} },
  head: { appendChild: () => {} }
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
      getUserMedia: async () => ({}),
      getDisplayMedia: async () => ({ getAudioTracks: () => [], getVideoTracks: () => [], getTracks: () => [] })
    },
    geolocation: {
      watchPosition: () => 1,
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
  APP_VERSION: 50000
};

// Set globals
global.window = mockWindow;
global.localStorage = mockWindow.localStorage;
global.sessionStorage = mockWindow.sessionStorage;
global.document = mockDocument;
global.AudioContext = MockAudioContext;
global.webkitAudioContext = MockAudioContext;
Object.defineProperty(global, 'navigator', { value: mockWindow.navigator, writable: true, configurable: true });
global.getComputedStyle = mockWindow.getComputedStyle;
global.screen = mockWindow.screen;

console.log('Mock browser environment loaded');

export { mockWindow, mockDocument, MockAudioContext };