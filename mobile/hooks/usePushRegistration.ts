import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '../services/api';
import { ensureOsNotifications } from '../utils/osNotifications';

/** EAS project for @botsyst3m/pos-mobile — must match app.json extra.eas.projectId */
const FALLBACK_EAS_PROJECT_ID = '6ffa3cc9-ec45-4359-849a-ea2bc3742d44';

type ExpoNotifications = {
  getExpoPushTokenAsync: (opts?: { projectId?: string }) => Promise<{ data?: string }>;
  getPermissionsAsync?: () => Promise<{ granted?: boolean; status?: string; canAskAgain?: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted?: boolean; status?: string }>;
  setNotificationChannelAsync?: (id: string, channel: Record<string, unknown>) => Promise<unknown>;
  AndroidImportance?: { HIGH: number; DEFAULT?: number; MAX?: number };
};

function resolveProjectId(): string {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return (
    extra?.eas?.projectId?.trim() ||
    Constants.easConfig?.projectId?.trim() ||
    FALLBACK_EAS_PROJECT_ID
  );
}

function log(...args: unknown[]) {
  console.warn('[push]', ...args);
}

async function ensurePermission(mod: ExpoNotifications): Promise<boolean> {
  try {
    const current = (await mod.getPermissionsAsync?.()) ?? (await mod.requestPermissionsAsync());
    if (current?.granted || current?.status === 'granted') {
      return true;
    }
    const asked = await mod.requestPermissionsAsync();
    return !!(asked?.granted || asked?.status === 'granted');
  } catch (error) {
    log('permission request failed', error);
    return false;
  }
}

async function ensureAssistantChannel(mod: ExpoNotifications): Promise<void> {
  if (Platform.OS !== 'android' || !mod.setNotificationChannelAsync) return;
  try {
    // Calm DEFAULT channel — respects lock mute; no HIGH heads-up / bypassDnd.
    // ensureOsNotifications also creates this and deletes the old priority id.
    await mod.setNotificationChannelAsync('os-assistant', {
      name: 'Assistant',
      importance: mod.AndroidImportance?.DEFAULT ?? mod.AndroidImportance?.HIGH ?? 3,
      bypassDnd: false,
      lockscreenVisibility: 1,
      sound: 'default',
      enableVibrate: false,
      showBadge: true,
    });
  } catch (error) {
    log('assistant channel setup failed', error);
  }
}

/**
 * Obtains an Expo push token (requires FCM / google-services in the release APK on Android)
 * and POSTs it to /api/devices/push-token for default-user-id on startup and when it changes.
 * Works without X-Anchor-Key when AnchorApi:RequireKey is false.
 */
export function usePushRegistration() {
  const inFlight = useRef(false);
  const lastPosted = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const register = async (reason: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        log('registration start', reason);
        await ensureOsNotifications();

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('expo-notifications') as ExpoNotifications;
        const permitted = await ensurePermission(mod);
        if (!permitted) {
          log('notification permission not granted — skipping token fetch');
          return;
        }
        await ensureAssistantChannel(mod);

        const projectId = resolveProjectId();
        log('fetching Expo push token', { projectId, platform: Platform.OS });

        let token: string | undefined;
        try {
          const tokenResult = await mod.getExpoPushTokenAsync({ projectId });
          token = tokenResult?.data?.trim();
        } catch (error) {
          log(
            'getExpoPushTokenAsync failed — Android needs google-services.json + Google Services plugin in the APK, and Expo needs FCM V1 credentials',
            error
          );
          return;
        }

        if (!token) {
          log('empty Expo push token');
          return;
        }

        if (lastPosted.current === token) {
          log('token unchanged since last successful POST');
          return;
        }

        log('POST /api/devices/push-token', {
          platform: Platform.OS,
          expoProjectId: projectId,
          tokenPrefix: token.slice(0, 18),
          tokenLen: token.length,
        });

        await apiClient.registerPushToken({
          token,
          platform: Platform.OS,
          expoProjectId: projectId,
        });

        lastPosted.current = token;
        log('registration ok');
      } catch (error) {
        log('registration failed', error);
      } finally {
        inFlight.current = false;
      }
    };

    void register('mount');

    // Retry after launch (permission dialog / FCM cold start) and when app returns to foreground.
    const retryTimer = setTimeout(() => {
      void register('retry-2s');
    }, 2000);
    const retryTimer2 = setTimeout(() => {
      void register('retry-12s');
    }, 12_000);

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        void register('app-active');
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearTimeout(retryTimer);
      clearTimeout(retryTimer2);
      sub.remove();
    };
  }, []);
}
