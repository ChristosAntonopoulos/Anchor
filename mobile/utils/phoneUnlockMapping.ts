export const PHONE_UNLOCK_SCHEMA_VERSION = 2;
export const PHONE_UNLOCK_NOTE_MAX_LENGTH = 200;

export const INTENTION_CODES = [
  'specific_task',
  'connection',
  'intentional_break',
  'social_check',
  'automatic_check',
  'spotify',
  'other',
] as const;

export const TRIGGER_CODES = [
  'notification',
  'task_cue',
  'boredom_waiting',
  'difficult_moment',
  'connection_need',
  'curiosity_updates',
  'habit_no_clear_cue',
  'other',
  'unsure',
] as const;

export const FEELING_CODES = [
  'calm',
  'bored',
  'stressed',
  'low',
  'lonely',
  'restless',
  'tired',
  'okay',
  'other',
  'unsure',
] as const;

export type IntentionCode = (typeof INTENTION_CODES)[number];
export type TriggerCode = (typeof TRIGGER_CODES)[number];
export type FeelingCode = (typeof FEELING_CODES)[number];
export type UnlockPromptStatus =
  | 'pending'
  | 'answered'
  | 'skipped'
  | 'dismissed'
  | 'interrupted';
export type UnlockPromptAction = 'continue' | 'put_down' | 'skip';
export type UnlockSubmissionPath = 'quick_choice' | 'context_form' | 'direct_action' | 'wallet_shortcut';
export type UnlockPutDownExecution = 'lock_requested' | 'overlay_dismissed' | 'failed';

export const PAUSE_INTENTION_CODES = ['social_check', 'automatic_check'] as const;
export const UNLOCK_PAUSE_SECONDS = 3;

export function needsUnlockPause(code?: string | null): boolean {
  return code === 'social_check' || code === 'automatic_check';
}

export type CurrentBlockItemView = {
  title: string;
  completed: boolean;
};

export function currentBlockItems(block?: {
  checklistItems?: Array<{ title?: string | null; completed?: boolean | null; order?: number | null }> | null;
  routineActivities?: Array<string | null> | null;
  items?: Array<{ title?: string | null; completed?: boolean | null } | string | null> | null;
} | null): CurrentBlockItemView[] {
  const checklist = (block?.checklistItems ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({
      title: item.title?.trim() ?? '',
      completed: Boolean(item.completed),
    }))
    .filter((item) => item.title.length > 0);
  if (checklist.length > 0) {
    return checklist;
  }
  const cached = (block?.items ?? [])
    .map((item) => {
      if (typeof item === 'string') {
        return { title: item.trim(), completed: false };
      }
      return {
        title: item?.title?.trim() ?? '',
        completed: Boolean(item?.completed),
      };
    })
    .filter((item) => item.title.length > 0);
  if (cached.length > 0) {
    return cached;
  }
  return (block?.routineActivities ?? [])
    .map((title) => ({ title: title?.trim() ?? '', completed: false }))
    .filter((item) => item.title.length > 0);
}

export function formatCurrentBlockLine(block?: {
  title?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  checklistItems?: Array<{ title?: string | null; completed?: boolean | null; order?: number | null }> | null;
  routineActivities?: Array<string | null> | null;
  items?: Array<{ title?: string | null; completed?: boolean | null } | string | null> | null;
} | null): { title: string; time: string | null; items: CurrentBlockItemView[] } | null {
  const title = block?.title?.trim();
  if (!title) {
    return null;
  }
  const start = block?.startTime?.trim() ?? '';
  const end = block?.endTime?.trim() ?? '';
  const time = start && end ? `${start} – ${end}` : start || end || null;
  return { title, time, items: currentBlockItems(block) };
}

export function formatUnlockedDuration(ms?: number | null): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 1000) {
    return null;
  }
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 && minutes < 10 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

export function summarizeUnlockEntries(
  entries: Array<{
    unlockedAt?: string | null;
    unlockedDurationMs?: number | null;
    intentionCode?: string | null;
  }>,
  now: Date = new Date(),
) {
  const todayKey = localDateKey(now);
  const todayEntries = entries.filter((entry) => localDateKey(entry.unlockedAt) === todayKey);
  const durations = entries
    .map((entry) => entry.unlockedDurationMs)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const todayDurations = todayEntries
    .map((entry) => entry.unlockedDurationMs)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.intentionCode) {
      continue;
    }
    counts.set(entry.intentionCode, (counts.get(entry.intentionCode) ?? 0) + 1);
  }
  let mostCommonIntention: string | null = null;
  let mostCommonCount = 0;
  counts.forEach((count, code) => {
    if (count > mostCommonCount) {
      mostCommonIntention = code;
      mostCommonCount = count;
    }
  });
  return {
    todayCount: todayEntries.length,
    totalCount: entries.length,
    averageDurationMs: durations.length === 0 ? null : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    todayDurationMs: todayDurations.length === 0 ? null : todayDurations.reduce((sum, value) => sum + value, 0),
    mostCommonIntention,
    mostCommonCount,
  };
}

