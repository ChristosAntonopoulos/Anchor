export const MORNING_TOTAL_SECONDS = 1800;
export const MORNING_TRIGGER_HOUR = 7;
export const MORNING_TRIGGER_MINUTE = 0;

export type MorningStatus =
  | 'NOT_DUE'
  | 'WAITING_FOR_FIRST_UNLOCK'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ENDED_EARLY';

export type MorningStepId = 'wake' | 'move' | 'clean' | 'meditate' | 'task';

export type MorningEvent =
  | { type: 'unlock'; fromUserPresent: boolean }
  | { type: 'tick' }
  | { type: 'ready' }
  | { type: 'skip' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'help' }
  | { type: 'easier' }
  | { type: 'extend'; seconds?: number }
  | { type: 'endEarly' }
  | { type: 'confirmEnd' }
  | { type: 'cancelEnd' }
  | { type: 'nextMicro' }
  | { type: 'otherTask' }
  | { type: 'toggleBreathing' }
  | { type: 'civilRollover' }
  | { type: 'setFirstTask'; task: MorningFirstTask }
  | { type: 'setCleaning'; cleaning: MorningSubstep[] }
  | { type: 'quietAlternative' };

export interface MorningSubstep {
  id: string;
  seconds: number;
  command: string;
  seated?: string;
}

export interface MorningFirstTask {
  taskId: string | null;
  taskTitle: string;
  reason: string;
  firstPhysicalAction: string;
  nextMicroActions: string[];
  easierAlternative: string;
}

export interface MorningSession {
  id: string;
  localDate: string;
  timezone: string;
  status: MorningStatus;
  firstEligibleUnlockAt: string | null;
  activationAt: string | null;
  currentStep: MorningStepId;
  currentSubstep: number;
  stepElapsedSeconds: number;
  sessionElapsedSeconds: number;
  pauseAccumulatedSeconds: number;
  stepAnchorMs: number;
  sessionAnchorMs: number;
  stepElapsedAtAnchor: number;
  sessionElapsedAtAnchor: number;
  completedSteps: MorningStepId[];
  skippedSteps: MorningStepId[];
  seatedMovement: boolean;
  breathingEnabled: boolean;
  taskMicroIndex: number;
  selectedFirstTask: MorningFirstTask | null;
  helpText: string | null;
  endedReason: string | null;
  confirmEnd: boolean;
  pinEnabled: boolean;
  cleaning: MorningSubstep[];
  meditationActualSeconds: number | null;
  chimePlayed: boolean;
  lastSpokenKey: string | null;
  updatedAt: string;
}

export const MOVE_SUBSTEPS: MorningSubstep[] = [
  { id: 'march', seconds: 60, command: 'Περπάτα επιτόπου.', seated: 'Κούνα τα πόδια καθιστός.' },
  { id: 'shoulders', seconds: 60, command: 'Χαλάρωσε τους ώμους.', seated: 'Χαλάρωσε τους ώμους καθιστός.' },
  { id: 'stands', seconds: 60, command: 'Κάνε λίγα καθίσματα.', seated: 'Σήκω και κάτσε με στήριγμα.' },
  { id: 'stretch', seconds: 60, command: 'Τεντώσου απαλά.', seated: 'Τεντώσου απαλά καθιστός.' },
];

export const DEFAULT_CLEANING: MorningSubstep[] = [
  { id: 'bed', seconds: 120, command: 'Στρώσε το κρεβάτι.' },
  { id: 'clothes', seconds: 180, command: 'Μάζεψε τα πράγματα.' },
  { id: 'desk', seconds: 180, command: 'Καθάρισε λίγο το γραφείο.' },
];

export const STEP_SECONDS: Record<MorningStepId, number> = {
  wake: 60,
  move: 240,
  clean: 480,
  meditate: 780,
  task: 240,
};

export const STEP_ORDER: MorningStepId[] = ['wake', 'move', 'clean', 'meditate', 'task'];

