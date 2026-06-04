pub fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

/// Decode as much valid UTF-8 as possible from `buf`, appending it to `out`, and
/// retain any trailing *incomplete* multi-byte sequence in `buf` for the next call.
///
/// Streamed HTTP chunks can split a multi-byte UTF-8 character across boundaries;
/// decoding each chunk independently with `from_utf8_lossy` would corrupt those
/// characters into `�`. This buffers the incomplete tail until the rest arrives.
/// Genuinely invalid bytes are replaced with U+FFFD and skipped.
pub fn drain_utf8(buf: &mut Vec<u8>, out: &mut String) {
    loop {
        match std::str::from_utf8(buf) {
            Ok(s) => {
                out.push_str(s);
                buf.clear();
                return;
            }
            Err(e) => {
                let valid = e.valid_up_to();
                if valid > 0 {
                    // SAFETY: `valid_up_to` guarantees this prefix is valid UTF-8.
                    out.push_str(unsafe { std::str::from_utf8_unchecked(&buf[..valid]) });
                }
                match e.error_len() {
                    // Incomplete trailing sequence — keep it and wait for more bytes.
                    None => {
                        buf.drain(..valid);
                        return;
                    }
                    // Genuinely invalid byte(s) — emit a replacement and skip past them.
                    Some(len) => {
                        out.push('\u{FFFD}');
                        buf.drain(..valid + len);
                    }
                }
            }
        }
    }
}

pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Map a raw API error string (e.g. "HTTP 402 - ...") to a user-facing message.
/// The streaming endpoints surface errors as `HTTP {status} - {body}` strings.
pub fn llm_error_message(err: &str) -> String {
    if err.contains("401") || err.contains("403") {
        "Your session has expired. Please sign in again.".into()
    } else if err.contains("402") {
        "You're out of credits. Please top up to continue.".into()
    } else if err.contains("429") {
        "Too many requests. Please try again later.".into()
    } else if err.contains("503") || err.contains("502") || err.contains("500") {
        "The server is temporarily unavailable. Please try again shortly.".into()
    } else {
        "Failed to generate response.".into()
    }
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
