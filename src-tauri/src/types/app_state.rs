use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Speaker {
    #[serde(rename = "self")]
    SelfSpeaker,
    #[serde(rename = "other")]
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SuggestionState {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "uploading")]
    Uploading,
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "loading")]
    Loading,
    #[serde(rename = "success")]
    Success,
    #[serde(rename = "stopped")]
    Stopped,
    #[serde(rename = "error")]
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RunningState {
    #[serde(rename = "idle")]
    Idle,
    #[serde(rename = "starting")]
    Starting,
    #[serde(rename = "running")]
    Running,
    #[serde(rename = "stopping")]
    Stopping,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserRole {
    #[serde(rename = "standard")]
    Standard,
    #[serde(rename = "beta_tester")]
    BetaTester,
    #[serde(rename = "trial")]
    Trial,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transcript {
    pub timestamp: i64,
    pub text: String,
    pub speaker: Speaker,
    pub is_final: bool,
    pub end_timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveSuggestion {
    pub timestamp: i64,
    pub last_question: String,
    pub answer: String,
    pub state: SuggestionState,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActionSuggestion {
    pub timestamp: i64,
    pub last_question: String,
    pub answer: String,
    pub image_urls: Vec<Option<String>>,
    pub state: SuggestionState,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub is_stealth: bool,
    pub is_backend_live: bool,
    pub is_logged_in: Option<bool>,
    pub running_state: RunningState,
    pub is_app_idle: bool,
    pub transcripts: Vec<Transcript>,
    pub live_suggestions: Vec<LiveSuggestion>,
    pub action_suggestions: Vec<ActionSuggestion>,
    pub credits: Option<f64>,
    pub user_role: Option<UserRole>,
    pub beta_tester_expires_at: Option<i64>,
    pub provided_llm_model: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp_millis();
        Self {
            is_stealth: false,
            is_backend_live: false,
            is_logged_in: None,
            running_state: RunningState::Idle,
            is_app_idle: false,
            transcripts: vec![Transcript {
                timestamp: now,
                text: "Transcripts will be here".into(),
                speaker: Speaker::Other,
                is_final: false,
                end_timestamp: now + 5000,
            }],
            live_suggestions: vec![LiveSuggestion {
                timestamp: now,
                last_question: "Interviewer questions will be here".into(),
                answer: "Suggested answers will be here in real-time".into(),
                state: SuggestionState::Success,
                error: String::new(),
            }],
            action_suggestions: vec![ActionSuggestion {
                timestamp: now,
                last_question: "Interviewer questions will be here".into(),
                answer: "Triggered suggestions will be here. For example, reply suggestion, coding test solution, diagram descriptions, etc.".into(),
                image_urls: vec![None, None, None, None],
                state: SuggestionState::Success,
                error: String::new(),
            }],
            credits: None,
            user_role: None,
            beta_tester_expires_at: None,
            provided_llm_model: None,
        }
    }
}
