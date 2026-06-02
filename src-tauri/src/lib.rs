pub mod commands;
pub mod consts;
pub mod services;
pub mod store;
pub mod types;
pub mod utils;

use std::sync::Arc;

use tauri::{AppHandle, Emitter, Manager};

use crate::services::action_lock::ActionLockService;
use crate::services::action_suggestion::ActionSuggestionService;
use crate::services::app_state::AppStateService;
use crate::services::auth::AuthService;
use crate::services::health_check::HealthCheckService;
use crate::services::live_suggestion::LiveSuggestionService;
use crate::services::payment::PaymentService;
use crate::services::push_notification::PushNotificationService;
use crate::services::tools::ToolsService;
use crate::services::transcript::TranscriptService;
use crate::services::window_control::WindowControlService;
use crate::services::zoom::ZoomService;
use crate::store::ConfigStore;

/// Central container for all app services, stored as Tauri managed state.
pub struct AppServices {
    pub config_store: Arc<ConfigStore>,
    pub app_state: Arc<AppStateService>,
    pub live_suggestion: Arc<LiveSuggestionService>,
    pub action_suggestion: Arc<ActionSuggestionService>,
    pub transcript: Arc<TranscriptService>,
    pub tools: Arc<ToolsService>,
    pub window_control: Arc<WindowControlService>,
    pub zoom: Arc<ZoomService>,
    pub push_notification: Arc<PushNotificationService>,
    pub health_check: Arc<HealthCheckService>,
    pub action_lock: Arc<ActionLockService>,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();

            // Build data directory path for config store
            let data_dir = handle
                .path()
                .app_data_dir()
                .expect("app data dir unavailable");

            let config_store = Arc::new(ConfigStore::new(data_dir));
            let app_state = Arc::new(AppStateService::new(handle.clone()));
            let push_notification = Arc::new(PushNotificationService::new(handle.clone()));
            let action_lock = Arc::new(ActionLockService::new());
            let live_suggestion = Arc::new(LiveSuggestionService::new(
                Arc::clone(&app_state),
                Arc::clone(&config_store),
            ));
            let action_suggestion = Arc::new(ActionSuggestionService::new(
                Arc::clone(&app_state),
                Arc::clone(&config_store),
                Arc::clone(&push_notification),
                Arc::clone(&action_lock),
            ));
            let transcript = Arc::new(TranscriptService::new(
                Arc::clone(&app_state),
                Arc::clone(&live_suggestion),
            ));
            let tools = Arc::new(ToolsService::new(Arc::clone(&app_state)));
            let window_control = Arc::new(WindowControlService::new(
                handle.clone(),
                Arc::clone(&app_state),
                Arc::clone(&push_notification),
                Arc::clone(&config_store),
            ));
            let zoom = Arc::new(ZoomService::new(handle.clone(), Arc::clone(&config_store)));
            let health_check = Arc::new(HealthCheckService::new());

            // Apply saved window bounds
            if let Some(bounds) = config_store.get_window_bounds() {
                if let Some(win) = handle.get_webview_window("main") {
                    let w = bounds.width.unwrap_or(1024);
                    let h = bounds.height.unwrap_or(640);
                    let _ = win.set_size(tauri::PhysicalSize::new(
                        w.max(crate::consts::MIN_WIDTH),
                        h.max(crate::consts::MIN_HEIGHT),
                    ));
                    if let (Some(x), Some(y)) = (bounds.x, bounds.y) {
                        let _ = win.set_position(tauri::PhysicalPosition::new(x, y));
                    }
                }
            }

            // macOS: use transparent titlebar so native traffic lights are visible
            #[cfg(target_os = "macos")]
            {
                if let Some(win) = handle.get_webview_window("main") {
                    use tauri::TitleBarStyle;
                    let _ = win.set_title_bar_style(TitleBarStyle::Transparent);
                }
            }

            // Apply saved zoom
            zoom.apply_saved();

            // Enable content protection unless disabled via env
            if std::env::var("DISABLE_CONTENT_PROTECTION").is_err() {
                if let Some(win) = handle.get_webview_window("main") {
                    let _ = win.set_content_protected(true);
                }
            }

