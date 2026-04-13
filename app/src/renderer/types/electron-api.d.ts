import type { AppState } from './app-state';
import type { Config } from './config';
import type { LLMConfig, LLMConfigValidationResult, LLMModelInfo } from './llm';
import type {
  AvailableCurrency,
  CreatePaymentRequest,
  CreatePaymentResponse,
  CreditPlanInfo,
  PaymentHistory,
  PaymentStatusResponse,
} from './payment';
import type { PushNotification } from './push-notification';

export {};

declare global {
  interface ElectronAPI {
    // Hotkey scroll events
    onHotkeyScroll: (
      callback: (section: string, direction: 'up' | 'down' | 'end') => void
    ) => () => void;

    // Hotkey stop assistant event
    onHotkeyStopAssistant: (callback: () => void) => () => void;

    // Configuration management
    config: {
      get: () => Promise<Config>;
      update: (updates: Partial<Config>) => Promise<Config>;
    };

    // Authentication management
    auth: {
      signup: (
        username: string,
        email: string,
        password: string
      ) => Promise<{ success: boolean; error?: string }>;
      login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
      logout: () => Promise<{ success: boolean; error?: string }>;
      changePassword: (
        oldPassword: string,
        newPassword: string
      ) => Promise<{ success: boolean; error?: string }>;
    };

    // Payment management
    payment: {
      getPlans: () => Promise<{ success: boolean; data?: CreditPlanInfo[]; error?: string }>;
      getCurrencies: () => Promise<{
        success: boolean;
        data?: AvailableCurrency[];
        error?: string;
      }>;
      create: (
        data: CreatePaymentRequest
      ) => Promise<{ success: boolean; data?: CreatePaymentResponse; error?: string }>;
      getStatus: (
        paymentId: string
      ) => Promise<{ success: boolean; data?: PaymentStatusResponse; error?: string }>;
      getHistory: () => Promise<{ success: boolean; data?: PaymentHistory[]; error?: string }>;
      getCredits: () => Promise<{ success: boolean; credits?: number; error?: string }>;
    };

    // LLM management
    llm: {
      listModels: () => Promise<{ success: boolean; data?: LLMModelInfo[]; error?: string }>;
      validate: (
        config: LLMConfig | null
      ) => Promise<{ success: boolean; data?: LLMConfigValidationResult; error?: string }>;
    };

    // App state management
    appState: {
      get: () => Promise<AppState>;
      update: (updates: Partial<AppState>) => Promise<AppState>;
    };

    // Pushed app-state updates from main process
    onAppStateUpdated: (callback: (state: AppState) => void) => () => void;

    // Transcription management
    transcription: {
      clear: () => Promise<void>;
      start: () => Promise<void>;
      stop: () => Promise<void>;
      ingest: (payload: {
        channel: 'ch_0' | 'ch_1';
        type: 'partial' | 'final';
        text: string;
      }) => Promise<void>;
      setSessionToken: (token: string) => Promise<void>;
      enableLoopbackAudio: () => Promise<void>;
      disableLoopbackAudio: () => Promise<void>;
    };

    // Live suggestion management
    liveSuggestion: {
      clear: () => Promise<void>;
      stop: () => Promise<void>;
    };

    // Action suggestion management
    actionSuggestion: {
      clear: () => Promise<void>;
      stop: () => Promise<void>;
    };

    // Push notification listener
    onPushNotification: (callback: (notification: PushNotification) => void) => () => void;

    // Tools management
    tools: {
      exportTranscript: () => Promise<string>;
      clearAll: () => Promise<void>;
      setPlaceholderData: () => Promise<void>;
    };

    // Auto-updater management
    autoUpdater: {
      checkForUpdates: () => Promise<{ success: boolean; error?: string }>;
      quitAndInstall: () => Promise<{ success: boolean; error?: string }>;
      getVersion: () => Promise<{ success: boolean; version?: string; error?: string }>;
      onStatusUpdate: (
        callback: (data: {
          status:
            | 'checking'
            | 'available'
            | 'not-available'
            | 'downloading'
            | 'downloaded'
            | 'error';
          info: { version: string; releaseDate: string; releaseNotes?: string } | null;
          progress?: {
            bytesPerSecond: number;
            percent: number;
            transferred: number;
            total: number;
          } | null;
          error?: string;
        }) => void
      ) => () => void;
    };

    // Window controls
    close: () => void;

    // Zoom controls
    zoom: {
      increase: () => void;
      decrease: () => void;
      reset: () => void;
      getFactor: () => Promise<number>;
      onChange: (callback: (percent: number) => void) => () => void;
    };

    // Open external URL in user's default browser
    openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;

    // Stealth control helpers
    setStealth: (isStealth: boolean) => void;
    toggleStealth: () => void;

    // Opacity toggle helper
    toggleOpacity: () => void;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
