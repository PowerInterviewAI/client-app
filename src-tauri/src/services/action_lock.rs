use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum ActionType {
    ScreenshotCapture,
    CaptureSuggestion,
}

pub struct ActionLockService {
    screenshot: Arc<AtomicBool>,
    suggestion: Arc<AtomicBool>,
}

impl ActionLockService {
    pub fn new() -> Self {
        Self {
            screenshot: Arc::new(AtomicBool::new(false)),
            suggestion: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn try_acquire(&self, action: ActionType) -> bool {
        let flag = self.flag(action);
        flag.compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
            .is_ok()
    }

    pub fn release(&self, action: ActionType) {
        self.flag(action).store(false, Ordering::Release);
    }

    pub fn is_locked(&self, action: ActionType) -> bool {
        self.flag(action).load(Ordering::Acquire)
    }

    fn flag(&self, action: ActionType) -> &AtomicBool {
        match action {
            ActionType::ScreenshotCapture => &self.screenshot,
            ActionType::CaptureSuggestion => &self.suggestion,
        }
    }
}
