// Tell TypeScript to compile this file as CommonJS despite package.json "type": "module"
// This is the standard approach for Electron preload scripts
import { contextBridge, ipcRenderer } from 'electron';

type AutoUpdaterStatus =
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface AutoUpdaterData {
  status: AutoUpdaterStatus;
  info: { version: string; releaseDate: string; releaseNotes?: string } | null;
  progress?: { bytesPerSecond: number; percent: number; transferred: number; total: number } | null;
  error?: string;
}

interface PushNotification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const electronApi = {
  onHotkeyScroll: (callback: (section: string, direction: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, section: string, direction: string) =>
      callback(section, direction);
    ipcRenderer.on('hotkey:scroll', handler);
    return () => ipcRenderer.removeListener('hotkey:scroll', handler);
  },

  onHotkeyStopAssistant: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey:stop-assistant', handler);
    return () => ipcRenderer.removeListener('hotkey:stop-assistant', handler);
  },

  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates: Record<string, unknown>) => ipcRenderer.invoke('config:update', updates),
  },

  auth: {
    signup: (username: string, email: string, password: string) =>
      ipcRenderer.invoke('auth:signup', username, email, password),
    login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePassword: (currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke('auth:change-password', currentPassword, newPassword),
  },

  payment: {
    getPlans: () => ipcRenderer.invoke('payment:get-plans'),
    getCurrencies: () => ipcRenderer.invoke('payment:get-currencies'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('payment:create', data),
    getStatus: (paymentId: string) => ipcRenderer.invoke('payment:get-status', paymentId),
    getHistory: () => ipcRenderer.invoke('payment:get-history'),
    getCredits: () => ipcRenderer.invoke('payment:get-credits'),
  },

  llm: {
    listModels: () => ipcRenderer.invoke('llm:list-models'),
    validate: (config: Record<string, unknown> | null) =>
      ipcRenderer.invoke('llm:validate', config),
  },

  appState: {
    get: () => ipcRenderer.invoke('app:get-state'),
    update: (updates: Record<string, unknown>) => ipcRenderer.invoke('app:update-state', updates),
  },

  onAppStateUpdated: (callback: (state: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: Record<string, unknown>) =>
      callback(state);
    ipcRenderer.on('app:state-updated', handler);
    return () => ipcRenderer.removeListener('app:state-updated', handler);
  },

  transcription: {
    clear: () => ipcRenderer.invoke('transcription:clear'),
    start: () => ipcRenderer.invoke('transcription:start'),
    stop: () => ipcRenderer.invoke('transcription:stop'),
    ingest: (payload: { channel: 'ch_0' | 'ch_1'; type: 'partial' | 'final'; text: string }) =>
      ipcRenderer.invoke('transcription:ingest', payload),
    setSessionToken: (token: string) =>
      ipcRenderer.invoke('transcription:set-session-token', token),
    // Channel names set by the electron-audio-loopback package — cannot be renamed
    enableLoopbackAudio: () => ipcRenderer.invoke('enable-loopback-audio'),
    disableLoopbackAudio: () => ipcRenderer.invoke('disable-loopback-audio'),
  },

  liveSuggestion: {
    clear: () => ipcRenderer.invoke('live-suggestion:clear'),
    stop: () => ipcRenderer.invoke('live-suggestion:stop'),
  },

  actionSuggestion: {
    clear: () => ipcRenderer.invoke('action-suggestion:clear'),
    stop: () => ipcRenderer.invoke('action-suggestion:stop'),
  },

  onPushNotification: (callback: (notification: PushNotification) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, notification: PushNotification) =>
      callback(notification);
    ipcRenderer.on('notification:push', handler);
    return () => ipcRenderer.removeListener('notification:push', handler);
  },

  tools: {
    exportTranscript: () => ipcRenderer.invoke('tools:export-transcript'),
    clearAll: () => ipcRenderer.invoke('tools:clear-all'),
    setPlaceholderData: () => ipcRenderer.invoke('tools:set-placeholder-data'),
  },

  autoUpdater: {
    checkForUpdates: () => ipcRenderer.invoke('auto-updater:check-for-updates'),
    quitAndInstall: () => ipcRenderer.invoke('auto-updater:quit-and-install'),
    getVersion: () => ipcRenderer.invoke('auto-updater:get-version'),
    onStatusUpdate: (callback: (data: AutoUpdaterData) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: AutoUpdaterData) => callback(data);
      ipcRenderer.on('auto-updater:status', handler);
      return () => ipcRenderer.removeListener('auto-updater:status', handler);
    },
  },

  close: () => ipcRenderer.send('window:close'),

  zoom: {
    increase: () => ipcRenderer.send('zoom:in'),
    decrease: () => ipcRenderer.send('zoom:out'),
    reset: () => ipcRenderer.send('zoom:reset'),
    getFactor: () => ipcRenderer.invoke('zoom:get-factor'),
    onChange: (callback: (percent: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, percent: number) => callback(percent);
      ipcRenderer.on('zoom:level-changed', handler);
      return () => ipcRenderer.removeListener('zoom:level-changed', handler);
    },
  },

  permissions: {
    checkScreenRecording: () => ipcRenderer.invoke('permissions:check-screen-recording'),
    requestMicrophone: () => ipcRenderer.invoke('permissions:request-microphone'),
  },

  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),

  setStealth: (isStealth: boolean) => ipcRenderer.send('window:set-stealth', !!isStealth),
  toggleStealth: () => ipcRenderer.send('window:toggle-stealth'),
  toggleOpacity: () => ipcRenderer.send('window:toggle-opacity'),

  ping: () => ipcRenderer.send('system:ping'),
  isElectron: true,
};

try {
  contextBridge.exposeInMainWorld('electronAPI', electronApi);
  contextBridge.exposeInMainWorld('electron', electronApi);
} catch (e) {
  console.warn('preload: exposeInMainWorld failed', e);
}

console.log('preload: electron API exposed');

ipcRenderer.on('window:stealth-changed', (_event, isStealth: boolean) => {
  const apply = () => {
    try {
      if (isStealth) {
        document.body.classList.add('stealth');
      } else {
        document.body.classList.remove('stealth');
      }
    } catch (e) {
      console.warn('preload: failed to update stealth class', e);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    apply();
  } else {
    window.addEventListener('DOMContentLoaded', apply, { once: true });
  }
});
