// Notification Listener Service for Android
// Bridges native NotificationListenerService to React Native

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { NotificationData } from '../types/notifications';
import { hasNotificationListenerModule, isExpoGo } from '../utils/nativeModuleSupport';

const { NotificationListenerModule } = NativeModules;

const isAndroid = Platform.OS === 'android';

const eventEmitter = isAndroid && NotificationListenerModule
  ? new NativeEventEmitter(NotificationListenerModule)
  : null;

if (__DEV__ && isAndroid && !isExpoGo && !hasNotificationListenerModule) {
  console.log('[NotificationListener] Module unavailable — use: npx expo run:android');
}

export interface NotificationListenerService {
  /**
   * Check if notification listener service is enabled
   */
  isEnabled(): Promise<boolean>;

  /**
   * Open Android settings to enable notification access
   * Returns a promise with the method used: "standard", "app_details", "general", or error
   */
  openSettings(): Promise<string>;
  
  /**
   * Get device information (manufacturer, model, etc.)
   */
  getDeviceInfo(): Promise<{ manufacturer: string; model: string; brand: string; device: string; sdkInt: number }>;

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
      console.warn('[NotificationListener] NotificationListenerModule is not available!');
      console.warn('[NotificationListener] Make sure the native module is properly registered in MainApplication.kt');
      console.warn('[NotificationListener] Available modules:', Object.keys(NativeModules));
      // Return false instead of throwing - graceful degradation
      return false;
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
      // Return false instead of throwing - graceful degradation
      return false;
    }
  }

  async openSettings(): Promise<string> {
    console.log('[NotificationListener] openSettings() called');
    
    if (!isAndroid) {
      console.warn('[NotificationListener] Not Android platform');
      throw new Error('Notification settings are only available on Android');
    }
    
    if (!NotificationListenerModule) {
      console.warn('[NotificationListener] NotificationListenerModule is not available!');
      console.warn('[NotificationListener] Cannot open settings - native module not registered');
      throw new Error('Notification module not available');
    }
    
    try {
      console.log('[NotificationListener] Opening notification access settings...');
      const method = await NotificationListenerModule.openNotificationSettings();
      console.log('[NotificationListener] Settings opened successfully using method:', method);
      return method;
    } catch (error: any) {
      console.error('[NotificationListener] Error opening notification settings:', error);
      console.error('[NotificationListener] Error details:', {
        message: error?.message,
        code: error?.code,
      });
      throw error;
    }
  }
  
  async getDeviceInfo(): Promise<{ manufacturer: string; model: string; brand: string; device: string; sdkInt: number }> {
    console.log('[NotificationListener] getDeviceInfo() called');
    
    if (!isAndroid) {
      throw new Error('Device info is only available on Android');
    }
    
    if (!NotificationListenerModule) {
      throw new Error('Notification module not available');
    }
    
    try {
      const deviceInfo = await NotificationListenerModule.getDeviceInfo();
      console.log('[NotificationListener] Device info:', deviceInfo);
      return deviceInfo;
    } catch (error: any) {
      console.error('[NotificationListener] Error getting device info:', error);
      throw error;
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
