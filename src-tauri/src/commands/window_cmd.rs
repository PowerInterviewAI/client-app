use tauri::{AppHandle, Emitter, Manager, State};

use crate::AppServices;
use crate::consts::ZOOM_STEP;
use crate::types::config::WindowBounds;

#[tauri::command]
pub fn window_close(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.close();
    }
}

#[tauri::command]
pub fn zoom_in(services: State<'_, AppServices>) {
    services.zoom.adjust(ZOOM_STEP);
}

#[tauri::command]
pub fn zoom_out(services: State<'_, AppServices>) {
    services.zoom.adjust(-ZOOM_STEP);
}

#[tauri::command]
pub fn zoom_reset(services: State<'_, AppServices>) {
    services.zoom.reset();
}

#[tauri::command]
pub fn zoom_get_factor(services: State<'_, AppServices>) -> f64 {
    services.zoom.get_factor()
}

#[tauri::command]
pub fn window_set_stealth(is_stealth: bool, services: State<'_, AppServices>) {
    services.window_control.set_stealth(is_stealth);
}

#[tauri::command]
pub fn window_toggle_stealth(services: State<'_, AppServices>) {
    services.window_control.toggle_stealth();
}

#[tauri::command]
pub fn window_toggle_opacity(services: State<'_, AppServices>) {
    services.window_control.toggle_opacity();
}

#[tauri::command]
pub fn window_move_to_position(position: String, services: State<'_, AppServices>) {
    services.window_control.move_to_position(&position);
}

#[tauri::command]
pub fn window_move_by_arrow(direction: String, services: State<'_, AppServices>) {
    services.window_control.move_by_arrow(&direction);
}

#[tauri::command]
pub fn window_resize_by_arrow(direction: String, services: State<'_, AppServices>) {
    services.window_control.resize_by_arrow(&direction);
}

#[tauri::command]
pub fn window_save_bounds(x: i32, y: i32, width: u32, height: u32, services: State<'_, AppServices>) {
    services.config_store.save_window_bounds(WindowBounds {
        x: Some(x),
        y: Some(y),
        width: Some(width),
        height: Some(height),
    });
}

#[tauri::command]
pub fn window_start_drag(app: AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.start_dragging();
    }
}
