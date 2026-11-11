import { Platform } from 'react-native';
import type { Task, ScheduleBlock } from '../types';
import type { TodayMealCard } from '../types/meals';
import type { WorkSession } from '../types/execution';
import { FOCUS_PREFIX, buildFocusCues, focusPlanFingerprint, focusWindows } from './focusPresence';

type NotifMod = {
  setNotificationHandler: (handler: unknown) => void;
  setNotificationChannelAsync?: (id: string, channel: unknown) => Promise<unknown>;
  scheduleNotificationAsync: (req: unknown) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<unknown>;
  getAllScheduledNotificationsAsync?: () => Promise<Array<{ identifier?: string }>>;
  requestPermissionsAsync: () => Promise<{ granted?: boolean; status?: string }>;
  AndroidImportance?: { HIGH: number; DEFAULT: number; LOW: number };
  SchedulableTriggerInputTypes?: { DATE: string; TIME_INTERVAL: string };
};

const PREFIX = 'os:';
const FOCUS_CHIME = 'focus_chime';
let notif: NotifMod | null | undefined;
let ready = false;
let lastFocusFingerprint = '';

function loadNotif(): NotifMod | null {
  if (notif !== undefined) return notif;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notif = require('expo-notifications') as NotifMod;
  } catch {
    notif = null;
  }
  return notif;
}

export async function ensureOsNotifications(): Promise<NotifMod | null> {
  const mod = loadNotif();
  if (!mod || ready) return mod;
  try {
    mod.setNotificationHandler({
      handleNotification: async (notification: { request?: { content?: { data?: { kind?: string } } } }) => {
        const silent = notification?.request?.content?.data?.kind === 'focus-pulse';
        return {
          shouldShowAlert: !silent,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: !silent,
          shouldShowList: !silent,
        };
      },
    });
    if (Platform.OS === 'android' && mod.setNotificationChannelAsync) {
      const importance = mod.AndroidImportance?.HIGH ?? 4;
      const low = mod.AndroidImportance?.LOW ?? 2;
      await Promise.all([
        mod.setNotificationChannelAsync('cooking', {
          name: 'Cooking timers',
          importance,
          sound: 'default',
          vibrationPattern: [0, 400, 200, 400],
          enableVibrate: true,
        }),
        mod.setNotificationChannelAsync('os-tasks', {
          name: 'Tasks',
          importance,
          sound: 'default',
        }),
        mod.setNotificationChannelAsync('os-meals', {
          name: 'Meals',
          importance,
          sound: 'default',
        }),
        mod.setNotificationChannelAsync('os-review', {
          name: 'Weekly review',
          importance,
          sound: 'default',
        }),
        mod.setNotificationChannelAsync('os-focus-start', {
          name: 'Focus block start',
          importance,
          sound: FOCUS_CHIME,
          enableVibrate: false,
        }),
        mod.setNotificationChannelAsync('os-focus-pulse', {
          name: 'Focus presence',
          importance: low,
          sound: FOCUS_CHIME,
          enableVibrate: false,
        }),
      ]);
    }
    await mod.requestPermissionsAsync();
    ready = true;
  } catch {
    return mod;
  }
  return mod;
}

const MEAL_AT: Record<string, [number, number]> = {
  Breakfast: [7, 45],
  Lunch: [12, 15],
  Dinner: [18, 30],
  Snack: [16, 0],
};

function atLocal(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month, day, hour, minute, 0, 0);
}

function nextSundayEighteen(): Date {
  const now = new Date();
  const next = atLocal(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
  const daysUntilSunday = (7 - next.getDay()) % 7;
  if (daysUntilSunday > 0) {
    next.setDate(next.getDate() + daysUntilSunday);
  } else if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 7);
  }
  return next;
}

