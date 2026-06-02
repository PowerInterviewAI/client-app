use std::sync::Arc;

use crate::services::app_state::AppStateService;

pub struct ToolsService {
    app_state: Arc<AppStateService>,
}

impl ToolsService {
    pub fn new(app_state: Arc<AppStateService>) -> Self {
        Self { app_state }
    }

    pub fn clear_all(&self) {
        self.app_state.update(|s| {
            s.transcripts.clear();
            s.live_suggestions.clear();
            s.action_suggestions.clear();
        });
    }

    pub fn set_placeholder_data(&self) {
        use crate::types::app_state::{ActionSuggestion, LiveSuggestion, Speaker, SuggestionState, Transcript};
        use crate::utils::now_ms;
        let now = now_ms();
        self.app_state.update(|s| {
            s.transcripts = vec![Transcript {
                timestamp: now,
                text: "Transcripts will be here".into(),
                speaker: Speaker::Other,
                is_final: false,
                end_timestamp: now + 5000,
            }];
            s.live_suggestions = vec![LiveSuggestion {
                timestamp: now,
                last_question: "Interviewer questions will be here".into(),
                answer: "Suggested answers will be here in real-time".into(),
                state: SuggestionState::Success,
                error: String::new(),
            }];
            s.action_suggestions = vec![ActionSuggestion {
                timestamp: now,
                last_question: "Interviewer questions will be here".into(),
                answer: "Triggered suggestions will be here. For example, reply suggestion, coding test solution, diagram descriptions, etc.".into(),
                image_urls: vec![None, None, None, None],
                state: SuggestionState::Success,
                error: String::new(),
            }];
        });
    }
}
