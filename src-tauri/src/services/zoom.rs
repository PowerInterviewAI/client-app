use tauri::{AppHandle, Emitter, Manager};

use crate::consts::{ZOOM_MAX_FACTOR, ZOOM_MIN_FACTOR};
use crate::store::ConfigStore;

pub struct ZoomService {
    app_handle: AppHandle,
    config_store: std::sync::Arc<ConfigStore>,
}

impl ZoomService {
    pub fn new(app_handle: AppHandle, config_store: std::sync::Arc<ConfigStore>) -> Self {
        Self { app_handle, config_store }
    }

    fn window(&self) -> Option<tauri::WebviewWindow> {
        self.app_handle.get_webview_window("main")
    }

    fn clamp(v: f64) -> f64 {
        v.clamp(ZOOM_MIN_FACTOR, ZOOM_MAX_FACTOR)
    }

    pub fn apply_saved(&self) {
        let factor = self.config_store.get_zoom_factor();
        let clamped = Self::clamp(factor);
        if let Some(win) = self.window() {
            let _ = win.set_zoom(clamped);
            self.notify(clamped);
        }
    }

    pub fn set_zoom_factor(&self, factor: f64) {
        let clamped = Self::clamp(factor);
        if let Some(win) = self.window() {
            let _ = win.set_zoom(clamped);
            self.notify(clamped);
            self.config_store.save_zoom_factor(clamped);
        }
    }

    pub fn adjust(&self, delta: f64) {
        let current = self.get_factor();
        self.set_zoom_factor(current + delta);
    }

    pub fn reset(&self) {
        self.set_zoom_factor(1.0);
    }

    pub fn get_factor(&self) -> f64 {
        self.config_store.get_zoom_factor()
    }

    fn notify(&self, factor: f64) {
        let percent = (factor * 100.0).round() as i32;
        let _ = self.app_handle.emit("zoom-level-changed", percent);
    }
}