export const COPY = {
  title: 'MORNING MODE',
  wake: 'Σήκω. Πάμε να ξεκινήσουμε.',
  wakeSub: 'Άνοιξε τις κουρτίνες και πιες λίγο νερό αν θέλεις.',
  ready: 'Έτοιμος',
  done: 'Έτοιμο',
  pause: 'Παύση',
  resume: 'Συνέχεια',
  skip: 'Παράλειψη',
  help: 'Βοήθεια',
  easier: 'Πιο εύκολο',
  other: 'Άλλο',
  extend: 'Ένα λεπτό ακόμα',
  next: 'Επόμενο',
  end: 'End Morning Mode',
  endConfirm: 'Τέλος για σήμερα;',
  endYes: 'Ναι, τέλος',
  endNo: 'Συνέχεια',
  meditationTitle: 'Διαλογισμός',
  meditationGuide:
    'Κάθισε αναπαυτικά. Παρατήρησε την αναπνοή σου. Όταν φεύγει το μυαλό σου, γύρνα απαλά πίσω.',
  meditationStopped: 'Σταμάτησες νωρίτερα. Κάθισε ήσυχα ένα λεπτό, ή πήγαινε στο πρώτο έργο.',
  sitQuietly: 'Κάθισε ήσυχα',
  goToTask: 'Πρώτο έργο',
  hideBreath: 'Χωρίς κίνηση',
  showBreath: 'Αναπνοή',
  fallbackTaskTitle: 'Πρώτο έργο της ημέρας',
  fallbackFirstAction: 'Άνοιξε το Cursor.',
  fallbackNext: 'Άνοιξε το project.',
  fallbackChoose: 'Διάλεξε το πρώτο μικρό πράγμα που θα κάνεις.',
  fallbackEasier: 'Άνοιξε μόνο το Cursor. Τίποτα άλλο.',
  fallbackReason: 'Ξεκίνα με κάτι μικρό που ήδη ξέρεις.',
  noTask: 'Δεν υπάρχει αποθηκευμένο έργο. Άνοιξε το Cursor και διάλεξε ένα μικρό βήμα.',
  helpWake: 'Άνοιξε τις κουρτίνες. Ένα ποτήρι νερό είναι αρκετό.',
  helpMove: 'Κάνε μόνο ό,τι είναι άνετο. Κάθισε αν χρειάζεται.',
  helpClean: 'Βάλε μόνο ένα πράγμα στη θέση του.',
  helpMeditate: 'Δεν χρειάζεται να κάνεις κάτι σωστά. Κάθισε.',
  helpTask: 'Κάνε μόνο την πρώτη φυσική κίνηση. Όχι σχέδιο.',
} as const;

