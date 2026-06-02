use parking_lot::Mutex;
use tauri::{AppHandle, Emitter};

use crate::types::app_state::{ActionSuggestion, AppState, LiveSuggestion, RunningState, Transcript, UserRole};

pub struct AppStateService {
    state: Mutex<AppState>,
    app_handle: AppHandle,
}

impl AppStateService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            state: Mutex::new(AppState::default()),
            app_handle,
        }
    }

    pub fn get_state(&self) -> AppState {
        self.state.lock().clone()
    }

    fn notify(&self, state: &AppState) {
        let _ = self.app_handle.emit("app-state-updated", state);
    }

    pub fn update<F>(&self, f: F)
    where F: FnOnce(&mut AppState) {
        let mut guard = self.state.lock();
        f(&mut guard);
        let snapshot = guard.clone();
        drop(guard);
        self.notify(&snapshot);
    }

    pub fn set_running_state(&self, rs: RunningState) {
        self.update(|s| s.running_state = rs);
    }

    pub fn set_logged_in(&self, logged_in: Option<bool>) {
        self.update(|s| s.is_logged_in = logged_in);
    }

    pub fn set_backend_live(&self, live: bool) {
        self.update(|s| s.is_backend_live = live);
    }

    pub fn set_credits_and_role(
        &self,
        credits: Option<f64>,
        user_role: Option<UserRole>,
        beta_expires: Option<i64>,
        provided_model: Option<String>,
    ) {
        self.update(|s| {
            s.credits = credits;
            s.user_role = user_role;
            s.beta_tester_expires_at = beta_expires;
            s.provided_llm_model = provided_model;
        });
    }

    pub fn set_live_suggestions(&self, suggestions: Vec<LiveSuggestion>) {
        self.update(|s| s.live_suggestions = suggestions);
    }

    pub fn set_action_suggestions(&self, suggestions: Vec<ActionSuggestion>) {
        self.update(|s| s.action_suggestions = suggestions);
    }

    pub fn set_transcripts(&self, transcripts: Vec<Transcript>) {
        self.update(|s| s.transcripts = transcripts);
    }

    pub fn set_stealth(&self, stealth: bool) {
        self.update(|s| s.is_stealth = stealth);
    }

    pub fn set_idle(&self, idle: bool) {
        self.update(|s| s.is_app_idle = idle);
    }
}
