use serde_json::Value;
use tauri::State;

use crate::AppServices;
use crate::types::app_state::AppState;

#[tauri::command]
pub fn app_state_get(services: State<'_, AppServices>) -> AppState {
    services.app_state.get_state()
}

#[tauri::command]
pub fn app_state_update(updates: Value, services: State<'_, AppServices>) -> AppState {
    services.app_state.update(|s| {
        if let Ok(mut current) = serde_json::to_value(&*s) {
            crate::utils::merge_json(&mut current, &updates);
            if let Ok(merged) = serde_json::from_value::<AppState>(current) {
                *s = merged;
            }
        }
    });
    services.app_state.get_state()
}
