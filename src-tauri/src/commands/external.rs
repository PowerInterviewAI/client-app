use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn open_external(url: String, app: AppHandle) -> Result<(), String> {
    app.shell().open(url, None).map_err(|e| e.to_string())
}
