use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use serde::Deserialize;

use crate::services::api_client::ApiClient;
use crate::services::app_state::AppStateService;
use crate::store::ConfigStore;
use crate::types::app_state::UserRole;

const SUCCESS_INTERVAL_MS: u64 = 5_000;
const FAILURE_INTERVAL_MS: u64 = 1_000;

#[derive(Debug, Deserialize)]
struct ClientPingResponse {
    credits: Option<f64>,
    user_role: Option<String>,
    beta_tester_expires_at: Option<i64>,
    provided_llm_model: Option<String>,
}

fn parse_user_role(s: &str) -> Option<UserRole> {
    match s {
        "beta_tester" => Some(UserRole::BetaTester),
        "trial" => Some(UserRole::Trial),
        "standard" => Some(UserRole::Standard),
        _ => None,
    }
}

pub struct HealthCheckService {
    running: Arc<AtomicBool>,
}

impl HealthCheckService {
    pub fn new() -> Self {
        Self { running: Arc::new(AtomicBool::new(false)) }
    }

    pub async fn start(
        &self,
        app_state: Arc<AppStateService>,
        config_store: Arc<ConfigStore>,
    ) {
        if self.running.swap(true, Ordering::AcqRel) {
            return;
        }

        app_state.set_logged_in(None);

        let token = config_store.get_config().session_token;
        if !token.is_empty() {
            let client = ApiClient::new().with_token(&token);
            match client.get("/api/auth/ping-client").await {
                Ok(resp) => {
                    if let Ok(data) = serde_json::from_value::<ClientPingResponse>(resp) {
                        app_state.set_logged_in(Some(true));
                        app_state.set_credits_and_role(
                            data.credits,
                            data.user_role.as_deref().and_then(parse_user_role),
                            data.beta_tester_expires_at,
                            data.provided_llm_model,
                        );
                    }
                }
                Err(_) => {
                    app_state.set_logged_in(Some(false));
                }
            }
        } else {
            app_state.set_logged_in(Some(false));
        }

        let running_b = Arc::clone(&self.running);
        let app_state_b = Arc::clone(&app_state);
        let config_b = Arc::clone(&config_store);
        tokio::spawn(async move {
            Self::backend_loop(running_b, app_state_b, config_b).await;
        });
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Release);
    }

    async fn backend_loop(
        running: Arc<AtomicBool>,
        app_state: Arc<AppStateService>,
        config_store: Arc<ConfigStore>,
    ) {
        while running.load(Ordering::Acquire) {
            let token = config_store.get_config().session_token;
            let client = if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(&token) };

            let backend_live = client.get("/api/health").await.is_ok();
            app_state.set_backend_live(backend_live);

            // also do client ping if logged in
            let state = app_state.get_state();
            if state.is_logged_in == Some(true) && !state.is_app_idle && !token.is_empty() {
                if let Ok(resp) = client.get("/api/auth/ping-client").await {
                    if let Ok(data) = serde_json::from_value::<ClientPingResponse>(resp) {
                        app_state.set_credits_and_role(
                            data.credits,
                            data.user_role.as_deref().and_then(parse_user_role),
                            data.beta_tester_expires_at,
                            data.provided_llm_model,
                        );
                    }
                }
            }

            let delay = if backend_live { SUCCESS_INTERVAL_MS } else { FAILURE_INTERVAL_MS };
            tokio::time::sleep(tokio::time::Duration::from_millis(delay)).await;
        }
    }
}
