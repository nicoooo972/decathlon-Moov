type NotificationType = 'success' | 'error' | 'info' | 'warning';

export function showNotification(message: string, type: NotificationType = 'info') {
  // TODO: Implement actual notification system
  console.log(`[${type.toUpperCase()}] ${message}`);
} 