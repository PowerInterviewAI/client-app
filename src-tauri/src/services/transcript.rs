use std::sync::Arc;

use parking_lot::Mutex;

use crate::services::app_state::AppStateService;
use crate::services::live_suggestion::LiveSuggestionService;
use crate::types::app_state::{Speaker, Transcript};
use crate::consts::{LIVE_SUGGESTION_GAP_MS, TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS};
use crate::utils::now_ms;

struct TranscriptState {
    is_active: bool,
    self_transcripts: Vec<Transcript>,
    self_partial: Option<Transcript>,
    other_transcripts: Vec<Transcript>,
    other_partial: Option<Transcript>,
}

impl Default for TranscriptState {
    fn default() -> Self {
        Self {
            is_active: false,
            self_transcripts: vec![],
            self_partial: None,
            other_transcripts: vec![],
            other_partial: None,
        }
    }
}

pub struct TranscriptService {
    state: Mutex<TranscriptState>,
    app_state: Arc<AppStateService>,
    live_suggestion: Arc<LiveSuggestionService>,
}

impl TranscriptService {
    pub fn new(app_state: Arc<AppStateService>, live_suggestion: Arc<LiveSuggestionService>) -> Self {
        Self {
            state: Mutex::new(TranscriptState::default()),
            app_state,
            live_suggestion,
        }
    }

    pub fn start(&self) {
        self.state.lock().is_active = true;
    }

    pub fn stop(&self) {
        self.state.lock().is_active = false;
    }

    pub fn clear(&self) {
        let mut s = self.state.lock();
        *s = TranscriptState::default();
        drop(s);
        self.app_state.set_transcripts(vec![]);
    }

    pub async fn ingest(&self, channel: &str, transcript_type: &str, text: &str) {
        let text = text.trim().to_string();
        if text.is_empty() {
            return;
        }

        let is_active = self.state.lock().is_active;
        if !is_active {
            return;
        }

        let speaker = if channel.to_lowercase() == "ch_0" { Speaker::Other } else { Speaker::SelfSpeaker };
        let is_final = transcript_type.to_lowercase() == "final";
        let now = now_ms();

        let transcript = Transcript { timestamp: now, text, speaker: speaker.clone(), is_final, end_timestamp: now };

        let trigger_suggestion;
        let cleaned;

        {
            let mut s = self.state.lock();

            match (&speaker, is_final) {
                (Speaker::SelfSpeaker, true) => {
                    let ts = s.self_partial.as_ref().map(|p| p.timestamp).unwrap_or(now);
                    let mut t = transcript.clone();
                    t.timestamp = ts;
                    s.self_transcripts.push(t);
                    s.self_partial = None;
                }
                (Speaker::SelfSpeaker, false) => {
                    if let Some(ref mut p) = s.self_partial {
                        p.text = transcript.text.clone();
                        p.end_timestamp = now;
                    } else {
                        s.self_partial = Some(transcript.clone());
                    }
                }
                (Speaker::Other, true) => {
                    let ts = s.other_partial.as_ref().map(|p| p.timestamp).unwrap_or(now);
                    let mut t = transcript.clone();
                    t.timestamp = ts;
                    s.other_transcripts.push(t);
                    s.other_partial = None;
                }
                (Speaker::Other, false) => {
                    if let Some(ref mut p) = s.other_partial {
                        p.text = transcript.text.clone();
                        p.end_timestamp = now;
                    } else {
                        s.other_partial = Some(transcript.clone());
                    }
                }
            }

            let mut all: Vec<Transcript> = s.self_transcripts.iter().chain(s.other_transcripts.iter()).cloned().collect();
            if let Some(ref p) = s.self_partial { all.push(p.clone()); }
            if let Some(ref p) = s.other_partial { all.push(p.clone()); }
            all.sort_by_key(|t| t.timestamp);

            cleaned = Self::merge_consecutive(all);

            let last_self = cleaned.iter().rev().find(|t| matches!(t.speaker, Speaker::SelfSpeaker) && t.is_final).cloned();
            trigger_suggestion = speaker == Speaker::Other
                && is_final
                && s.self_partial.is_none()
                && last_self.as_ref().map(|t| now_ms() - t.end_timestamp > LIVE_SUGGESTION_GAP_MS).unwrap_or(true);
        }

        self.app_state.set_transcripts(cleaned.clone());

        if trigger_suggestion {
            let suggestion_service = Arc::clone(&self.live_suggestion);
            let transcripts = cleaned;
            tokio::spawn(async move {
                suggestion_service.start_generate(transcripts).await;
            });
        }
    }

    fn merge_consecutive(transcripts: Vec<Transcript>) -> Vec<Transcript> {
        let mut cleaned: Vec<Transcript> = vec![];
        for t in transcripts {
            if let Some(last) = cleaned.last_mut() {
                if last.speaker == t.speaker && t.timestamp - last.end_timestamp <= TRANSCRIPT_INTER_TRANSCRIPT_GAP_MS {
                    last.text.push(' ');
                    last.text.push_str(&t.text);
                    last.end_timestamp = t.end_timestamp;
                    continue;
                }
            }
            cleaned.push(t);
        }
        cleaned
    }
}
