use std::fs;
use std::path::PathBuf;

use parking_lot::Mutex;
use serde_json::Value;

use crate::types::config::{RuntimeConfig, StoredConfig, WindowBounds, WindowConfig};
use crate::utils::merge_json;

pub struct ConfigStore {
    data: Mutex<StoredConfig>,
    path: PathBuf,
}

impl ConfigStore {
    pub fn new(app_data_dir: PathBuf) -> Self {
        let _ = fs::create_dir_all(&app_data_dir);
        let path = app_data_dir.join("config.json");
        let data = fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();
        let store = Self { data: Mutex::new(data), path };
        store.migrate();
        store
    }

    fn migrate(&self) {
        let mut data = self.data.lock();
        let runtime = data.runtime.get_or_insert_with(RuntimeConfig::default);
        runtime.face_swap = false;
        drop(data);
        self.persist();
    }

    fn persist(&self) {
        let data = self.data.lock();
        if let Ok(json) = serde_json::to_string_pretty(&*data) {
            let _ = fs::write(&self.path, json);
        }
    }

    pub fn get_config(&self) -> RuntimeConfig {
        let data = self.data.lock();
        data.runtime.clone().unwrap_or_default()
    }

    pub fn update_config(&self, updates: Value) -> RuntimeConfig {
        let mut data = self.data.lock();
        let runtime = data.runtime.get_or_insert_with(RuntimeConfig::default);
        if let Ok(mut current) = serde_json::to_value(&*runtime) {
            merge_json(&mut current, &updates);
            if let Ok(merged) = serde_json::from_value::<RuntimeConfig>(current) {
                *runtime = merged;
            }
        }
        let result = runtime.clone();
        drop(data);
        self.persist();
        result
    }

    pub fn get_window_bounds(&self) -> Option<WindowBounds> {
        let data = self.data.lock();
        data.window.as_ref()?.bounds.clone()
    }

    pub fn save_window_bounds(&self, bounds: WindowBounds) {
        let mut data = self.data.lock();
        let window = data.window.get_or_insert_with(WindowConfig::default);
        window.bounds = Some(WindowBounds {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width.filter(|&w| w > 0),
            height: bounds.height.filter(|&h| h > 0),
        });
        drop(data);
        self.persist();
    }

    pub fn get_stealth(&self) -> bool {
        let data = self.data.lock();
        data.window.as_ref().and_then(|w| w.stealth).unwrap_or(false)
    }

    pub fn set_stealth(&self, enabled: bool) {
        let mut data = self.data.lock();
        data.window.get_or_insert_with(WindowConfig::default).stealth = Some(enabled);
        drop(data);
        self.persist();
    }

    pub fn get_zoom_factor(&self) -> f64 {
        let data = self.data.lock();
        data.window.as_ref().and_then(|w| w.zoom_factor).unwrap_or(1.0)
    }

    pub fn save_zoom_factor(&self, factor: f64) {
        let mut data = self.data.lock();
        data.window.get_or_insert_with(WindowConfig::default).zoom_factor = Some(factor);
        drop(data);
        self.persist();
    }
}
