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
  platform: process.platform,

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

  onHotkeyToggleTranscript: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey:toggle-transcript', handler);
    return () => ipcRenderer.removeListener('hotkey:toggle-transcript', handler);
  },

  onHotkeyToggleProfessionalMode: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey:toggle-professional-mode', handler);
    return () => ipcRenderer.removeListener('hotkey:toggle-professional-mode', handler);
  },

  config: {
    get: () => ipcRenderer.invoke('config:get'),
    update: (updates: Record<string, unknown>) => ipcRenderer.invoke('config:update', updates),
  },

  auth: {
    sendVerificationCode: (email: string) =>
      ipcRenderer.invoke('auth:send-verification-code', email),
    verifyEmailCode: (email: string, code: string) =>
      ipcRenderer.invoke('auth:verify-email-code', email, code),
    signup: (username: string, email: string, password: string, verificationCode: string) =>
      ipcRenderer.invoke('auth:signup', username, email, password, verificationCode),
    login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
    logout: () => ipcRenderer.invoke('auth:logout'),
    changePassword: (currentPassword: string, newPassword: string) =>
      ipcRenderer.invoke('auth:change-password', currentPassword, newPassword),
    forgotPassword: (email: string) => ipcRenderer.invoke('auth:forgot-password', email),
    verifyPasswordResetCode: (email: string, code: string) =>
      ipcRenderer.invoke('auth:verify-password-reset-code', email, code),
    resetPassword: (email: string, code: string, newPassword: string) =>
      ipcRenderer.invoke('auth:reset-password', email, code, newPassword),
  },

  account: {
    update: (fullName: string, profileData: string, context: string) =>
      ipcRenderer.invoke('account:update', fullName, profileData, context),
    refresh: () => ipcRenderer.invoke('account:refresh'),
    get: () => ipcRenderer.invoke('account:get'),
  },

  payment: {
    getPlans: () => ipcRenderer.invoke('payment:get-plans'),
    getCurrencies: () => ipcRenderer.invoke('payment:get-currencies'),
    create: (data: Record<string, unknown>) => ipcRenderer.invoke('payment:create', data),
    getStatus: (paymentId: string) => ipcRenderer.invoke('payment:get-status', paymentId),
    getHistory: () => ipcRenderer.invoke('payment:get-history'),
    getCredits: () => ipcRenderer.invoke('payment:get-credits'),
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
    channelDisconnected: (channel: 'ch_0' | 'ch_1') =>
      ipcRenderer.invoke('transcription:channel-disconnected', channel),
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
    capture: () => ipcRenderer.invoke('action-suggestion:capture'),
    clearImages: () => ipcRenderer.invoke('action-suggestion:clear-images'),
    trigger: () => ipcRenderer.invoke('action-suggestion:trigger'),
  },

  mockInterview: {
    start: (setup: Record<string, unknown>) => ipcRenderer.invoke('mock-interview:start', setup),
    synthesizeChunk: (index: number) =>
      ipcRenderer.invoke('mock-interview:synthesize-chunk', index),
    speechFinished: () => ipcRenderer.invoke('mock-interview:speech-finished'),
    speechFailed: () => ipcRenderer.invoke('mock-interview:speech-failed'),
    ingestAnswer: (payload: { type: 'partial' | 'final'; text: string }) =>
      ipcRenderer.invoke('mock-interview:ingest-answer', payload),
    answerFinished: () => ipcRenderer.invoke('mock-interview:answer-finished'),
    repeatQuestion: () => ipcRenderer.invoke('mock-interview:repeat-question'),
    answerReady: () => ipcRenderer.invoke('mock-interview:answer-ready'),
    skipQuestion: () => ipcRenderer.invoke('mock-interview:skip-question'),
    endSession: () => ipcRenderer.invoke('mock-interview:end-session'),
    clear: () => ipcRenderer.invoke('mock-interview:clear'),
  },

  onPushNotification: (callback: (notification: PushNotification) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, notification: PushNotification) =>
      callback(notification);
    ipcRenderer.on('notification:push', handler);
    return () => ipcRenderer.removeListener('notification:push', handler);
  },

  tools: {
    exportTranscript: (format: 'docx' | 'md') =>
      ipcRenderer.invoke('tools:export-transcript', format),
    exportMockReport: (format: 'docx' | 'md') =>
      ipcRenderer.invoke('tools:export-mock-report', format),
    clearAll: () => ipcRenderer.invoke('tools:clear-all'),
    setPlaceholderData: () => ipcRenderer.invoke('tools:set-placeholder-data'),
    saveImage: (opts: { filename: string; data: number[] }) =>
      ipcRenderer.invoke('tools:save-image', opts),
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
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),

  // Main vetoes a close that would drop an unsaved interview and asks here instead. The reply
  // is what actually closes the window, so exactly one of these two has to be sent back.
  onSaveHistoryPrompt: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('app:save-history-prompt', handler);
    return () => ipcRenderer.removeListener('app:save-history-prompt', handler);
  },
  confirmClose: () => ipcRenderer.send('window:close-confirmed'),
  cancelClose: () => ipcRenderer.send('window:close-cancelled'),

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
    checkAll: () => ipcRenderer.invoke('permissions:check-all'),
    requestMicrophone: () => ipcRenderer.invoke('permissions:request-microphone'),
    openSettings: (pane: 'microphone' | 'screen') =>
      ipcRenderer.invoke('permissions:open-settings', pane),
    relaunch: () => ipcRenderer.invoke('permissions:relaunch'),
  },

  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),
  openFile: (filePath: string) => ipcRenderer.invoke('external:open-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('external:show-in-folder', filePath),

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
