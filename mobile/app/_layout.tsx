import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, AppState, Modal, View, StyleSheet } from 'react-native';
import { AppUpdatePrompt } from '../components/shared/AppUpdatePrompt';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';
import { useCategoryStore } from '../store/useCategoryStore';
import { consumePendingWorkBlock, isLockAdminActive, isUsageAccessGranted, phoneUnlockListener } from '../services/phoneUnlockListener';
import { workPath } from '../utils/workBlock';
import { UnlockSetupPrompt } from '../components/phoneUnlock/UnlockSetupPrompt';
import { hasPhoneUnlockModule, isExpoGo } from '../utils/nativeModuleSupport';
import { API_CONFIG } from '../constants/apiConfig';
import { useLifeReminders } from '../hooks/useLifeReminders';
import { useFocusPresence } from '../hooks/useFocusPresence';
import { useOsWidgetSync } from '../hooks/useOsWidgetSync';
import { useOsDeepLinks } from '../hooks/useOsDeepLinks';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { usePushNotificationOpens } from '../hooks/usePushNotificationOpens';
import { useMorningGate } from '../hooks/useMorningGate';
import { useNightGate } from '../hooks/useNightGate';
import { bootstrapRoutines } from '../utils/routineBootstrap';

export default function RootLayout() {
  const { fetchCategories } = useCategoryStore();
  useLifeReminders();
  useFocusPresence();
  useOsWidgetSync();
  useOsDeepLinks();
  usePushRegistration();
  usePushNotificationOpens();
  const morningTakeover = useMorningGate();
  const nightTakeover = useNightGate();

  useEffect(() => {
    void bootstrapRoutines(true);
  }, []);
  const modeTakeover = morningTakeover || nightTakeover;
  const [showSetupPrompt, setShowSetupPrompt] = useState(false);
  const [setupPromptPaused, setSetupPromptPaused] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const openingWorkRef = useRef(false);
  const listenerSetupRef = useRef(false);

  useEffect(() => {
    try {
      if (typeof global !== 'undefined') {
        const globalAny = global as any;
        if (!globalAny.window) {
          globalAny.window = {};
        }
        if (typeof globalAny.window.addEventListener !== 'function') {
          globalAny.window.addEventListener = () => {};
        }
        if (typeof globalAny.window.removeEventListener !== 'function') {
          globalAny.window.removeEventListener = () => {};
        }
      }
    } catch {
      // Silently fail if polyfill can't be applied
    }

    fetchCategories();

    if (Platform.OS === 'android' && !isExpoGo && hasPhoneUnlockModule) {
      phoneUnlockListener.setApiUrl(API_CONFIG.baseURL);
      if (API_CONFIG.anchorApiKey) {
        phoneUnlockListener.setApiKey(API_CONFIG.anchorApiKey);
      }
      // Overlay permission is no longer required (intention popup removed).
      // Usage access still helps wallet Pay + first-app logging; lock admin is optional.
      Promise.all([isLockAdminActive(), isUsageAccessGranted()])
        .then(([lock, usage]) => {
          setShowSetupPrompt(!lock || !usage);
        })
        .catch(() => {
          setShowSetupPrompt(true);
        });
    }

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Unable to activate keep awake') || message.includes('keep awake')) {
        return;
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Unable to activate keep awake') || message.includes('keep awake')) {
        return;
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [fetchCategories]);

  // Keep native unlock listener / FGS alive; silent recording happens in Kotlin (no RN modal).
  useEffect(() => {
    if (listenerSetupRef.current) {
      return;
    }
    if (Platform.OS !== 'android' || isExpoGo || !hasPhoneUnlockModule) {
      return;
    }

    listenerSetupRef.current = true;
    const unsubscribe = phoneUnlockListener.startListening(() => {
      // Intention popup removed — native PhoneUnlockPresenter records silently.
    });
    unsubscribeRef.current = unsubscribe;

    return () => {
      if (__DEV__) {
        return;
      }
      listenerSetupRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      phoneUnlockListener.stopListening();
    };
  }, []);

  const openPendingWork = useCallback(async () => {
    if (openingWorkRef.current) {
      return;
    }
    try {
      const blockId = await consumePendingWorkBlock();
      if (!blockId) {
        return;
      }
      openingWorkRef.current = true;
      router.push(workPath(blockId));
      setTimeout(() => {
        openingWorkRef.current = false;
      }, 2000);
    } catch (error) {
      openingWorkRef.current = false;
      console.error('[RootLayout] Error opening pending work block:', error);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setTimeout(() => {
          void openPendingWork();
        }, 400);
        setSetupPromptPaused(false);
        Promise.all([isLockAdminActive(), isUsageAccessGranted()])
          .then(([lock, usage]) => {
            if (lock && usage) {
              setShowSetupPrompt(false);
            }
          })
          .catch(() => undefined);
      }
    });

    if (AppState.currentState === 'active') {
      setTimeout(() => {
        void openPendingWork();
      }, 800);
    }

    return () => {
      subscription.remove();
    };
  }, [openPendingWork]);

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
        <Stack.Screen name="check-in" />
        <Stack.Screen name="work" />
        <Stack.Screen
          name="morning"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="night"
          options={{
            presentation: 'fullScreenModal',
            animation: 'fade',
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      </Stack>
      <ErrorBoundary>
        {modeTakeover ? null : <AppUpdatePrompt />}
      </ErrorBoundary>
      <Modal
        visible={showSetupPrompt && !setupPromptPaused && !modeTakeover}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={styles.overlayPromptBackdrop}>
          <UnlockSetupPrompt
            onReady={() => setShowSetupPrompt(false)}
            onOpenExternal={() => {
              setSetupPromptPaused(true);
              setTimeout(() => {
                if (AppState.currentState === 'active') {
                  setSetupPromptPaused(false);
                }
              }, 1200);
            }}
          />
        </View>
      </Modal>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlayPromptBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 20, 25, 0.72)',
  },
});