function dueReminder(dueDate: string): Date | null {
  const hasTime = dueDate.includes('T');
  const due = new Date(hasTime ? dueDate : `${dueDate}T09:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  if (hasTime) {
    due.setHours(due.getHours() - 1);
  }
  if (due.getTime() <= Date.now()) return null;
  return due;
}

async function cancelPrefix(mod: NotifMod, prefix: string): Promise<void> {
  if (!mod.getAllScheduledNotificationsAsync) return;
  try {
    const pending = await mod.getAllScheduledNotificationsAsync();
    await Promise.all(
      pending
        .filter((item) => item.identifier?.startsWith(prefix))
        .map((item) => mod.cancelScheduledNotificationAsync(item.identifier as string))
    );
  } catch {
    // ignore
  }
}

async function schedule(
  mod: NotifMod,
  id: string,
  when: Date,
  title: string,
  body: string,
  channelId: string,
  url: string
): Promise<void> {
  if (when.getTime() <= Date.now() + 15_000) return;
  const type = mod.SchedulableTriggerInputTypes?.DATE;
  const trigger = type
    ? { type, date: when, channelId }
    : { date: when, channelId };
  try {
    await mod.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, sound: true, data: { url } },
      trigger,
    });
  } catch {
    // emulator / denied
  }
}

export async function syncLifeReminders(input: {
  tasks: Task[];
  todayCard: TodayMealCard | null;
  weeklyCompleted: boolean;
}): Promise<void> {
  const mod = await ensureOsNotifications();
  if (!mod) return;
  await cancelPrefix(mod, `${PREFIX}task:`);
  await cancelPrefix(mod, `${PREFIX}meal:`);
  await cancelPrefix(mod, `${PREFIX}review`);

  for (const task of input.tasks) {
    if (task.completed || task.status === 'done' || task.status === 'archived') continue;
    const custom = (task.reminders ?? [])
      .filter((item) => !item.triggered)
      .map((item) => new Date(item.reminderTime))
      .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() > Date.now());
    const when = custom[0] ?? (task.dueDate ? dueReminder(task.dueDate) : null);
    if (!when) continue;
    await schedule(
      mod,
      `${PREFIX}task:${task.id}`,
      when,
      task.title,
      'Time to move this.',
      'os-tasks',
      'pos://os/tasks'
    );
  }

  const nextMeal = input.todayCard?.nextMeal;
  if (nextMeal && nextMeal.state === 'Planned') {
    const [hour, minute] = MEAL_AT[nextMeal.slot] ?? [12, 0];
    const now = new Date();
    const when = atLocal(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    when.setMinutes(when.getMinutes() - 15);
    if (when.getTime() > Date.now()) {
      await schedule(
        mod,
        `${PREFIX}meal:${nextMeal.id}`,
        when,
        nextMeal.recipeName || nextMeal.slot,
        `${nextMeal.slot} is in 15 minutes.`,
        'os-meals',
        'pos://os/meals'
      );
    }
  }

  if (!input.weeklyCompleted) {
    await schedule(
      mod,
      `${PREFIX}review`,
      nextSundayEighteen(),
      'Weekly review',
      'Look back on the week. Four short answers.',
      'os-review',
      'pos://os/review'
    );
  }
}

async function scheduleFocusCue(
  mod: NotifMod,
  identifier: string,
  when: Date,
  title: string,
  body: string,
  kind: 'start' | 'pulse',
  url: string
): Promise<void> {
  if (when.getTime() <= Date.now() + 1_000) return;
  const channelId = kind === 'start' ? 'os-focus-start' : 'os-focus-pulse';
  const type = mod.SchedulableTriggerInputTypes?.DATE;
  const trigger = type ? { type, date: when, channelId } : { date: when, channelId };
  try {
    await mod.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: FOCUS_CHIME,
        data: { url, kind: kind === 'pulse' ? 'focus-pulse' : 'focus-start' },
      },
      trigger,
    });
  } catch {
    // emulator / denied
  }
}

export async function announceFocusStart(title: string, body?: string): Promise<void> {
  const mod = await ensureOsNotifications();
  if (!mod) return;
  const interval = mod.SchedulableTriggerInputTypes?.TIME_INTERVAL;
  const trigger = interval
    ? { type: interval, seconds: 1, repeats: false, channelId: 'os-focus-start' }
    : { seconds: 1, repeats: false, channelId: 'os-focus-start' };
  try {
    await mod.scheduleNotificationAsync({
      identifier: `${FOCUS_PREFIX}live:${Date.now()}`,
      content: {
        title: title || 'Task started',
        body: body || 'This block is underway.',
        sound: FOCUS_CHIME,
        data: { url: 'pos://os/now', kind: 'focus-start' },
      },
      trigger,
    });
  } catch {
    // emulator / denied
  }
}

export async function syncFocusPresence(input: {
  blocks: ScheduleBlock[];
  session: WorkSession | null;
  nowMs?: number;
}): Promise<void> {
  const mod = await ensureOsNotifications();
  if (!mod) return;
  const nowMs = input.nowMs ?? Date.now();
  const cues = buildFocusCues(focusWindows(input.blocks, input.session, nowMs), nowMs);
  const fingerprint = focusPlanFingerprint(cues);
  if (fingerprint === lastFocusFingerprint) return;
  lastFocusFingerprint = fingerprint;
  await cancelPrefix(mod, FOCUS_PREFIX);
  for (const cue of cues) {
    await scheduleFocusCue(mod, cue.identifier, new Date(cue.atMs), cue.title, cue.body, cue.kind, cue.url);
  }
}
