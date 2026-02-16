// Notification Listener Service for Android
// Bridges native NotificationListenerService to React Native

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { NotificationData } from '../types/notifications';

const { NotificationListenerModule } = NativeModules;

// Check if running on Android
const isAndroid = Platform.OS === 'android';

// Log module availability on load
console.log('[NotificationListener] Platform:', Platform.OS);
console.log('[NotificationListener] Native module available:', !!NotificationListenerModule);
if (NotificationListenerModule) {
  console.log('[NotificationListener] Module name:', NotificationListenerModule.getName?.() || 'Unknown');
}

// Create event emitter
const eventEmitter = isAndroid && NotificationListenerModule
  ? new NativeEventEmitter(NotificationListenerModule)
  : null;

if (!eventEmitter && isAndroid) {
  console.warn('[NotificationListener] Event emitter not created - module unavailable');
}

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
    console.log('[NotificationListener] isEnabled() called');
    
    if (!isAndroid) {
      console.log('[NotificationListener] Not Android platform, returning false');
      return false;
    }
    
    if (!NotificationListenerModule) {
      console.error('[NotificationListener] NotificationListenerModule is not available!');
      console.error('[NotificationListener] Make sure the native module is properly registered in MainApplication.kt');
      console.error('[NotificationListener] Available modules:', Object.keys(NativeModules));
      throw new Error('NotificationListenerModule not available. Native module may not be registered.');
    }
    
    try {
      console.log('[NotificationListener] Calling native isNotificationServiceEnabled()...');
      const result = await NotificationListenerModule.isNotificationServiceEnabled();
      console.log('[NotificationListener] Native check result:', result);
      return result;
    } catch (error: any) {
      console.error('[NotificationListener] Error checking notification service status:', error);
      console.error('[NotificationListener] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      throw new Error(`Failed to check notification service: ${error?.message || 'Unknown error'}`);
    }
  }

  openSettings(): void {
    console.log('[NotificationListener] openSettings() called');
    
    if (!isAndroid) {
      console.warn('[NotificationListener] Not Android platform');
      throw new Error('Notification listener is only available on Android');
    }
    
    if (!NotificationListenerModule) {
      console.error('[NotificationListener] NotificationListenerModule is not available!');
      throw new Error('NotificationListenerModule not available. Native module may not be registered.');
    }
    
    try {
      console.log('[NotificationListener] Opening notification access settings...');
      NotificationListenerModule.openNotificationSettings();
      console.log('[NotificationListener] Settings intent sent successfully');
    } catch (error: any) {
      console.error('[NotificationListener] Error opening notification settings:', error);
      console.error('[NotificationListener] Error details:', {
        message: error?.message,
        code: error?.code,
      });
      throw new Error(`Failed to open settings: ${error?.message || 'Unknown error'}`);
    }
  }

  async getActiveNotifications(): Promise<NotificationData[]> {
    console.log('[NotificationListener] getActiveNotifications() called');
    
    if (!isAndroid) {
      console.log('[NotificationListener] Not Android platform, returning empty array');
      return [];
    }
    
    if (!NotificationListenerModule) {
      console.warn('[NotificationListener] NotificationListenerModule is not available');
      return [];
    }
    
    try {
      console.log('[NotificationListener] Fetching active notifications from native module...');
      const notifications = await NotificationListenerModule.getActiveNotifications();
      console.log('[NotificationListener] Received', notifications?.length || 0, 'notifications');
      return notifications || [];
    } catch (error: any) {
      console.error('[NotificationListener] Error getting active notifications:', error);
      return [];
    }
  }

  onNotificationPosted(callback: (notification: NotificationData) => void): () => void {
    console.log('[NotificationListener] onNotificationPosted() subscription requested');
    
    if (!eventEmitter) {
      console.warn('[NotificationListener] Event emitter not available, cannot subscribe to notification events');
      return () => {};
    }

    console.log('[NotificationListener] Subscribing to onNotificationPosted events');
    const subscription = eventEmitter.addListener('onNotificationPosted', (notification) => {
      console.log('[NotificationListener] onNotificationPosted event received:', notification.packageName);
      callback(notification);
    });
    
    return () => {
      console.log('[NotificationListener] Unsubscribing from onNotificationPosted events');
      subscription.remove();
    };
  }

  onNotificationRemoved(
    callback: (notification: { id: string; packageName: string }) => void
  ): () => void {
    console.log('[NotificationListener] onNotificationRemoved() subscription requested');
    
    if (!eventEmitter) {
      console.warn('[NotificationListener] Event emitter not available, cannot subscribe to notification events');
      return () => {};
    }

    console.log('[NotificationListener] Subscribing to onNotificationRemoved events');
    const subscription = eventEmitter.addListener('onNotificationRemoved', (notification) => {
      console.log('[NotificationListener] onNotificationRemoved event received:', notification.packageName);
      callback(notification);
    });
    
    return () => {
      console.log('[NotificationListener] Unsubscribing from onNotificationRemoved events');
      subscription.remove();
    };
  }
}

export const notificationListener: NotificationListenerService = new NotificationListenerServiceImpl();
