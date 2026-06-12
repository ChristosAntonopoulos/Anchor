import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useCategoryStore } from '../store/useCategoryStore';
import { phoneUnlockListener } from '../services/phoneUnlockListener';
import { apiClient } from '../services/api';
import { PhoneUnlockReasonModal } from '../components/phoneUnlock/PhoneUnlockReasonModal';
import type { CreatePhoneUnlockEntryRequest } from '../types';
import { hasPhoneUnlockModule, isExpoGo } from '../utils/nativeModuleSupport';

export default function RootLayout() {
  const { fetchCategories } = useCategoryStore();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTime, setUnlockTime] = useState<number>(Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastUnlockTimeRef = useRef<number>(0);
  const isShowingModalRef = useRef<boolean>(false);
  const DEBOUNCE_MS = 2000; // Prevent duplicate modals within 2 seconds

  useEffect(() => {
    // Polyfill for window.addEventListener if it doesn't exist (React Native doesn't have window)
    // This prevents errors from dependencies that try to use web APIs
    try {
      if (typeof global !== 'undefined') {
        const globalAny = global as any;
        if (!globalAny.window) {
          globalAny.window = {};
        }
        if (typeof globalAny.window.addEventListener !== 'function') {
          globalAny.window.addEventListener = () => {
            // No-op for React Native - event listeners aren't needed
          };
        }
        if (typeof globalAny.window.removeEventListener !== 'function') {
          globalAny.window.removeEventListener = () => {
            // No-op for React Native
          };
        }
      }
    } catch (e) {
      // Silently fail if polyfill can't be applied
    }

    // Fetch categories on app initialization
    fetchCategories();

    // Don't check pending unlock on initial mount - wait for AppState listener
    // This prevents race conditions when app is already open

    // Suppress harmless "keep awake" errors from Expo/React Native internals
    // This is a known issue that occurs when Expo tries to prevent screen sleep
    // but the feature isn't available or properly configured - it doesn't affect functionality
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Unable to activate keep awake') || 
          message.includes('keep awake')) {
        // Silently suppress this harmless error
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Unable to activate keep awake') || 
          message.includes('keep awake')) {
        // Silently suppress this harmless warning
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [fetchCategories]);

  // Phone unlock detection (Android only)
  // This useEffect should only run once on mount and cleanup on unmount
  // Use a ref to track if we've already set up the listener to prevent re-initialization
  const listenerSetupRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Prevent re-initialization if already set up (e.g., during hot reload)
    if (listenerSetupRef.current) {
      console.log('[RootLayout] Listener already set up, skipping re-initialization');
      return;
    }

    if (Platform.OS !== 'android') {
      console.log('[RootLayout] Not Android, skipping phone unlock listener setup');
      return; // Only Android supports unlock detection
    }

    if (isExpoGo) {
      console.log('[RootLayout] Expo Go: skipping phone unlock listener (requires dev build)');
      return;
    }

    if (!hasPhoneUnlockModule) {
      console.log('[RootLayout] PhoneUnlockModule unavailable — run: npx expo run:android');
      return;
    }

    console.log('[RootLayout] Setting up phone unlock listener');

    // Mark as set up before starting listener
    listenerSetupRef.current = true;

    // Start listening for unlock events
    // FEATURE DISABLED: Phone unlock modal is currently disabled
    const unsubscribe = phoneUnlockListener.startListening((unlockTimeMs: number) => {
      console.log('[RootLayout] ✅ Unlock callback triggered! Time:', unlockTimeMs);
      // Feature disabled - just log the event but don't show modal
      console.log('[RootLayout] Phone unlock detected but feature is disabled');
      return;
      
      // DISABLED CODE - Uncomment to re-enable:
      // const now = Date.now();
      // const timeSinceLastUnlock = now - lastUnlockTimeRef.current;
      // 
      // // Debounce: ignore if unlock happened very recently (within 2 seconds)
      // if (timeSinceLastUnlock < DEBOUNCE_MS) {
      //   console.log('[RootLayout] Ignoring duplicate unlock event (debounced)');
      //   return;
      // }
      // 
      // // Prevent showing modal if already showing
      // if (isShowingModalRef.current) {
      //   console.log('[RootLayout] Modal already showing, ignoring unlock event');
      //   return;
      // }
      // 
      // console.log('[RootLayout] Phone unlock detected:', unlockTimeMs);
      // lastUnlockTimeRef.current = now;
      // isShowingModalRef.current = true;
      // setUnlockTime(unlockTimeMs);
      // setShowUnlockModal(true);
      // console.log('[RootLayout] Modal state set to visible');
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup on unmount only
    // Note: In development with hot reload, this may run unnecessarily
    // The listener should stay active as long as the app is running
    return () => {
      // Only cleanup if this is a real unmount (not a hot reload)
      // In development, hot reloads can cause this to run, but we want to keep listening
      if (__DEV__) {
        console.log('[RootLayout] Cleanup called (may be hot reload) - keeping listener active');
        // Don't actually stop listening in dev mode to prevent issues with hot reload
        // The listener will be re-initialized on next mount anyway
        return;
      }
      
      console.log('[RootLayout] Component unmounting - cleaning up phone unlock listener');
      listenerSetupRef.current = false; // Reset flag on cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      phoneUnlockListener.stopListening();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Listen for app state changes to check pending unlock when app comes to foreground
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    // FEATURE DISABLED: Phone unlock modal is currently disabled
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[RootLayout] App came to foreground, but phone unlock feature is disabled');
        // Feature disabled - don't check for pending unlock
        return;
        
        // DISABLED CODE - Uncomment to re-enable:
        // setTimeout(() => {
        //   checkPendingUnlock();
        // }, 500);
      }
    });

    // Feature disabled - don't check on initial mount
    // DISABLED CODE - Uncomment to re-enable:
    // if (AppState.currentState === 'active') {
    //   setTimeout(() => {
    //     checkPendingUnlock();
    //   }, 1000);
    // }

    return () => {
      subscription.remove();
    };
  }, [checkPendingUnlock]);

  const handleUnlockReasonSubmit = async (request: CreatePhoneUnlockEntryRequest) => {
    try {
      console.log('[RootLayout] Submitting unlock entry:', request);
      await apiClient.createPhoneUnlockEntry(request);
      console.log('[RootLayout] Phone unlock entry saved successfully');
      // Modal will call onClose on success
      // Don't do anything else here - let the modal handle closing
    } catch (error: any) {
      console.error('[RootLayout] Error saving unlock entry:', error);
      console.error('[RootLayout] Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      });
      // Re-throw error so modal can handle it and show error message
      throw error;
    }
  };

  const handleUnlockModalClose = useCallback(() => {
    try {
      console.log('[RootLayout] Closing unlock modal');
      
      // Reset the ref first
      isShowingModalRef.current = false;
      
      // Close modal - use functional update to ensure state is correct
      setShowUnlockModal(false);
      
      // Clear pending unlock time in a safe way (non-blocking, fire-and-forget)
      // This is optional cleanup - if it fails, it won't affect functionality
      // The pending unlock time will be overwritten on the next unlock anyway
      setTimeout(() => {
        try {
          // Check if module is available before calling
          const { NativeModules } = require('react-native');
          if (NativeModules?.PhoneUnlockModule?.clearPendingUnlockTime) {
            // Call directly - the service layer has its own error handling
            phoneUnlockListener.clearPendingUnlockTime();
          }
        } catch (clearError) {
          // Silently fail - this is not critical
          // The pending unlock time is just a cache, it will be cleared on next unlock
        }
      }, 200); // Delay to ensure React Native bridge is stable
    } catch (error) {
      console.error('[RootLayout] Error in handleUnlockModalClose:', error);
      // Still try to close the modal even if there's an error
      isShowingModalRef.current = false;
      setShowUnlockModal(false);
    }
  }, []);

  const checkPendingUnlock = useCallback(async () => {
    try {
      // Don't check if modal is already showing
      if (isShowingModalRef.current || showUnlockModal) {
        console.log('[RootLayout] Modal already showing, skipping checkPendingUnlock');
        return;
      }

      const pendingUnlockTime = await phoneUnlockListener.getPendingUnlockTime();
      if (pendingUnlockTime) {
        console.log('[RootLayout] App opened from notification with unlockTime:', pendingUnlockTime);
        isShowingModalRef.current = true;
        setUnlockTime(pendingUnlockTime);
        setShowUnlockModal(true);
      }
    } catch (error) {
      console.error('[RootLayout] Error checking pending unlock:', error);
    }
  }, [showUnlockModal]);

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="more" />
      </Stack>
      {/* FEATURE DISABLED: Phone unlock modal is currently disabled */}
      {/* Uncomment to re-enable:
      <ErrorBoundary>
        <PhoneUnlockReasonModal
          visible={showUnlockModal}
          onSubmit={handleUnlockReasonSubmit}
          unlockTime={unlockTime}
          onClose={handleUnlockModalClose}
        />
      </ErrorBoundary>
      */}
    </ErrorBoundary>
  );
}
