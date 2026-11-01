export const PHONE_UNLOCK_SCHEMA_VERSION = 2;
export const PHONE_UNLOCK_NOTE_MAX_LENGTH = 200;

export const INTENTION_CODES = [
  'specific_task',
  'connection',
  'intentional_break',
  'social_check',
  'pay',
  'automatic_check',
  'unsure',
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
export type UnlockSubmissionPath = 'quick_choice' | 'context_form' | 'direct_action';
export type UnlockPutDownExecution = 'lock_requested' | 'overlay_dismissed' | 'failed';

export const UNLOCK_COPY = {
  title: 'What brings you to your phone?',
  subtitle: 'Take a moment. Choose what fits.',
  putPhoneDown: 'Put phone down',
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
    unsure: {
      label: 'Not sure yet',
      support: 'I haven’t decided what I need',
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
    unsure: {
      label: 'Anything on your mind?',
      placeholder: 'Optional',
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

export function displayUnlockHeadline(entry: {
  intentionCode?: string | null;
  status?: string | null;
  action?: string | null;
}): string {
  if (entry.intentionCode && entry.intentionCode in UNLOCK_COPY.intentions) {
    return UNLOCK_COPY.intentions[entry.intentionCode as IntentionCode].label;
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
