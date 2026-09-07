/**
 * Configuration Store
 * Manages persistent application configuration locally
 */

import ElectronStore from 'electron-store';

import { OPACITY_DEFAULT } from '../consts.js';
import { DEFAULT_LANGUAGE, Language, resolveLanguage } from '../types/language.js';

// Runtime configuration (matches Config type in frontend)
export interface RuntimeConfig {
  /** Interview language: what the ASR transcribes and what suggestions come back in. */
  language: Language;
  sessionToken: string;
  rememberMe: boolean;
  email: string;
  password: string;
  audioInputDeviceName: string;

  // panel auto-scroll preferences
  autoScrollLiveSuggestions: boolean;
  autoScrollActionSuggestions: boolean;
  autoScrollTranscript: boolean;

  // transcription bottom dock visibility
  showTranscriptPanel: boolean;

  // height the user dragged the dock to, in px; null leaves it on the automatic ratio
  transcriptDockHeight: number | null;

  // hint-only mode: suggestions come back as a headline plus keyword bullets rather than full
  // sentences. The default for a new install; full-sentence mode is the opt-out.
  hintOnlyMode: boolean;

  // mock interview: also generate what the live assistant would have suggested for each
  // question. On by default - trying this out is one of the two reasons the feature exists.
  mockLiveSuggestionsEnabled: boolean;
}

// Default runtime configuration
const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  language: DEFAULT_LANGUAGE,
  sessionToken: '',
  rememberMe: true,
  email: '',
  password: '',
  audioInputDeviceName: '',

  // default autoscroll preferences are enabled
  autoScrollLiveSuggestions: true,
  autoScrollActionSuggestions: true,
  autoScrollTranscript: true,

  showTranscriptPanel: true,
  transcriptDockHeight: null,

  // On by default: a candidate reads a hint at a glance mid-question, where a paragraph of prose
  // has to be scanned first. An existing install keeps whatever it was already on - see the
  // migration below.
  hintOnlyMode: true,

  // opt-out: showing what the live assistant would have said is the point of trying this
  mockLiveSuggestionsEnabled: true,
};

// interviewConf (full name, profile, context) used to be cached under `runtime`, but it's now
// backend-persisted and lives only in-memory (see AccountService/AppStateService).
export interface LegacyInterviewConf {
  username?: string;
  profileData?: string;
  jobDescription?: string;
}

type StoredRuntime = Partial<RuntimeConfig> & { interviewConf?: LegacyInterviewConf };

interface StoredConfig {
  window?: {
    bounds?: { x: number; y: number; width: number; height: number };
    stealth?: boolean;
    zoomFactor?: number;
    opacityLevel?: number;
  };
  runtime?: StoredRuntime;

  /** Account id that claimed the leftover pre-sync config; see AccountService.migrateLegacyConfig. */
  legacyInterviewConfOwner?: string;
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
   * Get runtime configuration from local store.
   *
   * `interviewConf` is stripped: it is a pre-sync leftover awaiting migration, and this object
   * is handed to the renderer over `config:get`. The CV reaches the renderer only through
   * `account:get`.
   */
  getConfig(): RuntimeConfig {
    const stored: StoredRuntime = { ...this.store.get('runtime', DEFAULT_RUNTIME_CONFIG) };
    delete stored.interviewConf;
    const config = { ...DEFAULT_RUNTIME_CONFIG, ...stored } as RuntimeConfig;

    // Resolved on the way out, not on the way in. The disk holds whatever some build wrote -
    // a language a later release dropped, or one an older one never knew - and every consumer
    // reads through here, so this is the one place that can stop an unknown code reaching the
    // ASR URL and the request bodies.
    config.language = resolveLanguage(config.language);

    return config;
  }

  /**
   * Update runtime configuration in local store.
   *
   * Merges onto the raw stored object rather than `getConfig()`, so a leftover `interviewConf`
   * survives the write instead of being dropped before AccountService can migrate it.
   */
  updateConfig(updates: Partial<RuntimeConfig>): RuntimeConfig {
    const stored = this.getStoredRuntime() ?? {};
    this.store.set('runtime', { ...DEFAULT_RUNTIME_CONFIG, ...stored, ...updates });
    return this.getConfig();
  }

  /**
   * Raw stored runtime object, without default backfill.
   *
   * Needed by migrations that must distinguish "absent on disk" from "set to the default",
   * and to reach keys that are no longer part of `RuntimeConfig`.
   */
  getStoredRuntime(): StoredRuntime | undefined {
    return this.store.get('runtime');
  }

  setStoredRuntime(runtime: StoredRuntime): void {
    this.store.set('runtime', runtime);
  }

