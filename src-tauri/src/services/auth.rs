use serde_json::Value;

use crate::consts::{API_AUTH_CHANGE_PASSWORD, API_AUTH_LOGIN, API_AUTH_LOGOUT, API_AUTH_SIGNUP};
use crate::services::api_client::{ApiClient, ApiError};
use crate::store::ConfigStore;

pub struct AuthService;

impl AuthService {
    pub fn build_client(config_store: &ConfigStore) -> ApiClient {
        let token = config_store.get_config().session_token;
        let client = ApiClient::new();
        if !token.is_empty() {
            client.with_token(token)
        } else {
            client
        }
    }

    pub async fn signup(
        config_store: &ConfigStore,
        username: &str,
        email: &str,
        password: &str,
    ) -> Result<Value, ApiError> {
        let client = ApiClient::new();
        let body = serde_json::json!({ "username": username, "email": email, "password": password });
        let resp = client.post(API_AUTH_SIGNUP, &body).await?;
        if let Some(token) = resp.get("session_token").or_else(|| resp.get("access_token")).and_then(|t| t.as_str()) {
            config_store.update_config(serde_json::json!({ "sessionToken": token }));
        }
        Ok(resp)
    }

    pub async fn login(
        config_store: &ConfigStore,
        email: &str,
        password: &str,
    ) -> Result<Value, ApiError> {
        let client = ApiClient::new();
        let body = serde_json::json!({ "email": email, "password": password });
        let resp = client.post(API_AUTH_LOGIN, &body).await?;
        if let Some(token) = resp.get("session_token").or_else(|| resp.get("access_token")).and_then(|t| t.as_str()) {
            config_store.update_config(serde_json::json!({ "sessionToken": token }));
        }
        Ok(resp)
    }

    pub async fn logout(config_store: &ConfigStore) -> Result<(), ApiError> {
        let client = Self::build_client(config_store);
        let _ = client.post(API_AUTH_LOGOUT, &serde_json::json!({})).await;
        config_store.update_config(serde_json::json!({ "sessionToken": "" }));
        Ok(())
    }

    pub async fn change_password(
        config_store: &ConfigStore,
        current_password: &str,
        new_password: &str,
    ) -> Result<Value, ApiError> {
        let client = Self::build_client(config_store);
        let body = serde_json::json!({
            "current_password": current_password,
            "new_password": new_password,
        });
        client.post(API_AUTH_CHANGE_PASSWORD, &body).await
    }
}
