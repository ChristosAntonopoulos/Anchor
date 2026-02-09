// Notification Listener Service for Android
// Bridges native NotificationListenerService to React Native

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { NotificationData } from '../types/notifications';

const { NotificationListenerModule } = NativeModules;

// Check if running on Android
const isAndroid = Platform.OS === 'android';

// Create event emitter
const eventEmitter = isAndroid && NotificationListenerModule
  ? new NativeEventEmitter(NotificationListenerModule)
  : null;

export interface NotificationListenerService {
  /**
   * Check if notification listener service is enabled
   */
  isEnabled(): Promise<boolean>;

  /**
   * Open Android settings to enable notification access
   */
  openSettings(): void;

  /**
   * Get currently active notifications
   */
  getActiveNotifications(): Promise<NotificationData[]>;

  /**
   * Subscribe to notification posted events
   */
  onNotificationPosted(callback: (notification: NotificationData) => void): () => void;

  /**
   * Subscribe to notification removed events
   */
  onNotificationRemoved(callback: (notification: { id: string; packageName: string }) => void): () => void;
}

class NotificationListenerServiceImpl implements NotificationListenerService {
  async isEnabled(): Promise<boolean> {
    if (!isAndroid) {
      console.log('Notification listener is only available on Android');
      return false;
    }
    
    if (!NotificationListenerModule) {
      console.warn('NotificationListenerModule is not available. Make sure the native module is properly registered.');
      return false;
    }
    
    try {
      return await NotificationListenerModule.isNotificationServiceEnabled();
    } catch (error) {
      console.error('Error checking notification service status:', error);
      return false;
    }
  }

  openSettings(): void {
    if (!isAndroid) {
      console.warn('Notification listener is only available on Android');
      return;
    }
    
    if (!NotificationListenerModule) {
      console.error('NotificationListenerModule is not available. Make sure the native module is properly registered.');
      return;
    }
    
    try {
      console.log('Opening notification access settings...');
      NotificationListenerModule.openNotificationSettings();
    } catch (error) {
      console.error('Error opening notification settings:', error);
      throw error;
    }
  }

  async getActiveNotifications(): Promise<NotificationData[]> {
    if (!isAndroid) {
      return [];
    }
    
    if (!NotificationListenerModule) {
      console.warn('NotificationListenerModule is not available. Make sure the native module is properly registered.');
      return [];
    }
    
    try {
      const notifications = await NotificationListenerModule.getActiveNotifications();
      return notifications || [];
    } catch (error) {
      console.error('Error getting active notifications:', error);
      return [];
    }
  }

  onNotificationPosted(callback: (notification: NotificationData) => void): () => void {
    if (!eventEmitter) {
      console.warn('Notification listener events not available');
      return () => {};
    }

    const subscription = eventEmitter.addListener('onNotificationPosted', callback);
    return () => subscription.remove();
  }

  onNotificationRemoved(
    callback: (notification: { id: string; packageName: string }) => void
  ): () => void {
    if (!eventEmitter) {
      console.warn('Notification listener events not available');
      return () => {};
    }

    const subscription = eventEmitter.addListener('onNotificationRemoved', callback);
    return () => subscription.remove();
  }
}

export const notificationListener: NotificationListenerService = new NotificationListenerServiceImpl();
