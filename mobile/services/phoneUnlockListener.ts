// Phone Unlock Listener Service for Android
// Bridges native PhoneUnlockModule to React Native

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { hasPhoneUnlockModule, isExpoGo } from '../utils/nativeModuleSupport';

const { PhoneUnlockModule } = NativeModules;

const isAndroid = Platform.OS === 'android';

let eventEmitter: NativeEventEmitter | null = null;

function getEventEmitter(): NativeEventEmitter | null {
  if (!isAndroid || !PhoneUnlockModule) return null;
  if (!eventEmitter) {
    try {
      eventEmitter = new NativeEventEmitter(PhoneUnlockModule);
    } catch (error) {
      console.warn('[PhoneUnlockListener] Failed to create event emitter:', error);
      return null;
    }
  }
  return eventEmitter;
}

if (__DEV__ && isAndroid && !isExpoGo && !hasPhoneUnlockModule) {
  console.log('[PhoneUnlockListener] Module unavailable — use: npx expo run:android');
}

export interface PhoneUnlockListenerService {
  /**
   * Start listening for phone unlock events
   */
  startListening(callback: (unlockTime: number) => void): () => void;

  /**
   * Stop listening for phone unlock events
   */
  stopListening(): void;

  /**
   * Get pending unlock time if app was opened from notification
   */
  getPendingUnlockTime(): Promise<number | null>;

  /**
   * Clear pending unlock time
   */
  clearPendingUnlockTime(): void;

  setApiUrl(url: string): void;
  isAccessibilityServiceEnabled(): Promise<boolean>;
  openAccessibilitySettings(): void;
}

class PhoneUnlockListenerServiceImpl implements PhoneUnlockListenerService {
  private subscription: any = null;

  startListening(callback: (unlockTime: number) => void): () => void {
    console.log('[PhoneUnlockListener] startListening() called');
    
    if (!isAndroid) {
      console.log('[PhoneUnlockListener] Not Android platform, returning no-op unsubscribe');
      return () => {};
    }
    
    if (!PhoneUnlockModule) {
      console.warn('[PhoneUnlockListener] PhoneUnlockModule is not available!');
      console.warn('[PhoneUnlockListener] Make sure the native module is properly registered in MainApplication.kt');
      return () => {};
    }
    
    try {
      // Start native listener
      console.log('[PhoneUnlockListener] Starting native unlock listener...');
      PhoneUnlockModule.startListening();
      
      // Subscribe to events
      const emitter = getEventEmitter();
      if (!emitter) {
        console.warn('[PhoneUnlockListener] Event emitter not available, cannot subscribe to unlock events');
        return () => {};
      }

      console.log('[PhoneUnlockListener] Subscribing to onPhoneUnlock events');
      this.subscription = emitter.addListener('onPhoneUnlock', (event: { unlockTime: number }) => {
        console.log('[PhoneUnlockListener] Phone unlock event received:', event.unlockTime);
        callback(event.unlockTime);
      });
      
      return () => {
        console.log('[PhoneUnlockListener] Unsubscribing from onPhoneUnlock events');
        if (this.subscription) {
          this.subscription.remove();
          this.subscription = null;
        }
      };
    } catch (error: any) {
      console.error('[PhoneUnlockListener] Error starting unlock listener:', error);
      return () => {};
    }
  }

  stopListening(): void {
    console.log('[PhoneUnlockListener] stopListening() called');
    
    if (!isAndroid || !PhoneUnlockModule) {
      return;
    }
    
    try {
      // Remove subscription
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      
      // Stop native listener
      PhoneUnlockModule.stopListening();
      console.log('[PhoneUnlockListener] Stopped listening for unlock events');
    } catch (error: any) {
      console.error('[PhoneUnlockListener] Error stopping unlock listener:', error);
    }
  }

  async getPendingUnlockTime(): Promise<number | null> {
    console.log('[PhoneUnlockListener] getPendingUnlockTime() called');
    
    if (!isAndroid || !PhoneUnlockModule) {
      return null;
    }
    
    try {
      const time = await PhoneUnlockModule.getPendingUnlockTime();
      console.log('[PhoneUnlockListener] Pending unlock time:', time);
      return time ? Number(time) : null;
    } catch (error: any) {
      console.error('[PhoneUnlockListener] Error getting pending unlock time:', error);
      return null;
    }
  }

  setApiUrl(url: string): void {
    if (!isAndroid || !PhoneUnlockModule || typeof PhoneUnlockModule.setApiUrl !== 'function') {
      return;
    }
    PhoneUnlockModule.setApiUrl(url);
  }

  async isAccessibilityServiceEnabled(): Promise<boolean> {
    if (!isAndroid || !PhoneUnlockModule?.isAccessibilityServiceEnabled) {
      return false;
    }
    try {
      return Boolean(await PhoneUnlockModule.isAccessibilityServiceEnabled());
    } catch {
      return false;
    }
  }

  openAccessibilitySettings(): void {
    if (!isAndroid || !PhoneUnlockModule?.openAccessibilitySettings) {
      return;
    }
    PhoneUnlockModule.openAccessibilitySettings();
  }

  clearPendingUnlockTime(): void {
    console.log('[PhoneUnlockListener] clearPendingUnlockTime() called');
    
    if (!isAndroid) {
      console.log('[PhoneUnlockListener] Not Android, skipping clear');
      return;
    }
    
    if (!PhoneUnlockModule) {
      console.log('[PhoneUnlockListener] PhoneUnlockModule not available, skipping clear');
      return;
    }
    
    // Check if the method exists before calling
    if (typeof PhoneUnlockModule.clearPendingUnlockTime !== 'function') {
      console.log('[PhoneUnlockListener] clearPendingUnlockTime method not available, skipping');
      return;
    }
    
    try {
      // Call the native method - wrap in try-catch to prevent any crashes
      PhoneUnlockModule.clearPendingUnlockTime();
      console.log('[PhoneUnlockListener] Cleared pending unlock time');
    } catch (error: any) {
      // Log but don't throw - this is not critical
      console.log('[PhoneUnlockListener] Error clearing pending unlock time (non-critical):', error?.message || 'Unknown error');
      // Don't re-throw - we don't want this to crash the app
    }
  }
}

export const phoneUnlockListener: PhoneUnlockListenerService = new PhoneUnlockListenerServiceImpl();
