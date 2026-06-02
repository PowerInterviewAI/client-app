use tauri::{AppHandle, Emitter};

use crate::types::push_notification::PushNotification;

pub struct PushNotificationService {
    app_handle: AppHandle,
}

impl PushNotificationService {
    pub fn new(app_handle: AppHandle) -> Self {
        Self { app_handle }
    }

    pub fn push(&self, notification: PushNotification) {
        let _ = self.app_handle.emit("push-notification", &notification);
    }

    pub fn error(&self, message: impl Into<String>) {
        use crate::types::push_notification::NotificationType;
        self.push(PushNotification { message: message.into(), notification_type: NotificationType::Error });
    }

    pub fn warning(&self, message: impl Into<String>) {
        use crate::types::push_notification::NotificationType;
        self.push(PushNotification { message: message.into(), notification_type: NotificationType::Warning });
    }

    pub fn success(&self, message: impl Into<String>) {
        use crate::types::push_notification::NotificationType;
        self.push(PushNotification { message: message.into(), notification_type: NotificationType::Success });
    }
}
