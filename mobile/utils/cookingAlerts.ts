import { Platform, Vibration } from 'react-native';
import { ensureOsNotifications } from './osNotifications';

type NotifMod = {
  setNotificationHandler: (handler: unknown) => void;
  setNotificationChannelAsync?: (id: string, channel: unknown) => Promise<unknown>;
  scheduleNotificationAsync: (req: unknown) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<unknown>;
  requestPermissionsAsync: () => Promise<{ granted?: boolean; status?: string }>;
  AndroidImportance?: { HIGH: number };
  SchedulableTriggerInputTypes?: { TIME_INTERVAL: string };
};

let notif: NotifMod | null | undefined;
let handlerReady = false;

function loadNotif(): NotifMod | null {
  if (notif !== undefined) return notif;
  try {
    // Optional: present after EAS rebuild. Vibration always works.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // @ts-expect-error expo-notifications is optional until the next native build
    notif = require('expo-notifications') as NotifMod;
  } catch {
    notif = null;
  }
  return notif;
}

async function ensureHandler(): Promise<NotifMod | null> {
  handlerReady = true;
  return (await ensureOsNotifications()) as NotifMod | null;
}

export async function scheduleTimerNotification(
  title: string,
  body: string,
  seconds: number
): Promise<string | null> {
  const mod = await ensureHandler();
  if (!mod || seconds < 1) return null;
  try {
    const triggerType = mod.SchedulableTriggerInputTypes?.TIME_INTERVAL;
    const trigger = triggerType
      ? { type: triggerType, seconds, repeats: false, channelId: 'cooking-priority' }
      : { seconds, repeats: false, channelId: 'cooking-priority' };
    return await mod.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger,
    });
  } catch {
    return null;
  }
}

export async function cancelTimerNotification(id: string | null | undefined): Promise<void> {
  if (!id) return;
  const mod = loadNotif();
  if (!mod) return;
  try {
    await mod.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired
  }
}

export function playTimerDoneAlert(): void {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 500, 180, 500, 180, 800]);
    }
  } catch {
    // emulator without vibe
  }
}
