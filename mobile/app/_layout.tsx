import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useCategoryStore } from '../store/useCategoryStore';

export default function RootLayout() {
  const { fetchCategories } = useCategoryStore();

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
    </ErrorBoundary>
  );
}
