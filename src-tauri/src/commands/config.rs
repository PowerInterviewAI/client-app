use serde_json::Value;
use tauri::State;

use crate::AppServices;
use crate::types::config::RuntimeConfig;

#[tauri::command]
pub fn config_get(services: State<'_, AppServices>) -> RuntimeConfig {
    services.config_store.get_config()
}

#[tauri::command]
pub fn config_update(updates: Value, services: State<'_, AppServices>) -> RuntimeConfig {
    services.config_store.update_config(updates)
}