            let services = AppServices {
                config_store: Arc::clone(&config_store),
                app_state: Arc::clone(&app_state),
                live_suggestion: Arc::clone(&live_suggestion),
                action_suggestion: Arc::clone(&action_suggestion),
                transcript: Arc::clone(&transcript),
                tools,
                window_control,
                zoom,
                push_notification,
                health_check: Arc::clone(&health_check),
                action_lock,
            };

            app.manage(services);

            // Start health check in background
            let health_check_ref = Arc::clone(&health_check);
            let app_state_ref = Arc::clone(&app_state);
            let config_store_ref = Arc::clone(&config_store);
            tauri::async_runtime::spawn(async move {
                health_check_ref.start(app_state_ref, config_store_ref).await;
            });

            // Register global hotkeys
            register_hotkeys(&handle);

            // Schedule periodic update checks
            let handle_update = handle.clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                check_updates(&handle_update).await;
                let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(300));
                loop {
                    interval.tick().await;
                    check_updates(&handle_update).await;
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // config
            commands::config::config_get,
            commands::config::config_update,
            // app state
            commands::app_state::app_state_get,
            commands::app_state::app_state_update,
            // auth
            commands::auth::auth_signup,
            commands::auth::auth_login,
            commands::auth::auth_logout,
            commands::auth::auth_change_password,
            // transcription
            commands::transcription::transcription_start,
            commands::transcription::transcription_stop,
            commands::transcription::transcription_clear,
            commands::transcription::transcription_ingest,
            commands::transcription::transcription_set_session_token,
            commands::transcription::enable_loopback_audio,
            commands::transcription::disable_loopback_audio,
            // suggestions
            commands::suggestion::live_suggestion_clear,
            commands::suggestion::live_suggestion_stop,
            commands::suggestion::action_suggestion_clear,
            commands::suggestion::action_suggestion_stop,
            commands::suggestion::action_capture_screenshot,
            commands::suggestion::action_clear_images,
            commands::suggestion::action_start_generate,
            commands::suggestion::action_has_images,
            // payment
            commands::payment::payment_get_plans,
            commands::payment::payment_get_currencies,
            commands::payment::payment_create,
            commands::payment::payment_get_status,
            commands::payment::payment_get_history,
            commands::payment::payment_get_credits,
            // llm
            commands::llm::llm_list_models,
            commands::llm::llm_validate,
            // tools
            commands::tools::tools_clear_all,
            commands::tools::tools_set_placeholder_data,
            commands::tools::tools_get_transcripts_for_export,
            // window
            commands::window_cmd::window_close,
            commands::window_cmd::zoom_in,
            commands::window_cmd::zoom_out,
            commands::window_cmd::zoom_reset,
            commands::window_cmd::zoom_get_factor,
            commands::window_cmd::window_set_stealth,
            commands::window_cmd::window_toggle_stealth,
            commands::window_cmd::window_toggle_opacity,
            commands::window_cmd::window_move_to_position,
            commands::window_cmd::window_move_by_arrow,
            commands::window_cmd::window_resize_by_arrow,
            commands::window_cmd::window_save_bounds,
            commands::window_cmd::window_start_drag,
            // permissions
            commands::permissions::permissions_check_screen_recording,
            commands::permissions::permissions_check_screen_sources,
            commands::permissions::permissions_check_microphone,
            commands::permissions::permissions_request_microphone,
            commands::permissions::permissions_show_denied_dialog,
            commands::permissions::permissions_show_restart_dialog,
            // external
            commands::external::open_external,
            // updater
            commands::updater::updater_get_version,
            commands::updater::updater_check_for_updates,
            commands::updater::updater_quit_and_install,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Save bounds before closing
                if let (Ok(pos), Ok(size)) = (window.outer_position(), window.inner_size()) {
                    // state() panics only if not managed — safe since setup() always manages AppServices
                    let services = window.state::<AppServices>();
                    services.config_store.save_window_bounds(crate::types::config::WindowBounds {
                        x: Some(pos.x),
                        y: Some(pos.y),
                        width: Some(size.width),
                        height: Some(size.height),
                    });
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn register_hotkeys(handle: &AppHandle) {
    use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

    let h = handle.clone();
    if let Err(e) = handle.global_shortcut().on_shortcuts(
        [
            // Stop assistant: Ctrl+Shift+Q
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyQ),
            // Stealth toggle: Ctrl+Shift+M
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyM),
            // Opacity toggle: Ctrl+Shift+N
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyN),
            // Zoom: Ctrl+Shift+= / - / 0
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Equal),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Minus),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit0),
            // Scroll live suggestions: Ctrl+Shift+K/J/L
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyK),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyJ),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyL),
            // Scroll action suggestions: Ctrl+Shift+I/U/O
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyI),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyU),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO),
            // Action suggestion: Ctrl+Shift+F9/F10/F11/F12
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F9),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F10),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F11),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::F12),
            // Window positions: Ctrl+Shift+1-9
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit1),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit2),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit3),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit4),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit5),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit6),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit7),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit8),
            Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Digit9),
        ],
        move |app, shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            let services = match app.try_state::<AppServices>() {
                Some(s) => s,
                None => return,
            };
            match shortcut.key {
                Code::KeyQ => { let _ = app.emit("hotkey-stop-assistant", ()); }
                Code::KeyM => { services.window_control.toggle_stealth(); }
                Code::KeyN => { services.window_control.toggle_opacity(); }
                Code::Equal => { services.zoom.adjust(crate::consts::ZOOM_STEP); }
                Code::Minus => { services.zoom.adjust(-crate::consts::ZOOM_STEP); }
                Code::Digit0 => { services.zoom.reset(); }
                Code::KeyK => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "0", "direction": "up"})); }
                Code::KeyJ => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "0", "direction": "down"})); }
                Code::KeyL => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "0", "direction": "end"})); }
                Code::KeyI => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "1", "direction": "up"})); }
                Code::KeyU => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "1", "direction": "down"})); }
                Code::KeyO => { let _ = app.emit("hotkey-scroll", serde_json::json!({"section": "1", "direction": "end"})); }
                Code::F9 => {
                    let svc = Arc::clone(&services.action_suggestion);
                    tauri::async_runtime::spawn(async move { svc.capture_screenshot().await; });
                }
                Code::F10 => { services.action_suggestion.clear_images(); }
                Code::F11 => {
                    let svc = Arc::clone(&services.action_suggestion);
                    tauri::async_runtime::spawn(async move { svc.start_generate_suggestion().await; });
                }
                Code::F12 => {
                    let svc = Arc::clone(&services.action_suggestion);
                    tauri::async_runtime::spawn(async move {
                        if !svc.has_uploaded_images() {
                            svc.capture_screenshot().await;
                        }
                        svc.start_generate_suggestion().await;
                    });
                }
                Code::Digit1 => { services.window_control.move_to_position("bottom-left"); }
                Code::Digit2 => { services.window_control.move_to_position("bottom-center"); }
                Code::Digit3 => { services.window_control.move_to_position("bottom-right"); }
                Code::Digit4 => { services.window_control.move_to_position("middle-left"); }
                Code::Digit5 => { services.window_control.move_to_position("center"); }
                Code::Digit6 => { services.window_control.move_to_position("middle-right"); }
                Code::Digit7 => { services.window_control.move_to_position("top-left"); }
                Code::Digit8 => { services.window_control.move_to_position("top-center"); }
                Code::Digit9 => { services.window_control.move_to_position("top-right"); }
                _ => {}
            }
        },
    ) {
        log::error!("[Hotkeys] Failed to register hotkeys: {}", e);
    }
}

async fn check_updates(handle: &AppHandle) {
    use tauri_plugin_updater::UpdaterExt;
    if let Ok(updater) = handle.updater() {
        match updater.check().await {
            Ok(Some(update)) => {
                let _ = handle.emit("auto-updater:status", serde_json::json!({
                    "status": "update-available",
                    "version": update.version,
                }));
            }
            Ok(None) => {}
            Err(e) => log::debug!("[Updater] check error: {}", e),
        }
    }
}
