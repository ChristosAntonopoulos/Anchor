import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useCategoryStore } from '../store/useCategoryStore';
import { phoneUnlockListener } from '../services/phoneUnlockListener';
import { apiClient } from '../services/api';
import { PhoneUnlockReasonModal } from '../components/phoneUnlock/PhoneUnlockReasonModal';
import type { CreatePhoneUnlockEntryRequest } from '../types';

export default function RootLayout() {
  const { fetchCategories } = useCategoryStore();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTime, setUnlockTime] = useState<number>(Date.now());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastUnlockTimeRef = useRef<number>(0);
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
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return; // Only Android supports unlock detection
    }

    console.log('[RootLayout] Setting up phone unlock listener');

    // Start listening for unlock events
    const unsubscribe = phoneUnlockListener.startListening((unlockTimeMs: number) => {
      const now = Date.now();
      const timeSinceLastUnlock = now - lastUnlockTimeRef.current;

      // Debounce: ignore if unlock happened very recently (within 2 seconds)
      if (timeSinceLastUnlock < DEBOUNCE_MS) {
        console.log('[RootLayout] Ignoring duplicate unlock event (debounced)');
        return;
      }

      console.log('[RootLayout] Phone unlock detected:', unlockTimeMs);
      lastUnlockTimeRef.current = now;
      setUnlockTime(unlockTimeMs);
      setShowUnlockModal(true);
    });

    unsubscribeRef.current = unsubscribe;

    // Cleanup on unmount
    return () => {
      console.log('[RootLayout] Cleaning up phone unlock listener');
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      phoneUnlockListener.stopListening();
    };
  }, []);

  const handleUnlockReasonSubmit = async (request: CreatePhoneUnlockEntryRequest) => {
    await apiClient.createPhoneUnlockEntry(request);
    console.log('[RootLayout] Phone unlock entry saved successfully');
    // Modal will call onClose on success
  };

  const handleUnlockModalClose = () => {
    setShowUnlockModal(false);
  };

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
      <PhoneUnlockReasonModal
        visible={showUnlockModal}
        onSubmit={handleUnlockReasonSubmit}
        unlockTime={unlockTime}
        onClose={handleUnlockModalClose}
      />
    </ErrorBoundary>
  );
}
