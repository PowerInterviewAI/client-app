import { EnvUtil } from './utils/env.js';

export const BACKEND_BASE_URL = EnvUtil.isDev()
  ? 'http://localhost:8080'
  : 'https://api.powerinterviewai.com';

// minimum allowed dimensions for window bounds
export const MIN_WIDTH = 900;
export const MIN_HEIGHT = 540;

// Transcript constants
export const TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS = 5000;

// Suggestion constants
export const LIVE_SUGGESTION_GAP_MS = 2000;
export const LIVE_SUGGESTION_NO_SUGGESTION = 'NO_SUGGESTION_NEEDED';
export const ACTION_SUGGESTION_MAX_CAPTURES = 4;
export const ACTION_TIMEOUT_MS = 30_000; // 30 seconds

// Stealth mode opacity levels (cycles on each toggle; default = second highest)
export const OPACITY_LEVELS = [0.2, 0.5, 0.73, 0.9] as const;
export const OPACITY_DEFAULT = OPACITY_LEVELS[OPACITY_LEVELS.length - 2]; // 0.73

// Zoom feature constants
export const ZOOM_STEP = 0.1; // factor increment/decrement
export const ZOOM_MIN_FACTOR = 0.5;
export const ZOOM_MAX_FACTOR = 3.0;
