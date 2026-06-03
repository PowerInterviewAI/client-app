/**
 * Tauri Bridge
 * Implements the same interface as window.electronAPI but uses Tauri's
 * invoke() and listen() under the hood. Assigned to window.electronAPI
 * in main.tsx so all existing hooks work without modification.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';

// Helper: subscribe to a Tauri event and return a synchronous cleanup fn
function onEvent<T>(event: string, callback: (payload: T) => void): () => void {
  const unlistenPromise = listen<T>(event, (e) => callback(e.payload));
  return () => {
    unlistenPromise.then((unlisten) => unlisten());
  };
}

export const tauriApi = {
  isElectron: false,
  isTauri: true,

  // ---- Hotkey events ----
  onHotkeyScroll: (callback: (section: string, direction: string) => void) =>
    onEvent<{ section: string; direction: string }>('hotkey-scroll', ({ section, direction }) =>
      callback(section, direction)
    ),

  onHotkeyStopAssistant: (callback: () => void) =>
    onEvent<void>('hotkey-stop-assistant', () => callback()),

  // ---- Configuration ----
  config: {
    get: () => invoke('config_get'),
    update: (updates: unknown) => invoke('config_update', { updates }),
  },

  // ---- Auth ----
  auth: {
    signup: (username: string, email: string, password: string) =>
      invoke('auth_signup', { username, email, password }),
    login: (email: string, password: string) => invoke('auth_login', { email, password }),
    logout: () => invoke('auth_logout'),
    changePassword: (currentPassword: string, newPassword: string) =>
      invoke('auth_change_password', { currentPassword, newPassword }),
  },

  // ---- Payment ----
  payment: {
    getPlans: () => invoke('payment_get_plans'),
    getCurrencies: () => invoke('payment_get_currencies'),
    create: (data: unknown) => invoke('payment_create', { data }),
    getStatus: (paymentId: string) => invoke('payment_get_status', { paymentId }),
    getHistory: () => invoke('payment_get_history'),
    getCredits: () => invoke('payment_get_credits'),
  },

  // ---- LLM ----
  llm: {
    listModels: () => invoke('llm_list_models'),
    validate: (config: unknown) => invoke('llm_validate', { config }),
  },

  // ---- App State ----
  appState: {
    get: () => invoke('app_state_get'),
    update: (updates: unknown) => invoke('app_state_update', { updates }),
  },

  onAppStateUpdated: (callback: (state: unknown) => void) => onEvent('app-state-updated', callback),

  // ---- Transcription ----
  transcription: {
    clear: () => invoke('transcription_clear'),
    start: () => invoke('transcription_start'),
    stop: () => invoke('transcription_stop'),
    ingest: (payload: { channel: string; type: string; text: string }) =>
      invoke('transcription_ingest', {
        channel: payload.channel,
        transcript_type: payload.type,
        text: payload.text,
      }),
    setSessionToken: (token: string) => invoke('transcription_set_session_token', { token }),
    enableLoopbackAudio: () => invoke('enable_loopback_audio'),
    disableLoopbackAudio: () => invoke('disable_loopback_audio'),
  },

  // ---- Live Suggestion ----
  liveSuggestion: {
    clear: () => invoke('live_suggestion_clear'),
    stop: () => invoke('live_suggestion_stop'),
  },

  // ---- Action Suggestion ----
  actionSuggestion: {
    clear: () => invoke('action_suggestion_clear'),
    stop: () => invoke('action_suggestion_stop'),
  },

  // ---- Push Notifications ----
  onPushNotification: (callback: (notification: unknown) => void) =>
    onEvent('push-notification', callback),

  // ---- Tools ----
  tools: {
    exportTranscript: async () => {
      // Fetch transcripts from Rust, generate DOCX in JS (keeps md-to-docx dependency)
      const transcripts = await invoke<unknown[]>('tools_get_transcripts_for_export');
      const markdown = transcriptsToMarkdown(transcripts as TranscriptItem[]);
      try {
        const { convertMarkdownToDocx } = await import('@mohtasham/md-to-docx');
        const blob: Blob = await convertMarkdownToDocx(markdown);
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const filePath = await save({
          filters: [{ name: 'Word Document', extensions: ['docx'] }],
          defaultPath: `interview-transcript-${Date.now()}.docx`,
        });
        if (filePath) {
          await writeFile(filePath, bytes);
        }
      } catch (e) {
        console.error('[Bridge] exportTranscript failed:', e);
        throw e;
      }
    },
    clearAll: () => invoke('tools_clear_all'),
    setPlaceholderData: () => invoke('tools_set_placeholder_data'),
  },

  // ---- Auto Updater ----
  autoUpdater: {
    checkForUpdates: () => invoke('updater_check_for_updates'),
    quitAndInstall: () => invoke('updater_quit_and_install'),
    getVersion: () => invoke('updater_get_version'),
    onStatusUpdate: (callback: (data: unknown) => void) => onEvent('auto-updater:status', callback),
  },

  // ---- Window Controls ----
  close: () => invoke('window_close'),

  zoom: {
    increase: () => invoke('zoom_in'),
    decrease: () => invoke('zoom_out'),
    reset: () => invoke('zoom_reset'),
    getFactor: () => invoke('zoom_get_factor'),
    onChange: (callback: (percent: number) => void) => onEvent('zoom-level-changed', callback),
  },

  // ---- Permissions ----
  permissions: {
    checkScreenRecording: () => invoke('permissions_check_screen_recording'),
    checkScreenSources: () => invoke('permissions_check_screen_sources'),
    checkMicrophone: () => invoke('permissions_check_microphone'),
    requestMicrophone: () => invoke('permissions_request_microphone'),
    showDeniedDialog: (type: 'screen-recording' | 'microphone') =>
      invoke('permissions_show_denied_dialog', { permission_type: type }),
    showRestartDialog: () => invoke('permissions_show_restart_dialog'),
  },

  // ---- External URLs ----
  openExternal: (url: string) => invoke('open_external', { url }),

  // ---- Stealth ----
  setStealth: (isStealth: boolean) => invoke('window_set_stealth', { isStealth }),
  toggleStealth: () => invoke('window_toggle_stealth'),
  toggleOpacity: () => invoke('window_toggle_opacity'),

  // ---- Drag ----
  startDrag: () => invoke('window_start_drag'),

  ping: () => {},
};

// Subscribe to stealth-changed events and apply body class (mirrors preload.cts behavior)
listen<boolean>('stealth-changed', (event) => {
  if (event.payload) {
    document.body.classList.add('stealth');
  } else {
    document.body.classList.remove('stealth');
  }
}).catch(() => {});

// Types for internal use
interface TranscriptItem {
  timestamp: number;
  text: string;
  speaker: string;
  isFinal: boolean;
  endTimestamp: number;
}

function transcriptsToMarkdown(transcripts: TranscriptItem[]): string {
  const lines = transcripts.map((t) => {
    const speaker = t.speaker === 'other' ? 'Interviewer' : 'You';
    return `**${speaker}:** ${t.text}`;
  });
  return lines.join('\n\n');
}
