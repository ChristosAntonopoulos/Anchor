// Phone Unlock Listener Service for Android
// Bridges native PhoneUnlockModule to React Native

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { PhoneUnlockModule } = NativeModules;

// Check if running on Android
const isAndroid = Platform.OS === 'android';

// Log module availability on load
console.log('[PhoneUnlockListener] Platform:', Platform.OS);
console.log('[PhoneUnlockListener] Native module available:', !!PhoneUnlockModule);
if (PhoneUnlockModule) {
  console.log('[PhoneUnlockListener] Module name:', PhoneUnlockModule.getName?.() || 'Unknown');
  console.log('[PhoneUnlockListener] Available methods:', Object.keys(PhoneUnlockModule));
}

// Create event emitter
const eventEmitter = isAndroid && PhoneUnlockModule
  ? new NativeEventEmitter(PhoneUnlockModule)
  : null;

if (!eventEmitter && isAndroid) {
  console.warn('[PhoneUnlockListener] Event emitter not created - module unavailable');
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
      if (!eventEmitter) {
        console.warn('[PhoneUnlockListener] Event emitter not available, cannot subscribe to unlock events');
        return () => {};
      }

      console.log('[PhoneUnlockListener] Subscribing to onPhoneUnlock events');
      this.subscription = eventEmitter.addListener('onPhoneUnlock', (event: { unlockTime: number }) => {
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
}

export const phoneUnlockListener: PhoneUnlockListenerService = new PhoneUnlockListenerServiceImpl();
