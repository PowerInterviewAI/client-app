export interface PushNotification {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
