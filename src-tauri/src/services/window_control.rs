use std::sync::Arc;

use tauri::{AppHandle, Emitter, Manager};

use crate::consts::{MIN_HEIGHT, MIN_WIDTH};

fn set_window_opacity(win: &tauri::WebviewWindow, opacity: f64) {
    #[cfg(target_os = "windows")]
    {
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        extern "system" {
            fn GetWindowLongW(hwnd: isize, index: i32) -> i32;
            fn SetWindowLongW(hwnd: isize, index: i32, value: i32) -> i32;
            fn SetLayeredWindowAttributes(hwnd: isize, key: u32, alpha: u8, flags: u32) -> i32;
        }
        const GWL_EXSTYLE: i32 = -20;
        const WS_EX_LAYERED: i32 = 0x80000;
        const LWA_ALPHA: u32 = 2;
        if let Ok(handle) = win.window_handle() {
            if let RawWindowHandle::Win32(h) = handle.as_raw() {
                let hwnd = h.hwnd.get() as isize;
                unsafe {
                    let ex = GetWindowLongW(hwnd, GWL_EXSTYLE);
                    SetWindowLongW(hwnd, GWL_EXSTYLE, ex | WS_EX_LAYERED);
                    SetLayeredWindowAttributes(hwnd, 0, (opacity.clamp(0.0, 1.0) * 255.0) as u8, LWA_ALPHA);
                }
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        use raw_window_handle::{HasWindowHandle, RawWindowHandle};
        if let Ok(handle) = win.window_handle() {
            if let RawWindowHandle::AppKit(h) = handle.as_raw() {
                unsafe {
                    use objc2::msg_send;
                    use objc2::runtime::AnyObject;
                    let ns_view = h.ns_view.as_ptr() as *mut AnyObject;
                    let ns_window: *mut AnyObject = msg_send![ns_view, window];
                    if !ns_window.is_null() {
                        let _: () = msg_send![ns_window, setAlphaValue: opacity as f64];
                    }
                }
            }
        }
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    { let _ = (win, opacity); }
}
use crate::services::app_state::AppStateService;
use crate::services::push_notification::PushNotificationService;
use crate::store::ConfigStore;

const OPACITY_LEVELS: [f64; 3] = [0.2, 0.6, 0.9];
const MOVE_AMOUNT: i32 = 20;
const RESIZE_AMOUNT: i32 = 20;

pub struct WindowControlService {
    stealth: parking_lot::Mutex<bool>,
    opacity_index: parking_lot::Mutex<usize>,
    app_handle: AppHandle,
    app_state: Arc<AppStateService>,
    push_notification: Arc<PushNotificationService>,
    config_store: Arc<ConfigStore>,
}

impl WindowControlService {
    pub fn new(
        app_handle: AppHandle,
        app_state: Arc<AppStateService>,
        push_notification: Arc<PushNotificationService>,
        config_store: Arc<ConfigStore>,
    ) -> Self {
        config_store.set_stealth(false); // always start non-stealth
        Self {
            stealth: parking_lot::Mutex::new(false),
            opacity_index: parking_lot::Mutex::new(1), // default to middle level
            app_handle,
            app_state,
            push_notification,
            config_store,
        }
    }

    fn window(&self) -> Option<tauri::WebviewWindow> {
        self.app_handle.get_webview_window("main")
    }

    pub fn enable_stealth(&self) {
        let Some(win) = self.window() else { return };
        let _ = win.set_ignore_cursor_events(true);
        let _ = win.set_always_on_top(true);
        let _ = set_window_opacity(&win,0.6);
        *self.stealth.lock() = true;
        self.config_store.set_stealth(true);
        self.app_state.set_stealth(true);
        let _ = self.app_handle.emit("stealth-changed", true);

        #[cfg(target_os = "macos")]
        {
            // hide dock icon in stealth mode
            use tauri::ActivationPolicy;
            let _ = self.app_handle.set_activation_policy(ActivationPolicy::Accessory);
        }
    }

    pub fn disable_stealth(&self) {
        let Some(win) = self.window() else { return };
        let _ = win.set_ignore_cursor_events(false);
        let _ = win.set_always_on_top(false);
        let _ = set_window_opacity(&win,1.0);
        let _ = win.show();
        let _ = win.set_focus();
        *self.stealth.lock() = false;
        self.config_store.set_stealth(false);
        self.app_state.set_stealth(false);
        let _ = self.app_handle.emit("stealth-changed", false);

        #[cfg(target_os = "macos")]
        {
            use tauri::ActivationPolicy;
            let _ = self.app_handle.set_activation_policy(ActivationPolicy::Regular);
        }
    }

    pub fn toggle_stealth(&self) {
        if !self.app_state.get_state().is_logged_in.unwrap_or(false) {
            self.push_notification.error("You must be logged in to use stealth mode.");
            return;
        }
        if *self.stealth.lock() {
            self.disable_stealth();
        } else {
            self.enable_stealth();
        }
    }

    pub fn toggle_opacity(&self) {
        let Some(win) = self.window() else { return };
        if !*self.stealth.lock() {
            self.push_notification.warning("Opacity toggle is only available in stealth mode.");
            return;
        }
        let mut idx = self.opacity_index.lock();
        *idx = (*idx + 1) % OPACITY_LEVELS.len();
        let _ = set_window_opacity(&win,OPACITY_LEVELS[*idx]);
    }

    pub fn set_stealth(&self, enabled: bool) {
        if enabled { self.enable_stealth() } else { self.disable_stealth() }
    }

    pub fn move_to_position(&self, position: &str) {
        let Some(win) = self.window() else { return };
        let Ok(scale) = win.scale_factor() else { return };
        let Ok(size) = win.inner_size() else { return };
        let monitor = win.current_monitor().ok().flatten()
            .or_else(|| win.primary_monitor().ok().flatten());
        let Some(monitor) = monitor else { return };
        let screen_size = monitor.size();
        let screen_pos = monitor.position();
        let win_w = size.width as i32;
        let win_h = size.height as i32;
        let screen_w = screen_size.width as i32;
        let screen_h = screen_size.height as i32;
        let base_x = screen_pos.x;
        let base_y = screen_pos.y;

        let (x, y) = match position {
            "top-left" => (0, 0),
            "top-center" => ((screen_w - win_w) / 2, 0),
            "top-right" => (screen_w - win_w, 0),
            "middle-left" => (0, (screen_h - win_h) / 2),
            "center" => ((screen_w - win_w) / 2, (screen_h - win_h) / 2),
            "middle-right" => (screen_w - win_w, (screen_h - win_h) / 2),
            "bottom-left" => (0, screen_h - win_h),
            "bottom-center" => ((screen_w - win_w) / 2, screen_h - win_h),
            "bottom-right" => (screen_w - win_w, screen_h - win_h),
            _ => ((screen_w - win_w) / 2, (screen_h - win_h) / 2),
        };

        let _ = win.set_position(tauri::PhysicalPosition::new(base_x + x, base_y + y));
    }

    pub fn move_by_arrow(&self, direction: &str) {
        let Some(win) = self.window() else { return };
        let Ok(pos) = win.outer_position() else { return };
        let (nx, ny) = match direction {
            "up" => (pos.x, pos.y - MOVE_AMOUNT),
            "down" => (pos.x, pos.y + MOVE_AMOUNT),
            "left" => (pos.x - MOVE_AMOUNT, pos.y),
            "right" => (pos.x + MOVE_AMOUNT, pos.y),
            _ => (pos.x, pos.y),
        };
        let _ = win.set_position(tauri::PhysicalPosition::new(nx, ny));
    }

    pub fn resize_by_arrow(&self, direction: &str) {
        let Some(win) = self.window() else { return };
        let Ok(size) = win.inner_size() else { return };
        let w = size.width as i32;
        let h = size.height as i32;
        let (nw, nh) = match direction {
            "up" => (w, (h - RESIZE_AMOUNT).max(MIN_HEIGHT as i32)),
            "down" => (w, h + RESIZE_AMOUNT),
            "left" => ((w - RESIZE_AMOUNT).max(MIN_WIDTH as i32), h),
            "right" => (w + RESIZE_AMOUNT, h),
            _ => (w, h),
        };
        let _ = win.set_size(tauri::PhysicalSize::new(nw as u32, nh as u32));
    }

    pub fn is_stealth(&self) -> bool {
        *self.stealth.lock()
    }
}
