use tauri::State;

use crate::AppServices;

#[tauri::command]
pub fn live_suggestion_clear(services: State<'_, AppServices>) {
    services.live_suggestion.clear();
}

#[tauri::command]
pub fn live_suggestion_stop(services: State<'_, AppServices>) {
    services.live_suggestion.stop();
}

#[tauri::command]
pub fn action_suggestion_clear(services: State<'_, AppServices>) {
    services.action_suggestion.clear();
}

#[tauri::command]
pub fn action_suggestion_stop(services: State<'_, AppServices>) {
    services.action_suggestion.stop();
}

#[tauri::command]
pub async fn action_capture_screenshot(services: State<'_, AppServices>) -> Result<(), String> {
    services.action_suggestion.capture_screenshot().await;
    Ok(())
}

#[tauri::command]
pub async fn action_clear_images(services: State<'_, AppServices>) -> Result<(), String> {
    services.action_suggestion.clear_images();
    Ok(())
}

#[tauri::command]
pub async fn action_start_generate(services: State<'_, AppServices>) -> Result<(), String> {
    services.action_suggestion.start_generate_suggestion().await;
    Ok(())
}

#[tauri::command]
pub fn action_has_images(services: State<'_, AppServices>) -> bool {
    services.action_suggestion.has_uploaded_images()
}
