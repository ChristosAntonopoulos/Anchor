import { useEffect } from 'react';
import { Linking } from 'react-native';

type NotifMod = {
  addNotificationResponseReceivedListener: (
    listener: (response: { notification?: { request?: { content?: { data?: Record<string, unknown> } } } }) => void
  ) => { remove: () => void };
  getLastNotificationResponseAsync?: () => Promise<{
    notification?: { request?: { content?: { data?: Record<string, unknown> } } };
  } | null>;
};

function openFromData(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const url = (data.url ?? data.deepLink) as string | undefined;
  if (url && typeof url === 'string' && url.startsWith('pos:')) {
    void Linking.openURL(url);
  }
}

/**
 * Opens deep links when the user taps an assistant / OS push.
 */
export function usePushNotificationOpens() {
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-notifications') as NotifMod;
      sub = mod.addNotificationResponseReceivedListener((response) => {
        openFromData(response.notification?.request?.content?.data);
      });
      void mod.getLastNotificationResponseAsync?.().then((last) => {
        openFromData(last?.notification?.request?.content?.data);
      });
    } catch {
      // expo-notifications unavailable
    }
    return () => {
      sub?.remove();
    };
  }, []);
}
