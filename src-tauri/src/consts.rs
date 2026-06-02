// Backend URL - set via environment variable or defaults
pub const BACKEND_BASE_URL: &str = if cfg!(debug_assertions) {
    "http://localhost:8080"
} else {
    "https://api.powerinterviewai.com"
};

pub const MIN_WIDTH: u32 = 760;
pub const MIN_HEIGHT: u32 = 480;

pub const TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS: i64 = 5_000;
pub const LIVE_SUGGESTION_GAP_MS: i64 = 2_000;
pub const LIVE_SUGGESTION_NO_SUGGESTION: &str = "NO_SUGGESTION_NEEDED";

pub const ACTION_SUGGESTION_MAX_CAPTURES: u32 = 4;

pub const ZOOM_STEP: f64 = 0.1;
pub const ZOOM_MIN_FACTOR: f64 = 0.5;
pub const ZOOM_MAX_FACTOR: f64 = 3.0;
