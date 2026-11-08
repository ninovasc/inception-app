// tests/mocks/audio.mock.mjs - Mock específico do AudioContext para testes
// Mock completo do Web Audio API

export class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {
      connect: () => {},
      disconnect: () => {},
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
    };
    this.sampleRate = 44100;
    this.baseLatency = 0.01;
    this.outputLatency = 0.01;
    this.listener = {
      positionX: { value: 0, setTargetAtTime: () => {} },
      positionY: { value: 0, setTargetAtTime: () => {} },
      positionZ: { value: 0, setTargetAtTime: () => {} },
      forwardX: { value: 0, setTargetAtTime: () => {} },
      forwardY: { value: 0, setTargetAtTime: () => {} },
      forwardZ: { value: 0, setTargetAtTime: () => {} },
      upX: { value: 0, setTargetAtTime: () => {} },
      upY: { value: 0, setTargetAtTime: () => {} },
      upZ: { value: 0, setTargetAtTime: () => {} },
    };
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, setTargetAtTime: () => {}, cancelScheduledValues: () => {} },
      detune: { value: 0, setValueAtTime: () => {}, cancelScheduledValues: () => {} },
      onended: null,
      connect: (dest) => dest,
      disconnect: () => {},
      start: (when) => {},
      stop: (when) => {},
    };
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, setTargetAtTime: () => {}, cancelScheduledValues: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, setTargetAtTime: () => {}, cancelScheduledValues: () => {} },
      Q: { value: 1, setValueAtTime: () => {} },
      gain: { value: 0, setValueAtTime: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createPanner() {
    return {
      panningModel: 'HRTF',
      distanceModel: 'inverse',
      refDistance: 1,
      maxDistance: 10000,
      rolloffFactor: 1,
      coneInnerAngle: 360,
      coneOuterAngle: 0,
      coneOuterGain: 0,
      positionX: { value: 0, setValueAtTime: () => {} },
      positionY: { value: 0, setValueAtTime: () => {} },
      positionZ: { value: 0, setValueAtTime: () => {} },
      orientationX: { value: 1, setValueAtTime: () => {} },
      orientationY: { value: 0, setValueAtTime: () => {} },
      orientationZ: { value: 0, setValueAtTime: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createStereoPanner() {
    return {
      pan: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createDelay(maxDelayTime = 1) {
    return {
      delayTime: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createConvolver() {
    return {
      buffer: null,
      normalize: true,
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createAnalyser() {
    const buffer = new Uint8Array(128);
    buffer.fill(128);
    return {
      fftSize: 128,
      frequencyBinCount: 64,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      getByteFrequencyData: (arr) => arr.set(buffer),
      getByteTimeDomainData: (arr) => arr.set(buffer),
      getFloatFrequencyData: (arr) => arr.fill(0),
      getFloatTimeDomainData: (arr) => arr.fill(0),
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createMediaStreamSource(stream) {
    return {
      mediaStream: stream,
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createMediaStreamDestination() {
    return {
      stream: { getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [] },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createScriptProcessor(bufferSize = 4096, inChannels = 2, outChannels = 2) {
    return {
      bufferSize,
      numberOfInputs: inChannels,
      numberOfOutputs: outChannels,
      onaudioprocess: null,
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createPeriodicWave(real, imag) {
    return {};
  }

  createChannelMerger(numberOfInputs = 6) {
    return {
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createChannelSplitter(numberOfOutputs = 6) {
    return {
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createWaveShaper() {
    return {
      curve: null,
      oversample: 'none',
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  createDynamicsCompressor() {
    return {
      threshold: { value: -24, setValueAtTime: () => {} },
      knee: { value: 30, setValueAtTime: () => {} },
      ratio: { value: 12, setValueAtTime: () => {} },
      attack: { value: 0.003, setValueAtTime: () => {} },
      release: { value: 0.25, setValueAtTime: () => {} },
      connect: (dest) => dest,
      disconnect: () => {},
    };
  }

  decodeAudioData(audioData) {
    return Promise.resolve({
      duration: 1,
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 44100,
      getChannelData: (channel) => new Float32Array(44100),
      copyFromChannel: () => {},
      copyToChannel: () => {},
    });
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Mock AudioContext constructor
export const mockAudioContext = new MockAudioContext();

// Mock navigator.mediaDevices
export const mockMediaDevices = {
  getUserMedia: async (constraints) => {
    return {
      getTracks: () => [{ stop: () => {}, kind: 'audio' }],
      getAudioTracks: () => [{ stop: () => {} }],
      getVideoTracks: () => [],
    };
  },
  getDisplayMedia: async (constraints) => {
    return {
      getTracks: () => [{ stop: () => {}, kind: 'video' }],
      getAudioTracks: () => [{ stop: () => {} }],
      getVideoTracks: () => [{ stop: () => {} }],
    };
  },
  enumerateDevices: async () => [
    { deviceId: 'mic1', kind: 'audioinput', label: 'Mock Microphone', groupId: 'group1' },
    { deviceId: 'speaker1', kind: 'audiooutput', label: 'Mock Speaker', groupId: 'group1' },
  ],
};

// Mock navigator
export const mockNavigator = {
  mediaDevices: mockMediaDevices,
  geolocation: {
    watchPosition: (success, error, options) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 0,
            longitude: 0,
            altitude: null,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }, 0);
      return 1;
    },
    clearWatch: (id) => {},
    getCurrentPosition: (success, error, options) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 0,
            longitude: 0,
            altitude: null,
            accuracy: 10,
            altitudeAccuracy: null,
            heading: null,
            speed: 0,
          },
          timestamp: Date.now(),
        });
      }, 0);
    },
  },
  userAgent: 'Mozilla/5.0 (Test) AppleWebKit/537.36',
  onLine: true,
};

// Mock window
export const mockWindow = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  localStorage: {
    _data: {},
    getItem: (key) => mockWindow.localStorage._data[key] || null,
    setItem: (key, value) => { mockWindow.localStorage._data[key] = value; },
    removeItem: (key) => { delete mockWindow.localStorage._data[key]; },
    clear: () => { mockWindow.localStorage._data = {}; },
    get length() { return Object.keys(mockWindow.localStorage._data).length; },
    key: (index) => Object.keys(mockWindow.localStorage._data)[index] || null,
  },
  sessionStorage: {
    _data: {},
    getItem: (key) => mockWindow.sessionStorage._data[key] || null,
    setItem: (key, value) => { mockWindow.sessionStorage._data[key] = value; },
    removeItem: (key) => { delete mockWindow.sessionStorage._data[key]; },
    clear: () => { mockWindow.sessionStorage._data = {}; },
    get length() { return Object.keys(mockWindow.sessionStorage._data).length; },
    key: (index) => Object.keys(mockWindow.sessionStorage._data)[index] || null,
  },
  navigator: mockNavigator,
  document: {
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
      setAttribute: () => {},
      getAttribute: () => null,
      appendChild: () => {},
      removeChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      textContent: '',
      innerHTML: '',
      value: '',
      dataset: {},
      disabled: false,
      checked: false,
      options: [],
      scrollHeight: 100,
      offsetHeight: 100,
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: (id) => null,
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild: () => {}, querySelector: () => null },
    head: { appendChild: () => {} },
  },
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  location: { href: 'http://localhost', reload: () => {} },
  getComputedStyle: () => ({ display: 'none' }),
  screen: { orientation: { lock: () => Promise.resolve() } },
  addEventListener: () => {},
  removeEventListener: () => {},
  APP_VERSION: 50000,
  fetch: async (url, options) => ({
    ok: true,
    status: 200,
    json: async () => ({ current: { rain: 0, is_day: 1 } }),
    text: async () => '',
    blob: async () => new Blob(),
  }),
  matchMedia: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
};

// Setup function to install mocks globally
export function setupAudioMocks() {
  global.window = global.window || {};
  Object.assign(global.window, mockWindow);
  global.AudioContext = MockAudioContext;
  global.webkitAudioContext = MockAudioContext;
  global.navigator = mockNavigator;
  
  // Ensure document exists
  if (!global.document) {
    global.document = mockWindow.document;
  }
}

// Teardown function
export function teardownAudioMocks() {
  // Restore original globals if needed
  delete global.AudioContext;
  delete global.webkitAudioContext;
}

// Export mock browser object compatible with browser.js
export const mockBrowser = {
  getElement: (id) => mockWindow.document.getElementById(id),
  querySelector: (selector) => mockWindow.document.querySelector(selector),
  querySelectorAll: (selector) => mockWindow.document.querySelectorAll(selector),
  createElement: (tag) => mockWindow.document.createElement(tag),
  addEventListener: (type, handler, options) => mockWindow.addEventListener(type, handler, options),
  removeEventListener: (type, handler, options) => mockWindow.removeEventListener(type, handler, options),
  onDocumentReady: (callback) => callback(),
  createAudioContext: () => new MockAudioContext(),
  getAudioContext: () => mockAudioContext,
  setAudioContext: (ctx) => {},
  resumeAudioContext: () => Promise.resolve(),
  closeAudioContext: () => {},
  getUserMedia: (constraints) => mockMediaDevices.getUserMedia(constraints),
  getDisplayMedia: (constraints) => mockMediaDevices.getDisplayMedia(constraints),
  watchPosition: (success, error, options) => mockNavigator.geolocation.watchPosition(success, error, options),
  clearWatch: (id) => mockNavigator.geolocation.clearWatch(id),
  onVisibilityChange: (handler) => {},
  removeVisibilityChange: () => {},
  onPageHide: (handler) => {},
  onPageShow: (handler) => {},
  requestFullscreen: (element) => Promise.resolve(),
  exitFullscreen: () => Promise.resolve(),
  lockOrientation: (orientation) => Promise.resolve(),
  requestWakeLock: (type) => Promise.resolve({ release: () => {} }),
  releaseWakeLock: () => Promise.resolve(),
  writeText: (text) => Promise.resolve(),
  storage: {
    local: mockWindow.localStorage,
    session: mockWindow.sessionStorage,
  },
  getViewportSize: () => ({ width: 1024, height: 768 }),
  onResize: (handler) => { window.addEventListener('resize', handler); return () => window.removeEventListener('resize', handler); },
  getDevicePixelRatio: () => 1,
  isMobile: () => false,
  isIOS: () => false,
  isOnline: () => true,
  onOnline: (handler) => { window.addEventListener('online', handler); return () => window.removeEventListener('online', handler); },
  onOffline: (handler) => { window.addEventListener('offline', handler); return () => window.removeEventListener('offline', handler); },
  now: () => performance.now(),
  measure: (name, startMark, endMark) => 0,
};

export default { MockAudioContext, mockAudioContext, mockMediaDevices, mockNavigator, mockWindow, setupAudioMocks, teardownAudioMocks, mockBrowser };