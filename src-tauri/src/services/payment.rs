use serde_json::Value;

use crate::services::api_client::ApiClient;
use crate::store::ConfigStore;

pub struct PaymentService;

impl PaymentService {
    fn client(config_store: &ConfigStore) -> ApiClient {
        let token = config_store.get_config().session_token;
        if token.is_empty() { ApiClient::new() } else { ApiClient::new().with_token(token) }
    }

    pub async fn get_plans(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get("/api/payment/plans").await
    }

    pub async fn get_currencies(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get("/api/payment/currencies").await
    }

    pub async fn create_payment(config_store: &ConfigStore, data: Value) -> Result<Value, String> {
        Self::client(config_store).post("/api/payment/create", &data).await
    }

    pub async fn get_payment_status(config_store: &ConfigStore, payment_id: &str) -> Result<Value, String> {
        Self::client(config_store)
            .get(&format!("/api/payment/status/{}", payment_id)).await
    }

    pub async fn get_payment_history(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get("/api/payment/history").await
    }

    pub async fn get_credits(config_store: &ConfigStore) -> Result<Value, String> {
        Self::client(config_store).get("/api/payment/credits").await
    }
}
