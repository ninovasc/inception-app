// js/browser.js - Browser API Abstraction Layer
// Centraliza todas as chamadas às APIs do navegador para facilitar testes

// Elementos do DOM
export function getElement(id) {
  return document.getElementById(id);
}

export function querySelector(selector) {
  return document.querySelector(selector);
}

export function querySelectorAll(selector) {
  return document.querySelectorAll(selector);
}

export function createElement(tag) {
  return document.createElement(tag);
}

// Event Listeners
export function addEventListener(type, handler, options) {
  window.addEventListener(type, handler, options);
}

export function removeEventListener(type, handler, options) {
  window.removeEventListener(type, handler, options);
}

// Document Events
export function onDocumentReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Audio Context
let _audioContext = null;

export function createAudioContext() {
  /** @type {typeof AudioContext} */
  // @ts-expect-error webkitAudioContext exists on WebKit browsers
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  _audioContext = new AudioCtx();
  return _audioContext;
}

export function getAudioContext() {
  if (!_audioContext) {
    return createAudioContext();
  }
  return _audioContext;
}

export function setAudioContext(ctx) {
  _audioContext = ctx;
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
}

export function closeAudioContext() {
  if (_audioContext && _audioContext.state !== 'closed') {
    _audioContext.close();
    _audioContext = null;
  }
}

// Media Devices
export async function getUserMedia(constraints) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('getUserMedia not supported');
  }
  return navigator.mediaDevices.getUserMedia(constraints);
}

export async function getDisplayMedia(constraints) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('getDisplayMedia not supported');
  }
  return navigator.mediaDevices.getDisplayMedia(constraints);
}

// Geolocation
let _geolocationWatchId = null;

export function watchPosition(success, error, options) {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }
  _geolocationWatchId = navigator.geolocation.watchPosition(
    (pos) => success(pos),
    (err) => error?.(err),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000, ...options }
  );
  return _geolocationWatchId;
}

export function clearWatch() {
  if (_geolocationWatchId !== null) {
    navigator.geolocation.clearWatch(_geolocationWatchId);
    _geolocationWatchId = null;
  }
}

// Page Visibility
let _visibilityHandler = null;

export function onVisibilityChange(handler) {
  _visibilityHandler = handler;
  document.addEventListener('visibilitychange', _visibilityHandler);
}

export function removeVisibilityChange() {
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
}

// Page Lifecycle
export function onPageHide(handler) {
  window.addEventListener('pagehide', handler);
}

export function onPageShow(handler) {
  window.addEventListener('pageshow', handler);
}

// Fullscreen
export async function requestFullscreen(element) {
  if (element.requestFullscreen) {
    return element.requestFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

export function exitFullscreen() {
  if (document.exitFullscreen) {
    return document.exitFullscreen();
  }
  return Promise.reject(new Error('Fullscreen not supported'));
}

// Orientation
export async function lockOrientation(orientation) {
  if (screen.orientation && screen.orientation.lock) {
    return screen.orientation.lock(orientation);
  }
  return Promise.reject(new Error('Orientation lock not supported'));
}

// Wake Lock
let _wakeLock = null;

export async function requestWakeLock(type = 'screen') {
  if ('wakeLock' in navigator && navigator.wakeLock) {
    try {
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', () => { _wakeLock = null; });
      return _wakeLock;
    } catch (e) {
      // Wake lock not available
    }
  }
  return null;
}

export async function releaseWakeLock() {
  if (_wakeLock) {
    try {
      await _wakeLock.release();
    } catch (e) {
      // Ignore
    }
    _wakeLock = null;
  }
}

// Clipboard
export async function writeText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

// Storage
export const storage = {
  local: {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear(),
  },
  session: {
    getItem: (key) => sessionStorage.getItem(key),
    setItem: (key, value) => sessionStorage.setItem(key, value),
    removeItem: (key) => sessionStorage.removeItem(key),
    clear: () => sessionStorage.clear(),
  },
};

// Viewport
export function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function onResize(handler) {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

// Device Info
export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;
}

export function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Network
export function isOnline() {
  return navigator.onLine;
}

export function onOnline(handler) {
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

export function onOffline(handler) {
  window.addEventListener('offline', handler);
  return () => window.removeEventListener('offline', handler);
}

// Performance
export function now() {
  return performance.now();
}

export function measure(name, startMark, endMark) {
  performance.mark(endMark);
  performance.measure(name, startMark, endMark);
  return performance.getEntriesByName(name, 'measure')[0]?.duration || 0;
}

// Export everything as default object as well
const browser = {
  getElement,
  querySelector,
  querySelectorAll,
  createElement,
  addEventListener,
  removeEventListener,
  onDocumentReady,
  createAudioContext,
  getAudioContext,
  setAudioContext,
  resumeAudioContext,
  closeAudioContext,
  getUserMedia,
  getDisplayMedia,
  watchPosition,
  clearWatch,
  onVisibilityChange,
  removeVisibilityChange,
  onPageHide,
  onPageShow,
  requestFullscreen,
  exitFullscreen,
  lockOrientation,
  requestWakeLock,
  releaseWakeLock,
  writeText,
  storage,
  getViewportSize,
  onResize,
  getDevicePixelRatio,
  isMobile,
  isIOS,
  isOnline,
  onOnline,
  onOffline,
  now,
  measure,
};

export default browser;