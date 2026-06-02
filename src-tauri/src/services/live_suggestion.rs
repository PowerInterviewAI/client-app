use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use futures_util::StreamExt;
use parking_lot::Mutex;

use crate::consts::LIVE_SUGGESTION_NO_SUGGESTION;
use crate::services::api_client::ApiClient;
use crate::services::app_state::AppStateService;
use crate::store::ConfigStore;
use crate::types::app_state::{LiveSuggestion, Speaker, SuggestionState, Transcript};
use crate::utils::{generate_uuid, now_ms};

pub struct LiveSuggestionService {
    suggestions: Arc<Mutex<HashMap<i64, LiveSuggestion>>>,
    abort_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    app_state: Arc<AppStateService>,
    config_store: Arc<ConfigStore>,
}

impl LiveSuggestionService {
    pub fn new(app_state: Arc<AppStateService>, config_store: Arc<ConfigStore>) -> Self {
        Self {
            suggestions: Arc::new(Mutex::new(HashMap::new())),
            abort_flags: Arc::new(Mutex::new(HashMap::new())),
            app_state,
            config_store,
        }
    }

    pub fn clear(&self) {
        self.stop_running();
        self.suggestions.lock().clear();
        self.app_state.set_live_suggestions(vec![]);
    }

    pub fn stop(&self) {
        self.stop_running();
    }

    fn stop_running(&self) {
        for flag in self.abort_flags.lock().values() {
            flag.store(true, Ordering::Release);
        }
    }

    fn emit_suggestions(&self) {
        let list: Vec<LiveSuggestion> = self.suggestions.lock().values().cloned().collect();
        self.app_state.set_live_suggestions(list);
    }

    pub async fn start_generate(&self, mut transcripts: Vec<Transcript>) {
        // remove trailing SELF transcripts (same as original)
        while transcripts.last().map(|t| matches!(t.speaker, Speaker::SelfSpeaker)).unwrap_or(false) {
            transcripts.pop();
        }
        if transcripts.is_empty() {
            return;
        }

        self.stop_running();
        self.abort_flags.lock().clear();

        let task_id = generate_uuid();
        let abort_flag = Arc::new(AtomicBool::new(false));
        self.abort_flags.lock().insert(task_id.clone(), Arc::clone(&abort_flag));

        let conf = self.config_store.get_config();
        let token = conf.session_token.clone();
        let body = serde_json::json!({
            "config": conf.llm_conf,
            "profile_data": conf.interview_conf.profile_data,
            "context": conf.interview_conf.job_description,
            "transcripts": transcripts,
        });

        let timestamp = now_ms();
        let last_question = transcripts.last().map(|t| t.text.clone()).unwrap_or_default();

        {
            let mut map = self.suggestions.lock();
            map.insert(timestamp, LiveSuggestion {
                timestamp,
                last_question: last_question.clone(),
                answer: String::new(),
                state: SuggestionState::Pending,
                error: String::new(),
            });
        }
        self.emit_suggestions();

        let suggestions = Arc::clone(&self.suggestions);
        let app_state = Arc::clone(&self.app_state);
        let abort = Arc::clone(&abort_flag);

        tokio::spawn(async move {
            let client = if token.is_empty() {
                ApiClient::new()
            } else {
                ApiClient::new().with_token(&token)
            };

            let emit = |map: &HashMap<i64, LiveSuggestion>| {
                let list: Vec<LiveSuggestion> = map.values().cloned().collect();
                app_state.set_live_suggestions(list);
            };

            match client.post_stream("/api/llm/live-suggestion", &body).await {
                Err(e) => {
                    let error_msg = if e.contains("429") {
                        "Too many requests. Please try again later.".into()
                    } else {
                        "Failed to generate response.".into()
                    };
                    let mut map = suggestions.lock();
                    if let Some(s) = map.get_mut(&timestamp) {
                        s.state = SuggestionState::Error;
                        s.error = error_msg;
                    }
                    emit(&map);
                }
                Ok(resp) => {
                    {
                        let mut map = suggestions.lock();
                        if let Some(s) = map.get_mut(&timestamp) {
                            s.state = SuggestionState::Loading;
                        }
                        emit(&map);
                    }

                    let mut stream = resp.bytes_stream();
                    let mut answer = String::new();

                    while let Some(chunk) = stream.next().await {
                        if abort.load(Ordering::Acquire) {
                            let mut map = suggestions.lock();
                            if let Some(s) = map.get_mut(&timestamp) {
                                s.state = SuggestionState::Stopped;
                            }
                            emit(&map);
                            return;
                        }
                        if let Ok(bytes) = chunk {
                            let text = String::from_utf8_lossy(&bytes).to_string();
                            answer.push_str(&text);

                            let mut map = suggestions.lock();
                            if answer.starts_with(LIVE_SUGGESTION_NO_SUGGESTION) {
                                map.remove(&timestamp);
                            } else if let Some(s) = map.get_mut(&timestamp) {
                                s.answer = answer.clone();
                                s.state = SuggestionState::Loading;
                            }
                            emit(&map);
                        }
                    }

                    // finalize
                    let mut map = suggestions.lock();
                    if answer.starts_with(LIVE_SUGGESTION_NO_SUGGESTION) {
                        map.remove(&timestamp);
                    } else if let Some(s) = map.get_mut(&timestamp) {
                        if s.state == SuggestionState::Loading {
                            s.state = SuggestionState::Success;
                        }
                    }
                    emit(&map);
                }
            }
        });
    }
}
