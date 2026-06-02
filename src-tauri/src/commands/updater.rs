use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn updater_get_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub async fn updater_check_for_updates(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let handle = app.clone();
    tokio::spawn(async move {
        match handle.updater() {
            Ok(updater) => {
                match updater.check().await {
                    Ok(Some(update)) => {
                        let _ = handle.emit("auto-updater:status", serde_json::json!({
                            "status": "update-available",
                            "version": update.version,
                        }));
                    }
                    Ok(None) => {
                        let _ = handle.emit("auto-updater:status", serde_json::json!({ "status": "up-to-date" }));
                    }
                    Err(e) => {
                        log::error!("[Updater] check failed: {}", e);
                        let _ = handle.emit("auto-updater:status", serde_json::json!({ "status": "error", "error": e.to_string() }));
                    }
                }
            }
            Err(e) => {
                log::warn!("[Updater] updater not configured: {}", e);
            }
        }
    });
    Ok(())
}

#[tauri::command]
pub async fn updater_quit_and_install(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    match app.updater() {
        Ok(updater) => {
            if let Ok(Some(update)) = updater.check().await {
                update.download_and_install(|_, _| {}, || {}).await
                    .map_err(|e| e.to_string())?;
                app.restart();
            }
        }
        Err(e) => log::warn!("[Updater] not configured: {}", e),
    }
    Ok(())
}
