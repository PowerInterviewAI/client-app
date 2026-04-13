import { PushNotification } from '../types/push-notification.js';
import { getWindowReference } from './window-control.service.js';

class PushNotificationService {
  pushNotification(notification: PushNotification) {
    try {
      const win = getWindowReference();
      if (win && !win.isDestroyed()) {
        win.webContents.send('push-notification', notification);
      }
    } catch (e) {
      console.warn('Failed to send push notification:', e);
    }
  }
}

export const pushNotificationService = new PushNotificationService();
