pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

pub fn merge_json(base: &mut serde_json::Value, patch: &serde_json::Value) {
    use serde_json::Value;
    match (base, patch) {
        (Value::Object(base_map), Value::Object(patch_map)) => {
            for (key, patch_val) in patch_map {
                let entry = base_map.entry(key.clone()).or_insert(Value::Null);
                merge_json(entry, patch_val);
            }
        }
        (base, patch) => {
            *base = patch.clone();
        }
    }
}