export function localDateKey(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function timezoneName(now = new Date()): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isAtOrAfterTrigger(now: Date): boolean {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= MORNING_TRIGGER_HOUR * 60 + MORNING_TRIGGER_MINUTE;
}

export function sessionIdFor(localDate: string): string {
  return `morning-${localDate}`;
}

export function emptyWaiting(now: Date): MorningSession {
  const localDate = localDateKey(now);
  return baseSession(now, localDate, isAtOrAfterTrigger(now) ? 'WAITING_FOR_FIRST_UNLOCK' : 'NOT_DUE');
}

function baseSession(now: Date, localDate: string, status: MorningStatus): MorningSession {
  return {
    id: sessionIdFor(localDate),
    localDate,
    timezone: timezoneName(now),
    status,
    firstEligibleUnlockAt: null,
    activationAt: null,
    currentStep: 'wake',
    currentSubstep: 0,
    stepElapsedSeconds: 0,
    sessionElapsedSeconds: 0,
    pauseAccumulatedSeconds: 0,
    stepAnchorMs: now.getTime(),
    sessionAnchorMs: now.getTime(),
    stepElapsedAtAnchor: 0,
    sessionElapsedAtAnchor: 0,
    completedSteps: [],
    skippedSteps: [],
    seatedMovement: false,
    breathingEnabled: true,
    taskMicroIndex: 0,
    selectedFirstTask: null,
    helpText: null,
    endedReason: null,
    confirmEnd: false,
    pinEnabled: false,
    cleaning: DEFAULT_CLEANING.map((item) => ({ ...item })),
    meditationActualSeconds: null,
    chimePlayed: false,
    lastSpokenKey: null,
    updatedAt: now.toISOString(),
  };
}

export function fallbackFirstTask(task?: { id?: string | null; title?: string | null } | null): MorningFirstTask {
  const title = task?.title?.trim();
  if (!title) {
    return {
      taskId: null,
      taskTitle: COPY.fallbackTaskTitle,
      reason: COPY.fallbackReason,
      firstPhysicalAction: COPY.fallbackFirstAction,
      nextMicroActions: [COPY.fallbackNext, COPY.fallbackChoose],
      easierAlternative: COPY.fallbackEasier,
    };
  }
  return {
    taskId: task?.id ?? null,
    taskTitle: title,
    reason: COPY.fallbackReason,
    firstPhysicalAction: COPY.fallbackFirstAction,
    nextMicroActions: [COPY.fallbackNext, COPY.fallbackChoose],
    easierAlternative: COPY.fallbackEasier,
  };
}

function stamp(session: MorningSession, now: Date, patch: Partial<MorningSession>): MorningSession {
  return { ...session, ...patch, updatedAt: now.toISOString() };
}

function elapsedNow(session: MorningSession, now: Date): { step: number; sessionElapsed: number } {
  if (session.status !== 'ACTIVE') {
    return { step: session.stepElapsedSeconds, sessionElapsed: session.sessionElapsedSeconds };
  }
  const extra = Math.max(0, Math.floor((now.getTime() - session.stepAnchorMs) / 1000));
  const sessionExtra = Math.max(0, Math.floor((now.getTime() - session.sessionAnchorMs) / 1000));
  return {
    step: session.stepElapsedAtAnchor + extra,
    sessionElapsed: session.sessionElapsedAtAnchor + sessionExtra,
  };
}

function substepsOf(session: MorningSession, step: MorningStepId): MorningSubstep[] {
  if (step === 'move') return MOVE_SUBSTEPS;
  if (step === 'clean') return session.cleaning;
  return [];
}

function plannedSeconds(session: MorningSession, step: MorningStepId, substep: number): number {
  const subs = substepsOf(session, step);
  if (subs.length > 0) return subs[Math.min(substep, subs.length - 1)]?.seconds ?? STEP_SECONDS[step];
  return STEP_SECONDS[step];
}

function anchor(session: MorningSession, now: Date, stepElapsed: number, sessionElapsed: number): Partial<MorningSession> {
  return {
    stepElapsedSeconds: stepElapsed,
    sessionElapsedSeconds: sessionElapsed,
    stepElapsedAtAnchor: stepElapsed,
    sessionElapsedAtAnchor: sessionElapsed,
    stepAnchorMs: now.getTime(),
    sessionAnchorMs: now.getTime(),
  };
}

function activate(session: MorningSession, now: Date): MorningSession {
  return stamp(session, now, {
    status: 'ACTIVE',
    firstEligibleUnlockAt: session.firstEligibleUnlockAt ?? now.toISOString(),
    activationAt: session.activationAt ?? now.toISOString(),
    currentStep: session.activationAt ? session.currentStep : 'wake',
    ...anchor(session, now, session.activationAt ? session.stepElapsedSeconds : 0, session.activationAt ? session.sessionElapsedSeconds : 0),
    helpText: null,
    confirmEnd: false,
  });
}

function finishDay(session: MorningSession, now: Date, status: 'COMPLETED' | 'ENDED_EARLY', reason?: string): MorningSession {
  const times = elapsedNow(session, now);
  return stamp(session, now, {
    status,
    endedReason: reason ?? (status === 'COMPLETED' ? 'completed' : 'ended_early'),
    confirmEnd: false,
    helpText: null,
    ...anchor(session, now, times.step, times.sessionElapsed),
  });
}

function goToStep(session: MorningSession, now: Date, step: MorningStepId, skipped?: boolean): MorningSession {
  const times = elapsedNow(session, now);
  const completed = session.completedSteps.includes(session.currentStep)
    ? session.completedSteps
    : [...session.completedSteps, session.currentStep];
  const skippedSteps = skipped && !session.skippedSteps.includes(session.currentStep)
    ? [...session.skippedSteps, session.currentStep]
    : session.skippedSteps;
  return stamp(session, now, {
    currentStep: step,
    currentSubstep: 0,
    completedSteps: completed,
    skippedSteps,
    helpText: null,
    taskMicroIndex: step === 'task' ? session.taskMicroIndex : 0,
    meditationActualSeconds: session.currentStep === 'meditate' ? times.step : session.meditationActualSeconds,
    ...anchor(session, now, 0, times.sessionElapsed),
  });
}

function nextAfter(session: MorningSession, now: Date, skipped = false): MorningSession {
  const index = STEP_ORDER.indexOf(session.currentStep);
  if (index < 0 || index >= STEP_ORDER.length - 1) {
    return finishDay(session, now, 'COMPLETED');
  }
  return goToStep(session, now, STEP_ORDER[index + 1], skipped);
}

function completeCurrent(session: MorningSession, now: Date, skipped = false): MorningSession {
  const subs = substepsOf(session, session.currentStep);
  const times = elapsedNow(session, now);
  if (subs.length > 0 && session.currentSubstep < subs.length - 1) {
    return stamp(session, now, {
      currentSubstep: session.currentSubstep + 1,
      helpText: null,
      ...anchor(session, now, 0, times.sessionElapsed),
    });
  }
  if (session.currentStep === 'task' && !skipped) {
    const task = session.selectedFirstTask ?? fallbackFirstTask();
    const actions = [task.firstPhysicalAction, ...task.nextMicroActions];
    if (session.taskMicroIndex < actions.length - 1) {
      return stamp(session, now, {
        selectedFirstTask: task,
        taskMicroIndex: session.taskMicroIndex + 1,
        helpText: null,
        ...anchor(session, now, times.step, times.sessionElapsed),
      });
    }
  }
  return nextAfter(session, now, skipped);
}

function ensureDay(session: MorningSession | null, now: Date): MorningSession {
  const today = localDateKey(now);
  if (!session || session.localDate !== today) {
    return emptyWaiting(now);
  }
  if (session.status === 'NOT_DUE' && isAtOrAfterTrigger(now)) {
    return stamp(session, now, { status: 'WAITING_FOR_FIRST_UNLOCK' });
  }
  return session;
}

export function reduceMorning(
  input: MorningSession | null,
  event: MorningEvent,
  now: Date
): MorningSession {
  let session = ensureDay(input, now);

  if (event.type === 'civilRollover') {
    return ensureDay(session, now);
  }

  if (event.type === 'unlock') {
    if (!event.fromUserPresent) return session;
    if (session.status === 'COMPLETED' || session.status === 'ENDED_EARLY') return session;
    if (!isAtOrAfterTrigger(now)) {
      return stamp(session, now, { status: 'NOT_DUE' });
    }
    if (session.status === 'ACTIVE' || session.status === 'PAUSED') {
      return stamp(session, now, { firstEligibleUnlockAt: session.firstEligibleUnlockAt ?? now.toISOString() });
    }
    return activate(session, now);
  }

  if (session.status === 'COMPLETED' || session.status === 'ENDED_EARLY' || session.status === 'NOT_DUE' || session.status === 'WAITING_FOR_FIRST_UNLOCK') {
    if (event.type === 'setFirstTask') {
      return stamp(session, now, { selectedFirstTask: event.task });
    }
    return session;
  }

  if (event.type === 'tick') {
    if (session.status !== 'ACTIVE') return session;
    const times = elapsedNow(session, now);
    const planned = plannedSeconds(session, session.currentStep, session.currentSubstep);
    const patch: Partial<MorningSession> = {
      stepElapsedSeconds: times.step,
      sessionElapsedSeconds: times.sessionElapsed,
    };
    if (session.currentStep === 'meditate' && times.step >= STEP_SECONDS.meditate && !session.chimePlayed) {
      patch.chimePlayed = true;
      patch.meditationActualSeconds = STEP_SECONDS.meditate;
    }
    if (times.step >= planned && session.currentStep !== 'meditate' && session.currentStep !== 'task') {
      return completeCurrent(stamp(session, now, patch), now);
    }
    return stamp(session, now, patch);
  }

  if (event.type === 'pause') {
    if (session.status !== 'ACTIVE') return session;
    const times = elapsedNow(session, now);
    return stamp(session, now, {
      status: 'PAUSED',
      pauseAccumulatedSeconds: session.pauseAccumulatedSeconds + Math.max(0, Math.floor((now.getTime() - session.stepAnchorMs) / 1000)),
      ...anchor(session, now, times.step, times.sessionElapsed),
    });
  }

  if (event.type === 'resume') {
    if (session.status !== 'PAUSED') return session;
    return stamp(session, now, {
      status: 'ACTIVE',
      ...anchor(session, now, session.stepElapsedSeconds, session.sessionElapsedSeconds),
    });
  }

  if (event.type === 'endEarly') {
    return stamp(session, now, { confirmEnd: true });
  }
  if (event.type === 'cancelEnd') {
    return stamp(session, now, { confirmEnd: false });
  }
  if (event.type === 'confirmEnd') {
    return finishDay(session, now, 'ENDED_EARLY', 'user_ended');
  }

  if (event.type === 'toggleBreathing') {
    return stamp(session, now, { breathingEnabled: !session.breathingEnabled });
  }

  if (event.type === 'setFirstTask') {
    return stamp(session, now, { selectedFirstTask: event.task, taskMicroIndex: 0 });
  }

  if (event.type === 'setCleaning') {
    const total = event.cleaning.reduce((sum, item) => sum + item.seconds, 0);
    const cleaning = total <= STEP_SECONDS.clean ? event.cleaning : DEFAULT_CLEANING;
    return stamp(session, now, { cleaning });
  }

  if (event.type === 'help') {
    const help =
      session.currentStep === 'wake'
        ? COPY.helpWake
        : session.currentStep === 'move'
          ? COPY.helpMove
          : session.currentStep === 'clean'
            ? COPY.helpClean
            : session.currentStep === 'meditate'
              ? COPY.helpMeditate
              : COPY.helpTask;
    return stamp(session, now, { helpText: help });
  }

  if (event.type === 'easier') {
    if (session.currentStep === 'move') {
      return stamp(session, now, { seatedMovement: true, helpText: MOVE_SUBSTEPS[session.currentSubstep]?.seated ?? COPY.helpMove });
    }
    if (session.currentStep === 'clean') {
      return stamp(session, now, { helpText: COPY.helpClean });
    }
    if (session.currentStep === 'task') {
      const task = session.selectedFirstTask ?? fallbackFirstTask();
      return stamp(session, now, {
        selectedFirstTask: task,
        helpText: task.easierAlternative,
        taskMicroIndex: 0,
      });
    }
    return stamp(session, now, { helpText: COPY.helpWake });
  }

  if (event.type === 'extend') {
    const extra = event.seconds ?? 60;
    return stamp(session, now, {
      stepElapsedAtAnchor: Math.max(0, session.stepElapsedSeconds - extra),
      stepElapsedSeconds: Math.max(0, session.stepElapsedSeconds - extra),
      stepAnchorMs: now.getTime(),
    });
  }

  if (event.type === 'otherTask') {
    const task = session.selectedFirstTask;
    if (task?.easierAlternative) {
      return stamp(session, now, { helpText: task.easierAlternative, taskMicroIndex: 0 });
    }
    return stamp(session, now, { selectedFirstTask: fallbackFirstTask(), taskMicroIndex: 0 });
  }

  if (event.type === 'nextMicro') {
    return completeCurrent(session, now);
  }

  if (event.type === 'quietAlternative') {
    if (session.currentStep !== 'meditate') return session;
    return nextAfter(session, now, true);
  }

  if (event.type === 'skip') {
    if (session.currentStep === 'meditate') {
      const times = elapsedNow(session, now);
      return stamp(session, now, {
        meditationActualSeconds: times.step,
        skippedSteps: session.skippedSteps.includes('meditate') ? session.skippedSteps : [...session.skippedSteps, 'meditate'],
        helpText: COPY.meditationStopped,
        status: 'PAUSED',
        ...anchor(session, now, times.step, times.sessionElapsed),
      });
    }
    return completeCurrent(session, now, true);
  }

  if (event.type === 'ready') {
    if (session.currentStep === 'meditate' && session.helpText === COPY.meditationStopped) {
      return nextAfter(session, now, true);
    }
    if (session.currentStep === 'meditate') {
      const times = elapsedNow(session, now);
      if (times.step < STEP_SECONDS.meditate && !session.chimePlayed) {
        return session;
      }
      return nextAfter(session, now);
    }
    return completeCurrent(session, now);
  }

  return session;
}

export function currentCommand(session: MorningSession): string {
  if (session.currentStep === 'wake') return COPY.wake;
  if (session.currentStep === 'meditate') return session.helpText === COPY.meditationStopped ? COPY.meditationStopped : COPY.meditationGuide;
  if (session.currentStep === 'task') {
    const task = session.selectedFirstTask ?? fallbackFirstTask();
    const actions = [task.firstPhysicalAction, ...task.nextMicroActions];
    return actions[Math.min(session.taskMicroIndex, actions.length - 1)] ?? COPY.fallbackChoose;
  }
  const subs = substepsOf(session, session.currentStep);
  const item = subs[session.currentSubstep];
  if (!item) return '';
  if (session.currentStep === 'move' && session.seatedMovement) return item.seated ?? item.command;
  return item.command;
}

export function currentSubtext(session: MorningSession): string | null {
  if (session.helpText) return session.helpText;
  if (session.currentStep === 'wake') return COPY.wakeSub;
  if (session.currentStep === 'task') return session.selectedFirstTask?.taskTitle ?? COPY.fallbackTaskTitle;
  return null;
}

export function stepRemainingSeconds(session: MorningSession): number {
  const planned = plannedSeconds(session, session.currentStep, session.currentSubstep);
  return Math.max(0, planned - session.stepElapsedSeconds);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function shouldSpeak(session: MorningSession, previous: MorningSession | null): string | null {
  if (session.status !== 'ACTIVE') return null;
  if (session.currentStep === 'meditate' && previous?.currentStep === 'meditate' && previous.status === 'ACTIVE') {
    return null;
  }
  const key = `${session.currentStep}:${session.currentSubstep}:${session.taskMicroIndex}:${currentCommand(session)}`;
  if (session.lastSpokenKey === key) return null;
  if (previous && previous.currentStep === session.currentStep && previous.currentSubstep === session.currentSubstep && previous.taskMicroIndex === session.taskMicroIndex && previous.status === 'ACTIVE') {
    return null;
  }
  return currentCommand(session);
}

export function spokenKey(session: MorningSession): string {
  return `${session.currentStep}:${session.currentSubstep}:${session.taskMicroIndex}:${currentCommand(session)}`;
}

export function primaryLabel(session: MorningSession): string {
  if (session.currentStep === 'wake') return COPY.ready;
  if (session.currentStep === 'meditate' && session.helpText === COPY.meditationStopped) return COPY.goToTask;
  if (session.currentStep === 'meditate' && session.chimePlayed) return COPY.done;
  if (session.currentStep === 'meditate') return COPY.pause;
  if (stepRemainingSeconds(session) <= 0 && session.currentStep !== 'task') return COPY.next;
  return COPY.done;
}

export function isMorningTakeover(session: MorningSession | null): boolean {
  return session?.status === 'ACTIVE' || session?.status === 'PAUSED';
}

export function timeBudgetOk(): boolean {
  return STEP_SECONDS.wake + STEP_SECONDS.move + STEP_SECONDS.clean + STEP_SECONDS.meditate + STEP_SECONDS.task === MORNING_TOTAL_SECONDS;
}
