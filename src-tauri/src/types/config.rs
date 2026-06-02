use serde::{Deserialize, Serialize};

use super::llm::LLMConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InterviewConf {
    pub photo: String,
    pub username: String,
    pub profile_data: String,
    pub job_description: String,
}

impl Default for InterviewConf {
    fn default() -> Self {
        Self {
            photo: String::new(),
            username: String::new(),
            profile_data: String::new(),
            job_description: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeConfig {
    pub interview_conf: InterviewConf,
    pub language: String,
    pub session_token: String,
    pub remember_me: bool,
    pub email: String,
    pub password: String,
    pub audio_input_device_name: String,
    pub face_swap: bool,
    pub camera_device_name: String,
    pub video_width: u32,
    pub video_height: u32,
    pub enable_face_enhance: bool,
    pub llm_conf: Option<LLMConfig>,
    pub auto_scroll_live_suggestions: bool,
    pub auto_scroll_action_suggestions: bool,
    pub auto_scroll_transcript: bool,
}

impl Default for RuntimeConfig {
    fn default() -> Self {
        Self {
            interview_conf: InterviewConf::default(),
            language: "en".into(),
            session_token: String::new(),
            remember_me: true,
            email: String::new(),
            password: String::new(),
            audio_input_device_name: String::new(),
            face_swap: false,
            camera_device_name: String::new(),
            video_width: 1280,
            video_height: 720,
            enable_face_enhance: true,
            llm_conf: None,
            auto_scroll_live_suggestions: true,
            auto_scroll_action_suggestions: true,
            auto_scroll_transcript: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowBounds {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowConfig {
    pub bounds: Option<WindowBounds>,
    pub stealth: Option<bool>,
    pub zoom_factor: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoredConfig {
    pub window: Option<WindowConfig>,
    pub runtime: Option<RuntimeConfig>,
}
