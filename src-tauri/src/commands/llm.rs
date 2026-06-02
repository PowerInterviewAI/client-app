use serde_json::Value;
use tauri::State;

use crate::AppServices;
use crate::services::api_client::ApiClient;

#[tauri::command]
pub async fn llm_list_models(services: State<'_, AppServices>) -> Result<Value, String> {
    let token = services.config_store.get_config().session_token;
    let client = if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(token) };
    client.get("/api/llm/models").await
}

#[tauri::command]
pub async fn llm_validate(config: Value, services: State<'_, AppServices>) -> Result<Value, String> {
    let token = services.config_store.get_config().session_token;
    let client = if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(token) };
    client.post("/api/llm/validate", &config).await
}
