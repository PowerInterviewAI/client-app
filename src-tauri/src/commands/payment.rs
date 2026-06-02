use serde_json::Value;
use tauri::State;

use crate::AppServices;
use crate::services::payment::PaymentService;

#[tauri::command]
pub async fn payment_get_plans(services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::get_plans(&services.config_store).await
}

#[tauri::command]
pub async fn payment_get_currencies(services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::get_currencies(&services.config_store).await
}

#[tauri::command]
pub async fn payment_create(data: Value, services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::create_payment(&services.config_store, data).await
}

#[tauri::command]
pub async fn payment_get_status(payment_id: String, services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::get_payment_status(&services.config_store, &payment_id).await
}

#[tauri::command]
pub async fn payment_get_history(services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::get_payment_history(&services.config_store).await
}

#[tauri::command]
pub async fn payment_get_credits(services: State<'_, AppServices>) -> Result<Value, String> {
    PaymentService::get_credits(&services.config_store).await
}
