import { EnvUtil } from './utils/env.js';

export const BACKEND_BASE_URL = EnvUtil.isDev()
  ? 'http://localhost:8080'
  : 'https://api.powerinterviewai.com';

// minimum allowed dimensions for window bounds
export const MIN_WIDTH = 760;
export const MIN_HEIGHT = 480;

// Transcript agent constants
export const TRANSCRIPT_ZMQ_PORT = 50002;
export const TRANSCRIPT_MAX_RESTART_COUNT = 10;
export const TRANSCRIPT_RESTART_DELAY_MS = 2000;
export const TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS = 5000;

// Suggestion constants
export const REPLY_SUGGESTION_GAP_MS = 2000;
export const REPLY_SUGGESTION_NO_SUGGESTION = 'NO_SUGGESTION_NEEDED';
export const CODE_SUGGESTION_MAX_SCREENSHOTS = 4;
export const SCREENSHOT_TIMEOUT_MS = 30_000; // 30 seconds

// VCam agent constants
export const VCAM_ZMQ_PORT = 50001;
export const VCAM_MAX_RESTART_COUNT = 10;
export const VCAM_RESTART_DELAY_MS = 2000;

// Audio control agent constants
export const AUDIO_CONTROL_MAX_RESTART_COUNT = 10;
export const AUDIO_CONTROL_RESTART_DELAY_MS = 2000;
export const AUDIO_CONTROL_DELAY_MS = 300; // Default audio delay

// Zoom feature constants
export const ZOOM_STEP = 0.1; // factor increment/decrement
export const ZOOM_MIN_FACTOR = 0.5;
export const ZOOM_MAX_FACTOR = 3.0;
