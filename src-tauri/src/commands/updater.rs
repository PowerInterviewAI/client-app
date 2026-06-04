use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_updater::Update;

use crate::AppServices;
use crate::types::config::WindowBounds;

static DOWNLOAD_IN_PROGRESS: AtomicBool = AtomicBool::new(false);
/// A fully downloaded update waiting to be installed on the user's command.
/// Holds the installer bytes in memory until the user chooses to restart.
static PENDING_UPDATE: Mutex<Option<(Update, Vec<u8>)>> = Mutex::new(None);

/// Check for an update and, if found, download it in the background.
/// The installer is NOT run here — on Windows `install()` exits the process,
/// so we defer it until the user explicitly restarts. Emits `auto-updater:status`
/// with `downloaded` (ready to install) or `error`.
/// No-ops if an update is already staged or a download is in progress.
pub async fn check_and_download_update(handle: AppHandle) {
    if PENDING_UPDATE.lock().unwrap().is_some() {
        return;
    }

    use tauri_plugin_updater::UpdaterExt;

    let updater = match handle.updater() {
        Ok(u) => u,
        Err(e) => {
            log::warn!("[Updater] not configured: {}", e);
            return;
        }
    };

    // Guard against concurrent downloads before hitting the network
    if DOWNLOAD_IN_PROGRESS.swap(true, Ordering::AcqRel) {
        return;
    }

    let update = match updater.check().await {
        Ok(Some(u)) => u,
        Ok(None) => {
            DOWNLOAD_IN_PROGRESS.store(false, Ordering::Release);
            return;
        }
        Err(e) => {
            DOWNLOAD_IN_PROGRESS.store(false, Ordering::Release);
            log::debug!("[Updater] check error: {}", e);
            return;
        }
    };

    let version = update.version.clone();
    log::info!("[Updater] update {} available, downloading in background", version);

    tokio::spawn(async move {
        // Download only — does not run the installer or exit the app.
        match update.download(|_, _| {}, || {}).await {
            Ok(bytes) => {
                *PENDING_UPDATE.lock().unwrap() = Some((update, bytes));
                DOWNLOAD_IN_PROGRESS.store(false, Ordering::Release);
                log::info!("[Updater] update {} downloaded, ready to install", version);
                let _ = handle.emit(
                    "auto-updater:status",
                    serde_json::json!({ "status": "downloaded", "version": version }),
                );
            }
            Err(e) => {
                DOWNLOAD_IN_PROGRESS.store(false, Ordering::Release);
                log::error!("[Updater] download failed: {}", e);
                let _ = handle.emit(
                    "auto-updater:status",
                    serde_json::json!({ "status": "error", "error": e.to_string() }),
                );
            }
        }
    });
}

#[tauri::command]
pub fn updater_get_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub async fn updater_check_for_updates(app: AppHandle) -> Result<(), String> {
    check_and_download_update(app).await;
    Ok(())
}

/// Persist window position/size before the process exits for the update.
/// On Windows `install()` calls `process::exit(0)` and on macOS `app.restart()`
/// re-execs — neither fires the normal `CloseRequested` handler, so bounds would
/// otherwise be lost across the update.
fn save_window_bounds(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if let (Ok(pos), Ok(size)) = (win.outer_position(), win.inner_size()) {
            app.state::<AppServices>()
                .config_store
                .save_window_bounds(WindowBounds {
                    x: Some(pos.x),
                    y: Some(pos.y),
                    width: Some(size.width),
                    height: Some(size.height),
                });
        }
    }
}

#[tauri::command]
pub async fn updater_quit_and_install(app: AppHandle) -> Result<(), String> {
    let pending = PENDING_UPDATE.lock().unwrap().take();
    if let Some((update, bytes)) = pending {
        save_window_bounds(&app);
        update.install(bytes).map_err(|e| e.to_string())?;
        // On Windows, install() already called process::exit(0) and relaunches via
        // the installer; this is reached only on macOS/Linux, which need an explicit restart.
        app.restart();
    }
    Err("No update is ready to install yet.".into())
}
