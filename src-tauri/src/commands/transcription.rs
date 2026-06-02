use tauri::State;

use crate::AppServices;

#[tauri::command]
pub fn transcription_start(services: State<'_, AppServices>) {
    use crate::types::app_state::RunningState;
    services.transcript.start();
    services.app_state.set_running_state(RunningState::Running);
}

#[tauri::command]
pub fn transcription_stop(services: State<'_, AppServices>) {
    use crate::types::app_state::RunningState;
    services.transcript.stop();
    services.app_state.set_running_state(RunningState::Idle);
}

#[tauri::command]
pub fn transcription_clear(services: State<'_, AppServices>) {
    services.transcript.clear();
}

#[tauri::command]
pub async fn transcription_ingest(
    channel: String,
    transcript_type: String,
    text: String,
    services: State<'_, AppServices>,
) -> Result<(), String> {
    services.transcript.ingest(&channel, &transcript_type, &text).await;
    Ok(())
}

#[tauri::command]
pub fn transcription_set_session_token(token: String, services: State<'_, AppServices>) {
    services.config_store.update_config(serde_json::json!({ "sessionToken": token }));
}

#[tauri::command]
pub fn enable_loopback_audio() -> Result<(), String> {
    // TODO: implement platform-specific loopback audio capture
    // Windows: WASAPI loopback via `wasapi` crate
    // macOS: CoreAudio loopback or BlackHole virtual device
    log::warn!("[AudioLoopback] Loopback audio not yet implemented in Tauri build");
    Ok(())
}

#[tauri::command]
pub fn disable_loopback_audio() -> Result<(), String> {
    log::warn!("[AudioLoopback] Loopback audio not yet implemented in Tauri build");
    Ok(())
}
