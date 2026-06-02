use tauri::State;

use crate::AppServices;

#[tauri::command]
pub fn tools_clear_all(services: State<'_, AppServices>) {
    services.tools.clear_all();
}

#[tauri::command]
pub fn tools_set_placeholder_data(services: State<'_, AppServices>) {
    services.tools.set_placeholder_data();
}

/// Export is handled on the frontend (JS generates DOCX, Tauri dialog/fs saves it).
/// This command returns the transcripts so the frontend can generate the file.
#[tauri::command]
pub fn tools_get_transcripts_for_export(services: State<'_, AppServices>) -> serde_json::Value {
    let state = services.app_state.get_state();
    serde_json::to_value(&state.transcripts).unwrap_or_default()
}
