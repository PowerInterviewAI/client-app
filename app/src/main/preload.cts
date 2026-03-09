// Tell TypeScript to compile this file as CommonJS despite package.json "type": "module"
// This is the standard approach for Electron preload scripts
import { clear } from 'console';
import { contextBridge, ipcRenderer } from 'electron';
import { get } from 'http';

// Build the API object once so it can be exposed under multiple names
const electronApi = {
  // Hotkey scroll events
  onHotkeyScroll: (callback: (section: string, direction: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, section: string, direction: string) =>
      callback(section, direction);
    ipcRenderer.on('hotkey-scroll', handler);
    return () => ipcRenderer.removeListener('hotkey-scroll', handler);
  },

  // Hotkey stop assistant event
  onHotkeyStopAssistant: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey-stop-assistant', handler);
    return () => ipcRenderer.removeListener('hotkey-stop-assistant', handler);
  },

  // Configuration management
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates: any) => ipcRenderer.invoke('config:update', updates),
  },

  // Authentication management
  auth: {
    signup: (username: string, email: string, password: string) =>
      ipcRenderer.invoke('auth:signup', username, email, password),
    login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePassword: (currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke('auth:change-password', currentPassword, newPassword),
  },

  // Payment management
  payment: {
    getPlans: () => ipcRenderer.invoke('payment:get-plans'),
    getCurrencies: () => ipcRenderer.invoke('payment:get-currencies'),
    create: (data: any) => ipcRenderer.invoke('payment:create', data),
    getStatus: (paymentId: string) => ipcRenderer.invoke('payment:get-status', paymentId),
    getHistory: () => ipcRenderer.invoke('payment:get-history'),
    getCredits: () => ipcRenderer.invoke('payment:get-credits'),
  },

  // App state management
  appState: {
    get: () => ipcRenderer.invoke('app:get-state'),
    update: (updates: any) => ipcRenderer.invoke('app:update-state', updates),
  },

  // Listen for pushed app state updates from main
  onAppStateUpdated: (callback: (state: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: any) => callback(state);
    ipcRenderer.on('app-state-updated', handler);
    return () => ipcRenderer.removeListener('app-state-updated', handler);
  },

  // Transcription management
  transcription: {
    clear: () => ipcRenderer.invoke('transcription:clear'),
    start: () => ipcRenderer.invoke('transcription:start'),
    stop: () => ipcRenderer.invoke('transcription:stop'),
  },

  // Reply suggestion management
  replySuggestion: {
    clear: () => ipcRenderer.invoke('reply-suggestion:clear'),
    stop: () => ipcRenderer.invoke('reply-suggestion:stop'),
  },

  // Code suggestion management
  codeSuggestion: {
    clear: () => ipcRenderer.invoke('code-suggestion:clear'),
    stop: () => ipcRenderer.invoke('code-suggestion:stop'),
  },

  // Media management
  webRtc: {
    offer: (offer: any) => ipcRenderer.invoke('webrtc:offer', offer),
    getTurnCredentials: () => ipcRenderer.invoke('webrtc:turn-credentials'),
    startAgents: () => ipcRenderer.invoke('webrtc:start-agents'),
    stopAgents: () => ipcRenderer.invoke('webrtc:stop-agents'),
    restartAudioAgent: (delayMs?: number) =>
      ipcRenderer.invoke('webrtc:restart-audio-agent', delayMs),
    putVideoFrame: (frameData: ArrayBuffer) =>
      ipcRenderer.invoke('webrtc:put-video-frame', frameData),
  },

  // Listen for pushed notifications main
  onPushNotification: (callback: (notification: any) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, notification: any) =>
      callback(notification);
    ipcRenderer.on('push-notification', handler);
    return () => ipcRenderer.removeListener('push-notification', handler);
  },

  // Tools management
  tools: {
    exportTranscript: () => ipcRenderer.invoke('tools:export-transcript'),
    clearAll: () => ipcRenderer.invoke('tools:clear-all'),
  },

  // Auto-updater management
  autoUpdater: {
    checkForUpdates: () => ipcRenderer.invoke('auto-updater:check-for-updates'),
    quitAndInstall: () => ipcRenderer.invoke('auto-updater:quit-and-install'),
    getVersion: () => ipcRenderer.invoke('auto-updater:get-version'),
    onStatusUpdate: (callback: (data: any) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
      ipcRenderer.on('auto-updater:status', handler);
      return () => ipcRenderer.removeListener('auto-updater:status', handler);
    },
  },

  // Window controls
  close: () => ipcRenderer.send('window-close'),

  // Zoom controls
  zoom: {
    increase: () => ipcRenderer.send('zoom-in'),
    decrease: () => ipcRenderer.send('zoom-out'),
    reset: () => ipcRenderer.send('zoom-reset'),
    getFactor: () => ipcRenderer.invoke('zoom:get-factor'),
    onChange: (callback: (percent: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, percent: number) => callback(percent);
      ipcRenderer.on('zoom-level-changed', handler);
      return () => ipcRenderer.removeListener('zoom-level-changed', handler);
    },
  },

  // Open external URLs in the default browser
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Stealth control helpers
  setStealth: (isStealth: boolean) => ipcRenderer.send('set-stealth', !!isStealth),
  toggleStealth: () => ipcRenderer.send('window-toggle-stealth'),

  // Opacity toggle helper (renderer UI can call this)
  toggleOpacity: () => ipcRenderer.send('window-toggle-opacity'),

  // Small ping helper to verify preload is loaded and IPC works
  ping: () => ipcRenderer.send('preload-ping'),
  // Informational flag
  isElectron: true,
};

// Expose under canonical and alias names to tolerate consumer differences
try {
  contextBridge.exposeInMainWorld('electronAPI', electronApi);
  contextBridge.exposeInMainWorld('electron', electronApi);
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn('preload: exposeInMainWorld failed', e);
}

// eslint-disable-next-line no-console
console.log('preload: electron API exposed');

// Listen for stealth mode changes from main and update body class
ipcRenderer.on('stealth-changed', (_event, isStealth: boolean) => {
  const apply = () => {
    try {
      if (isStealth) {
        document.body.classList.add('stealth');
      } else {
        document.body.classList.remove('stealth');
      }
    } catch (e) {
      console.warn('Failed to update stealth class:', e);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    apply();
  } else {
    window.addEventListener('DOMContentLoaded', apply, { once: true });
  }
});
