import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from '../services/api';
import { ensureOsNotifications } from '../utils/osNotifications';

type ExpoNotifications = {
  getExpoPushTokenAsync: (opts?: { projectId?: string }) => Promise<{ data?: string }>;
};

function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/**
 * Registers the Expo push token with the backend once per app session.
 * Chris must open the new APK once so this runs.
 */
export function usePushRegistration() {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (Platform.OS === 'web') return;
    attempted.current = true;

    void (async () => {
      try {
        await ensureOsNotifications();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('expo-notifications') as ExpoNotifications;
        const pid = projectId();
        const tokenResult = await mod.getExpoPushTokenAsync(pid ? { projectId: pid } : undefined);
        const token = tokenResult?.data?.trim();
        if (!token) return;
        await apiClient.registerPushToken({
          token,
          platform: Platform.OS,
          expoProjectId: pid,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('[push] registration skipped', error);
        }
      }
    })();
  }, []);
}
