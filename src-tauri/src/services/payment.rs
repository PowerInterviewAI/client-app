use serde_json::Value;

use crate::consts::{
    API_HEALTH_CHECK_PING_CLIENT, API_PAYMENT_CURRENCIES, API_PAYMENT_CREATE, API_PAYMENT_HISTORY,
    API_PAYMENT_PLANS, API_PAYMENT_STATUS,
};
use crate::services::api_client::ApiClient;
use crate::store::ConfigStore;

pub struct PaymentService;

impl PaymentService {
    fn client(config_store: &ConfigStore) -> ApiClient {
        let token = config_store.get_config().session_token;
        if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(token) }
    }

    pub async fn get_plans(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get(API_PAYMENT_PLANS).await
    }

    pub async fn get_currencies(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get(API_PAYMENT_CURRENCIES).await
    }

    pub async fn create_payment(config_store: &ConfigStore, data: Value) -> Result<Value, String> {
        Self::client(config_store).post(API_PAYMENT_CREATE, &data).await
    }

    pub async fn get_payment_status(config_store: &ConfigStore, payment_id: &str) -> Result<Value, String> {
        Self::client(config_store)
            .get(&format!("{}/{}", API_PAYMENT_STATUS, payment_id)).await
    }

    pub async fn get_payment_history(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get(API_PAYMENT_HISTORY).await
    }

    pub async fn get_credits(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).post(API_HEALTH_CHECK_PING_CLIENT, &serde_json::json!({})).await
    }
}
