use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use futures_util::StreamExt;
use parking_lot::Mutex;

use crate::consts::{ACTION_SUGGESTION_MAX_CAPTURES, BACKEND_BASE_URL};
use crate::services::action_lock::{ActionLockService, ActionType};
use crate::services::api_client::ApiClient;
use crate::services::app_state::AppStateService;
use crate::services::push_notification::PushNotificationService;
use crate::store::ConfigStore;
use crate::types::app_state::{ActionSuggestion, RunningState, Speaker, SuggestionState, Transcript};
use crate::utils::{generate_uuid, now_ms};

pub struct ActionSuggestionService {
    suggestions: Arc<Mutex<HashMap<i64, ActionSuggestion>>>,
    uploaded_images: Arc<Mutex<Vec<String>>>,
    abort_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    app_state: Arc<AppStateService>,
    config_store: Arc<ConfigStore>,
    push_notification: Arc<PushNotificationService>,
    action_lock: Arc<ActionLockService>,
}

impl ActionSuggestionService {
    pub fn new(
        app_state: Arc<AppStateService>,
        config_store: Arc<ConfigStore>,
        push_notification: Arc<PushNotificationService>,
        action_lock: Arc<ActionLockService>,
    ) -> Self {
        Self {
            suggestions: Arc::new(Mutex::new(HashMap::new())),
            uploaded_images: Arc::new(Mutex::new(vec![])),
            abort_flags: Arc::new(Mutex::new(HashMap::new())),
            app_state,
            config_store,
            push_notification,
            action_lock,
        }
    }

    pub fn has_uploaded_images(&self) -> bool {
        !self.uploaded_images.lock().is_empty()
    }

    fn emit_suggestions(&self, is_uploading: bool) {
        let images = self.uploaded_images.lock();
        let mut list: Vec<ActionSuggestion> = self.suggestions.lock().values().cloned().collect();
        let state = self.app_state.get_state();
        let last_question = get_last_interviewer_question(&state.transcripts);

        if is_uploading {
            let mut urls: Vec<Option<String>> = images.iter().map(|n| Some(image_url(n))).collect();
            urls.push(None);
            list.push(ActionSuggestion {
                timestamp: now_ms(),
                last_question: last_question.clone(),
                answer: String::new(),
                image_urls: urls,
                state: SuggestionState::Uploading,
                error: String::new(),
            });
        } else if !images.is_empty() {
            list.push(ActionSuggestion {
                timestamp: now_ms(),
                last_question: last_question.clone(),
                answer: String::new(),
                image_urls: images.iter().map(|n| Some(image_url(n))).collect(),
                state: SuggestionState::Idle,
                error: String::new(),
            });
        }
        drop(images);
        self.app_state.set_action_suggestions(list);
    }

    pub fn clear_images(&self) {
        if self.app_state.get_state().running_state != RunningState::Running {
            self.push_notification.warning("Cannot clear images when assistant is not running");
            return;
        }
        self.uploaded_images.lock().clear();
        self.emit_suggestions(false);
    }

    pub async fn capture_screenshot(&self) {
        if self.app_state.get_state().running_state != RunningState::Running {
            self.push_notification.warning("Cannot capture screenshot when assistant is not running");
            return;
        }
        if self.uploaded_images.lock().len() >= ACTION_SUGGESTION_MAX_CAPTURES as usize {
            self.push_notification.warning(&format!(
                "Maximum of {} screenshots reached. Please clear images and try again.",
                ACTION_SUGGESTION_MAX_CAPTURES
            ));
            return;
        }
        if !self.action_lock.try_acquire(ActionType::ScreenshotCapture) {
            return;
        }

        self.emit_suggestions(true);

        let result = capture_and_grayscale().await;
        match result {
            Err(e) => {
                log::error!("[ActionSuggestion] Screenshot capture failed: {}", e);
                self.push_notification.error("Screenshot capture failed. Please try again.");
                self.emit_suggestions(false);
            }
            Ok(png_bytes) => {
                let conf = self.config_store.get_config();
                let token = conf.session_token.clone();
                let client = if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(&token) };

                let form = reqwest::multipart::Form::new()
                    .part("image_file", reqwest::multipart::Part::bytes(png_bytes)
                        .file_name("screenshot.png")
                        .mime_str("image/png").unwrap());

                match client.post_multipart("/api/llm/upload-image", form).await {
                    Ok(resp) => {
                        if let Some(name) = resp.as_str() {
                            self.uploaded_images.lock().push(name.to_string());
                        }
                        self.emit_suggestions(false);
                    }
                    Err(e) => {
                        log::error!("[ActionSuggestion] Upload failed: {}", e);
                        self.push_notification.error("Screenshot upload failed. Please try again.");
                        self.emit_suggestions(false);
                    }
                }
            }
        }