function localDateKey(value?: string | Date | null): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const UNLOCK_COPY = {
  title: 'What brings you to your phone?',
  subtitle: 'Take a moment. Choose what fits.',
  putPhoneDown: 'Put phone down',
  now: 'Now',
  todayCount: (count: number) => (count === 1 ? `Today · ${count} unlock` : `Today · ${count} unlocks`),
  mostOften: (label: string) => `Most often · ${label}`,
  mostOftenBadge: 'Most often',
  pauseTitle: 'A short pause',
  pauseCancel: 'Tap here to choose something else',
  pauseSocial: (seconds: number) => `Social check in ${seconds}`,
  pauseAutomatic: (seconds: number) => `Automatic check in ${seconds}`,
  skip: 'Skip for now',
  addContext: 'Add context',
  addContextHelper: 'Optional',
  continue: 'Continue',
  contextHelper: 'Add anything useful. You can leave this blank.',
  triggerQuestion: 'What prompted you to pick it up?',
  feelingQuestion: 'How are you feeling right now?',
  selected: 'Selected',
  skipped: 'Skipped for now',
  dismissed: 'Dismissed',
  interrupted: 'Interrupted',
  noIntention: 'No intention reported',
  intentions: {
    specific_task: {
      label: 'Get something done',
      support: 'A task, information, or something practical',
    },
    connection: {
      label: 'Connect with someone',
      support: 'A message, call, or time with people',
    },
    intentional_break: {
      label: 'Enjoy a break',
      support: 'Entertainment, browsing, or relaxing',
    },
    social_check: {
      label: 'Social check',
      support: 'Feeds, stories, or seeing what others posted',
    },
    pay: {
      label: 'Pay',
      support: 'A purchase, transfer, or bill',
    },
    automatic_check: {
      label: 'Automatic check',
      support: 'I reached for it without deciding to',
    },
    spotify: {
      label: 'Spotify',
      support: 'Music, a podcast, or something playing',
    },
    other: {
      label: 'Something else',
      support: 'A different reason',
    },
  },
  triggers: {
    notification: 'A notification',
    task_cue: 'Something I needed to do',
    boredom_waiting: 'Boredom / waiting',
    difficult_moment: 'Something felt difficult',
    connection_need: 'Wanted connection',
    curiosity_updates: 'Curiosity / checking updates',
    habit_no_clear_cue: 'Habit / nothing noticeable',
    other: 'Something else',
    unsure: 'Not sure',
  },
  feelings: {
    calm: 'Calm',
    bored: 'Bored',
    stressed: 'Stressed',
    low: 'Low',
    lonely: 'Lonely',
    restless: 'Restless',
    tired: 'Tired',
    okay: 'Okay',
    other: 'Something else',
    unsure: 'Not sure',
  },
  notes: {
    specific_task: {
      label: 'What’s the one thing?',
      placeholder: 'e.g. Pay the electricity bill',
    },
    connection: {
      label: 'Anything you want to remember?',
      placeholder: 'e.g. Reply to a friend',
    },
    intentional_break: {
      label: 'What would you like to do?',
      placeholder: 'e.g. Listen to music for a while',
    },
    social_check: {
      label: 'Anything you noticed?',
      placeholder: 'e.g. I opened Instagram after a notification',
    },
    pay: {
      label: 'What’s the payment?',
      placeholder: 'e.g. Pay the electricity bill',
    },
    automatic_check: {
      label: 'Anything you noticed?',
      placeholder: 'e.g. I picked it up while my code was building',
    },
    spotify: {
      label: 'What do you want to play?',
      placeholder: 'e.g. A focus playlist',
    },
    other: {
      label: 'What brought you here?',
      placeholder: 'Optional',
    },
    none: {
      label: 'Anything you want to remember?',
      placeholder: 'Optional',
    },
  },
} as const;

export function sanitizeUnlockNote(note: string | null | undefined): string | null {
  const trimmed = note?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, PHONE_UNLOCK_NOTE_MAX_LENGTH);
}

export function fieldsForUnlockChoice(input: {
  skip: boolean;
  keepContext: boolean;
  contextExpanded: boolean;
  intention: string | null;
  trigger: string | null;
  feeling: string | null;
  note: string | null;
  action: UnlockPromptAction | null;
  status: UnlockPromptStatus;
  path: UnlockSubmissionPath | null;
  putDownExecution: UnlockPutDownExecution | null;
}) {
  const discardDetails =
    input.skip || input.status === 'dismissed' || input.status === 'interrupted';
  return {
    status: input.status,
    action: input.action,
    intentionCode: discardDetails ? null : input.intention,
    triggerCode: discardDetails || !input.keepContext ? null : input.trigger,
    feelingCode: discardDetails || !input.keepContext ? null : input.feeling,
    note: discardDetails || !input.keepContext ? null : sanitizeUnlockNote(input.note),
    contextExpanded: input.contextExpanded,
    submissionPath: input.path,
    putDownExecution: input.putDownExecution,
  };
}

export function noteCopyForIntention(intention: string | null | undefined) {
  if (intention && intention in UNLOCK_COPY.notes) {
    return UNLOCK_COPY.notes[intention as IntentionCode];
  }
  return UNLOCK_COPY.notes.none;
}

export function intentionLabel(code?: string | null): string | null {
  if (!code || !(code in UNLOCK_COPY.intentions)) {
    return null;
  }
  return UNLOCK_COPY.intentions[code as keyof typeof UNLOCK_COPY.intentions].label;
}

export function displayUnlockHeadline(entry: {
  intentionCode?: string | null;
  status?: string | null;
  action?: string | null;
}): string {
  const label = intentionLabel(entry.intentionCode);
  if (label) {
    return label;
  }
  if (entry.intentionCode) {
    return entry.intentionCode;
  }
  if (entry.status === 'skipped') {
    return UNLOCK_COPY.skipped;
  }
  if (entry.action === 'put_down') {
    return UNLOCK_COPY.putPhoneDown;
  }
  if (entry.status === 'dismissed') {
    return UNLOCK_COPY.dismissed;
  }
  if (entry.status === 'interrupted') {
    return UNLOCK_COPY.interrupted;
  }
  return UNLOCK_COPY.noIntention;
}