  getLegacyInterviewConfOwner(): string | undefined {
    return this.store.get('legacyInterviewConfOwner');
  }

  setLegacyInterviewConfOwner(accountId: string): void {
    this.store.set('legacyInterviewConfOwner', accountId);
  }

  clearLegacyInterviewConfOwner(): void {
    this.store.delete('legacyInterviewConfOwner');
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
  const raw = configStore.getStoredRuntime();
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
  if (raw?.showTranscriptPanel === undefined) {
    migration.showTranscriptPanel = true;
  }
  if (raw?.transcriptDockHeight === undefined) {
    migration.transcriptDockHeight = null;
  }
  if (raw?.hintOnlyMode === undefined) {
    // `professionalMode` is what this setting was called before it was renamed for the two modes
    // it actually switches between. An install that carries it keeps the mode it was left on;
    // one that does not is either new or predates the setting, and takes the new default.
    const legacy = (raw as (StoredRuntime & Record<string, unknown>) | undefined)?.professionalMode;
    migration.hintOnlyMode = typeof legacy === 'boolean' ? legacy : true;
  }
  if (raw?.mockLiveSuggestionsEnabled === undefined) {
    migration.mockLiveSuggestionsEnabled = true;
  }
  // perform migration only if there are values to set
  if (Object.keys(migration).length > 0) {
    configStore.updateConfig(migration);
  }
})(); // migration block

/**
 * Drop a key `RuntimeConfig` no longer declares, so a value from before it was retired does not
 * survive forever on an upgraded install - every read and write in this file spreads the raw
 * stored object through, and nothing else strips a key TypeScript no longer knows about.
 */
function scrubRetiredKey(key: string): void {
  const raw = configStore.getStoredRuntime() as
    | (StoredRuntime & Record<string, unknown>)
    | undefined;
  if (raw && key in raw) {
    delete raw[key];
    configStore.setStoredRuntime(raw);
  }
}

// `llmConf` backed the removed bring-your-own-API-key feature and could hold a real provider key
// in plaintext - this one matters for more than tidiness.
scrubRetiredKey('llmConf');

// `onboardingCompleted` recorded whether the first-run wizard had run on this machine. It lives
// on the account now, which is the only place that can tell a user who has set up before from a
// second account on a shared machine - so the local copy is not merely unread, it is a second
// answer to a question that has one.
scrubRetiredKey('onboardingCompleted');

// `lastSessionMode` recorded which session the control bar's split Start button should launch
// by default. That button is gone - starting is a home-screen decision now, where both kinds are
// named outright - so nothing reads it and nothing should keep writing it.
scrubRetiredKey('lastSessionMode');

// `professionalMode` was renamed to `hintOnlyMode`, whose migration above reads it one last time
// to carry the user's choice across. Scrubbed after that, so the two can never disagree.
scrubRetiredKey('professionalMode');

// `headphoneNoticeAcknowledged` was replaced by the mock-interview-aware `HeadphoneNoticeDialog`
// variant, which no longer has a "do not show this again" option to acknowledge (see its own
// docstring for why). Not sensitive, but left here for the same reason `llmConf` is: nothing else
// will ever remove it.
scrubRetiredKey('headphoneNoticeAcknowledged');

// Read (but do not yet delete) any leftover local copy, so AccountService can migrate it
// onto the account. Deleting here unconditionally would destroy the only copy whenever the
// first launch after upgrade happens to be offline.
let legacyInterviewConf: LegacyInterviewConf | null =
  configStore.getStoredRuntime()?.interviewConf ?? null;

export function getLegacyInterviewConf(): LegacyInterviewConf | null {
  return legacyInterviewConf;
}

/**
 * Account id that claimed the leftover pre-sync config.
 *
 * Persisted rather than held in memory: a failed migration deliberately keeps the local copy
 * for retry, and an in-process-only claim is lost on restart. Without this, a second user
 * signing in first after that restart would inherit the first user's CV.
 */
export function getLegacyInterviewConfOwner(): string | null {
  return configStore.getLegacyInterviewConfOwner() ?? null;
}

export function claimLegacyInterviewConf(accountId: string): void {
  configStore.setLegacyInterviewConfOwner(accountId);
}

// Called once the account is known to hold the config, so it stops lingering on disk.
// The in-memory copy goes too: it outlives sign-out, so leaving it would let a later
// sign-in on the same process migrate one user's CV onto a different account.
export function clearLegacyInterviewConf(): void {
  legacyInterviewConf = null;
  configStore.clearLegacyInterviewConfOwner();

  const raw = configStore.getStoredRuntime();
  if (raw && 'interviewConf' in raw) {
    delete raw.interviewConf;
    configStore.setStoredRuntime(raw);
  }
}
