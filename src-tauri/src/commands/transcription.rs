use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use tauri::State;

use crate::AppServices;

struct SendableStream(#[allow(dead_code)] Stream);
unsafe impl Send for SendableStream {}
unsafe impl Sync for SendableStream {}

static LOOPBACK_STREAM: Lazy<Mutex<Option<SendableStream>>> = Lazy::new(|| Mutex::new(None));

#[tauri::command]
pub fn transcription_start(services: State<'_, AppServices>) {
    use crate::types::app_state::RunningState;
    services.transcript.start();
    services.app_state.set_running_state(RunningState::Running);
}

#[tauri::command]
pub fn transcription_stop(services: State<'_, AppServices>) {
    use crate::types::app_state::RunningState;
    services.transcript.stop();
    services.app_state.set_running_state(RunningState::Idle);
}

#[tauri::command]
pub fn transcription_clear(services: State<'_, AppServices>) {
    services.transcript.clear();
}

#[tauri::command]
pub async fn transcription_ingest(
    channel: String,
    transcript_type: String,
    text: String,
    services: State<'_, AppServices>,
) -> Result<(), String> {
    services
        .transcript
        .ingest(&channel, &transcript_type, &text)
        .await;
    Ok(())
}

#[tauri::command]
pub fn transcription_set_session_token(token: String, services: State<'_, AppServices>) {
    services
        .config_store
        .update_config(serde_json::json!({ "sessionToken": token }));
}

#[tauri::command]
pub fn enable_loopback_audio() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let monitors = xcap::Monitor::all()
            .map_err(|e| format!("Screen recording permission check failed: {e}"))?;
        let monitor = monitors
            .into_iter()
            .next()
            .ok_or("No display monitor found for screen recording check")?;
        monitor
            .capture_image()
            .map_err(|e| format!("Screen recording permission denied: {e}"))?;
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        let mut stream_guard = LOOPBACK_STREAM.lock();
        if stream_guard.is_some() {
            return Ok(());
        }

        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or("No default output device found for loopback audio capture")?;

        let supported_config = device
            .supported_input_configs()
            .map_err(|e| format!("Failed to query capture formats: {e}"))?
            .find(|config| config.sample_format() == SampleFormat::F32)
            .or_else(|| {
                device
                    .supported_input_configs()
                    .ok()
                    .and_then(|mut configs| configs.next())
            })
            .ok_or("No compatible loopback input format was found")?
            .with_max_sample_rate();

        let config = supported_config.config();
        let stream = build_loopback_stream(&device, &config, supported_config.sample_format())?;
        stream
            .play()
            .map_err(|e| format!("Failed to start loopback stream: {e}"))?;
        *stream_guard = Some(SendableStream(stream));
        return Ok(());
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Loopback audio support is only available on Windows 11+ and macOS 14.4+.".into())
    }
}

#[tauri::command]
pub fn disable_loopback_audio() -> Result<(), String> {
    let mut stream_guard = LOOPBACK_STREAM.lock();
    if stream_guard.is_some() {
        *stream_guard = None;
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn build_loopback_stream(
    device: &cpal::Device,
    config: &StreamConfig,
    sample_format: SampleFormat,
) -> Result<Stream, String> {
    match sample_format {
        SampleFormat::F32 => device.build_input_stream(
            config,
            move |_data: &[f32], _info| {},
            move |error| log::error!("[AudioLoopback] stream error: {error}"),
            None,
        ),
        SampleFormat::I16 => device.build_input_stream(
            config,
            move |_data: &[i16], _info| {},
            move |error| log::error!("[AudioLoopback] stream error: {error}"),
            None,
        ),
        SampleFormat::U16 => device.build_input_stream(
            config,
            move |_data: &[u16], _info| {},
            move |error| log::error!("[AudioLoopback] stream error: {error}"),
            None,
        ),
        _ => return Err(format!("Unsupported sample format: {:?}", sample_format)),
    }
    .map_err(|e| format!("Failed to create loopback stream: {e}"))
}
