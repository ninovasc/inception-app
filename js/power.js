import { state } from './state.js';

let wakeLock = null;
let mediaSessionSet = false;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    if (wakeLock) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch (e) {
    wakeLock = null;
  }
}

export async function releaseWakeLock() {
  try { if (wakeLock) await wakeLock.release(); } catch (e) {}
  wakeLock = null;
}

export function setupMediaSession() {
  if (!('mediaSession' in navigator) || mediaSessionSet) return;
  mediaSessionSet = true;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'PASIV Engine',
      artist: 'Inception',
      album: 'Dream Audio',
      artwork: [
        { src: './assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    });
    navigator.mediaSession.setActionHandler('play', () => {
      if (!state.isPlaying) document.getElementById('masterPlayBtn')?.click();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (state.isPlaying) document.getElementById('masterPlayBtn')?.click();
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      if (state.isPlaying) document.getElementById('masterPlayBtn')?.click();
    });
  } catch (e) {}
}

export function setMediaPlaybackState(playing) {
  if (!('mediaSession' in navigator)) return;
  try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (e) {}
}

// Re-acquire wake lock when tab becomes visible again
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.isPlaying) {
    requestWakeLock();
    if (state.audioCtx && state.audioCtx.state === 'suspended') state.audioCtx.resume();
  }
});
