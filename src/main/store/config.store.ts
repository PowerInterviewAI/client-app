/**
 * Configuration Store
 * Manages persistent application configuration locally
 */

import ElectronStore from 'electron-store';

import { OPACITY_DEFAULT } from '../consts.js';
import { LLMConfig } from '../types/llm.js';

// Runtime configuration (matches Config type in frontend)
export interface RuntimeConfig {
  interviewConf: {
    username: string;
    profileData: string;
    jobDescription: string;
  };
  language: string;
  sessionToken: string;
  rememberMe: boolean;
  email: string;
  password: string;
  audioInputDeviceName: string;

  llmConf: LLMConfig | null;

  // panel auto-scroll preferences
  autoScrollLiveSuggestions: boolean;
  autoScrollActionSuggestions: boolean;
  autoScrollTranscript: boolean;
}

// Default runtime configuration
const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  interviewConf: {
    username: '',
    profileData: '',
    jobDescription: '',
  },
  language: 'en',
  sessionToken: '',
  rememberMe: true,
  email: '',
  password: '',
  audioInputDeviceName: '',

  llmConf: null,

  // default autoscroll preferences are enabled
  autoScrollLiveSuggestions: true,
  autoScrollActionSuggestions: true,
  autoScrollTranscript: true,
};

interface StoredConfig {
  window?: {
    bounds?: { x: number; y: number; width: number; height: number };
    stealth?: boolean;
    zoomFactor?: number;
    opacityLevel?: number;
  };
  runtime?: Partial<RuntimeConfig>;
}

class ConfigStore {
  private store: ElectronStore<StoredConfig>;

  constructor() {
    this.store = new ElectronStore<StoredConfig>({
      name: 'config',
      defaults: {
        runtime: DEFAULT_RUNTIME_CONFIG,
      },
    });
  }

  /**
   * Get runtime configuration from local store
   */
  getConfig(): RuntimeConfig {
    const config = this.store.get('runtime', DEFAULT_RUNTIME_CONFIG);
    return { ...DEFAULT_RUNTIME_CONFIG, ...config } as RuntimeConfig;
  }

  /**
   * Update runtime configuration in local store
   */
  updateConfig(updates: Partial<RuntimeConfig>): RuntimeConfig {
    const current = this.getConfig();
    const updated = { ...current, ...updates };

    // Deep merge interview_conf if it's being partially updated
    if (updates.interviewConf) {
      updated.interviewConf = {
        ...current.interviewConf,
        ...updates.interviewConf,
      };
    }

    this.store.set('runtime', updated);
    return updated;
  }

  /**
   * Reset runtime configuration to defaults
   */
  resetRuntimeConfig(): RuntimeConfig {
    this.store.set('runtime', DEFAULT_RUNTIME_CONFIG);
    return DEFAULT_RUNTIME_CONFIG;
  }

  /**
   * Get window bounds
   */
  getWindowBounds(): { x?: number; y?: number; width: number; height: number } | undefined {
    return this.store.get('window.bounds');
  }

  /**
   * Save window bounds
   */
  saveWindowBounds(bounds: { x?: number; y?: number; width: number; height: number }): void {
    // sanitize before persisting: avoid saving nonsensical dimensions
    type MaybeBounds = Partial<{ x: number; y: number; width: number; height: number }>;
    const sanitized: MaybeBounds = { ...bounds };
    if (!sanitized.width || sanitized.width <= 0) {
      delete sanitized.width;
    }
    if (!sanitized.height || sanitized.height <= 0) {
      delete sanitized.height;
    }
    this.store.set('window.bounds', sanitized);
  }

  /**
   * Get stealth mode state
   */
  getStealth(): boolean {
    return this.store.get('window.stealth', false);
  }

  /**
   * Set stealth mode state
   */
  setStealth(enabled: boolean): void {
    this.store.set('window.stealth', enabled);
  }

  /**
   * Get stored stealth opacity level (defaults to second-highest level)
   */
  getOpacityLevel(): number {
    return this.store.get('window.opacityLevel', OPACITY_DEFAULT) as number;
  }

  /**
   * Persist stealth opacity level
   */
  saveOpacityLevel(level: number): void {
    this.store.set('window.opacityLevel', level);
  }

  /**
   * Get stored zoom factor (1 if not set)
   */
  getZoomFactor(): number {
    return this.store.get('window.zoomFactor', 1) as number;
  }

  /**
   * Persist zoom factor
   */
  saveZoomFactor(factor: number): void {
    this.store.set('window.zoomFactor', factor);
  }
}

export const configStore = new ConfigStore();

// ensure that newly added runtime keys have sane defaults when migrating
// only add the scroll flags if they aren't already present in the store;
// calling updateConfig unconditionally would reset the user's choice each
// restart, which is why autoScroll was bouncing back to true.
(() => {
  // read the raw stored object so we can test for undefined values
  // eslint-disable-next-line
  const raw = (configStore as any).store.get('runtime') as Partial<RuntimeConfig> | undefined;
  const migration: Partial<RuntimeConfig> = {};
  if (raw?.autoScrollLiveSuggestions === undefined) {
    migration.autoScrollLiveSuggestions = true;
  }
  if (raw?.autoScrollActionSuggestions === undefined) {
    migration.autoScrollActionSuggestions = true;
  }
  if (raw?.autoScrollTranscript === undefined) {
    migration.autoScrollTranscript = true;
  }
  // perform migration only if there are values to set
  if (Object.keys(migration).length > 0) {
    configStore.updateConfig(migration);
  }
})(); // migration block