        self.action_lock.release(ActionType::ScreenshotCapture);
    }

    pub async fn start_generate_suggestion(&self) {
        let state = self.app_state.get_state();
        if state.running_state != RunningState::Running {
            self.push_notification.warning("Cannot generate suggestion when assistant is not running");
            return;
        }
        if !self.action_lock.try_acquire(ActionType::CaptureSuggestion) {
            return;
        }

        // stop any running tasks
        for flag in self.abort_flags.lock().values() { flag.store(true, Ordering::Release); }
        self.abort_flags.lock().clear();

        let task_id = generate_uuid();
        let abort_flag = Arc::new(AtomicBool::new(false));
        self.abort_flags.lock().insert(task_id.clone(), Arc::clone(&abort_flag));

        let conf = self.config_store.get_config();
        let token = conf.session_token.clone();
        let image_names: Vec<String> = self.uploaded_images.lock().drain(..).collect();
        let last_question = get_last_interviewer_question(&state.transcripts);
        let timestamp = now_ms();

        let body = serde_json::json!({
            "config": conf.llm_conf,
            "profile_data": conf.interview_conf.profile_data,
            "context": conf.interview_conf.job_description,
            "transcripts": state.transcripts,
            "image_names": image_names,
        });

        let initial = ActionSuggestion {
            timestamp,
            last_question: last_question.clone(),
            answer: String::new(),
            image_urls: image_names.iter().map(|n| Some(image_url(n))).collect(),
            state: SuggestionState::Pending,
            error: String::new(),
        };
        self.suggestions.lock().insert(timestamp, initial);
        self.emit_suggestions(false);

        let suggestions = Arc::clone(&self.suggestions);
        let app_state = Arc::clone(&self.app_state);
        let action_lock = Arc::clone(&self.action_lock);
        let abort = Arc::clone(&abort_flag);
        let uploaded = Arc::clone(&self.uploaded_images);

        tokio::spawn(async move {
            let client = if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(&token) };

            let emit = |map: &HashMap<i64, ActionSuggestion>, imgs: &Vec<String>| {
                let mut list: Vec<ActionSuggestion> = map.values().cloned().collect();
                if !imgs.is_empty() {
                    // pending prompt still shown - handled by emit_suggestions, skip here
                }
                let _ = imgs;
                app_state.set_action_suggestions(list);
            };

            match client.post_stream("/api/llm/action-suggestion", &body).await {
                Err(e) => {
                    let error_msg = if e.contains("429") { "Too many requests. Please try again later.".into() } else { "Failed to generate response.".into() };
                    let mut map = suggestions.lock();
                    if let Some(s) = map.get_mut(&timestamp) { s.state = SuggestionState::Error; s.error = error_msg; }
                    emit(&map, &uploaded.lock());
                    action_lock.release(ActionType::CaptureSuggestion);
                }
                Ok(resp) => {
                    {
                        let mut map = suggestions.lock();
                        if let Some(s) = map.get_mut(&timestamp) { s.state = SuggestionState::Loading; }
                        emit(&map, &uploaded.lock());
                    }
                    let mut stream = resp.bytes_stream();
                    let mut answer = String::new();

                    while let Some(chunk) = stream.next().await {
                        if abort.load(Ordering::Acquire) {
                            let mut map = suggestions.lock();
                            if let Some(s) = map.get_mut(&timestamp) { s.state = SuggestionState::Stopped; }
                            emit(&map, &uploaded.lock());
                            action_lock.release(ActionType::CaptureSuggestion);
                            return;
                        }
                        if let Ok(bytes) = chunk {
                            answer.push_str(&String::from_utf8_lossy(&bytes));
                            let mut map = suggestions.lock();
                            if let Some(s) = map.get_mut(&timestamp) { s.answer = answer.clone(); s.state = SuggestionState::Loading; }
                            emit(&map, &uploaded.lock());
                        }
                    }
                    let mut map = suggestions.lock();
                    if let Some(s) = map.get_mut(&timestamp) {
                        if s.state == SuggestionState::Loading { s.state = SuggestionState::Success; }
                    }
                    emit(&map, &uploaded.lock());
                    action_lock.release(ActionType::CaptureSuggestion);
                }
            }
        });
    }

    pub fn clear(&self) {
        for flag in self.abort_flags.lock().values() { flag.store(true, Ordering::Release); }
        self.suggestions.lock().clear();
        self.uploaded_images.lock().clear();
        self.app_state.set_action_suggestions(vec![]);
    }

    pub fn stop(&self) {
        for flag in self.abort_flags.lock().values() { flag.store(true, Ordering::Release); }
    }
}

fn get_last_interviewer_question(transcripts: &[Transcript]) -> String {
    transcripts.iter().rev()
        .find(|t| matches!(t.speaker, Speaker::Other) && t.is_final)
        .map(|t| t.text.clone())
        .unwrap_or_default()
}

fn image_url(name: &str) -> String {
    format!("{}/api/llm/get-thumb/{}", BACKEND_BASE_URL, name)
}

async fn capture_and_grayscale() -> Result<Vec<u8>, String> {
    // Use xcap for cross-platform screenshot
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.into_iter().next().ok_or("No monitor found")?;
    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    // Convert to DynamicImage and apply grayscale
    let dynamic = image::DynamicImage::ImageRgba8(image);
    let gray = dynamic.grayscale();

    let mut png_bytes: Vec<u8> = Vec::new();
    gray.write_to(&mut std::io::Cursor::new(&mut png_bytes), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(png_bytes)
}
