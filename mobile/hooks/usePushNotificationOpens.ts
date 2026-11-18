import { useEffect } from 'react';
import { deepLinkFromNotificationData, openOsUrl } from '../utils/osDeepLinks';

type NotifResponse = {
  notification?: { request?: { content?: { data?: Record<string, unknown> } } };
};

type NotifMod = {
  addNotificationResponseReceivedListener: (
    listener: (response: NotifResponse) => void
  ) => { remove: () => void };
  getLastNotificationResponseAsync?: () => Promise<NotifResponse | null>;
  clearLastNotificationResponseAsync?: () => Promise<void>;
};

/** Avoid re-opening the same cold-start tap across remounts. */
let consumedResponseKey: string | null = null;

function responseKey(response: NotifResponse | null | undefined): string | null {
  const data = response?.notification?.request?.content?.data;
  const link = deepLinkFromNotificationData(data);
  if (!link) return null;
  const id = data?.notificationId;
  return typeof id === 'string' && id.length > 0 ? `${id}:${link}` : link;
}

function openFromResponse(response: NotifResponse | null | undefined, clear?: () => void) {
  const key = responseKey(response);
  if (!key || key === consumedResponseKey) return;
  const link = deepLinkFromNotificationData(response?.notification?.request?.content?.data);
  if (!link) return;
  consumedResponseKey = key;
  openOsUrl(link);
  clear?.();
}

/**
 * Opens deep links when the user taps an assistant / OS push.
 * Routes once via openOsUrl (no Linking.openURL bounce) and clears the sticky
 * last-response so remounts / relaunches do not re-navigate.
 */
export function usePushNotificationOpens() {
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('expo-notifications') as NotifMod;
      const clear = () => {
        void mod.clearLastNotificationResponseAsync?.().catch(() => undefined);
      };
      sub = mod.addNotificationResponseReceivedListener((response) => {
        openFromResponse(response, clear);
      });
      void mod.getLastNotificationResponseAsync?.().then((last) => {
        openFromResponse(last, clear);
      });
    } catch {
      // expo-notifications unavailable
    }
    return () => {
      sub?.remove();
    };
  }, []);
}
