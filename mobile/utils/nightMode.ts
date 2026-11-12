export const NIGHT_TOTAL_SECONDS = 1800;
export const NIGHT_TRIGGER_HOUR = 22;
export const NIGHT_TRIGGER_MINUTE = 0;

export type NightStatus =
  | 'NOT_DUE'
  | 'WAITING_FOR_FIRST_UNLOCK'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ENDED_EARLY';

export type NightStepId = 'dim' | 'screens' | 'prepare' | 'settle' | 'close';

export type NightEvent =
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
  | { type: 'otherPlan' }
  | { type: 'toggleBreathing' }
  | { type: 'civilRollover' }
  | { type: 'setTomorrowPlan'; plan: NightTomorrowPlan }
  | { type: 'setPrepare'; prepare: NightSubstep[] }
  | { type: 'quietAlternative' };

export interface NightSubstep {
  id: string;
  seconds: number;
  command: string;
  seated?: string;
}

export interface NightTomorrowPlan {
  taskId: string | null;
  taskTitle: string;
  reason: string;
  firstPhysicalAction: string;
  nextMicroActions: string[];
  easierAlternative: string;
}

export interface NightSession {
  id: string;
  localDate: string;
  timezone: string;
  status: NightStatus;
  firstEligibleUnlockAt: string | null;
  activationAt: string | null;
  currentStep: NightStepId;
  currentSubstep: number;
  stepElapsedSeconds: number;
  sessionElapsedSeconds: number;
  pauseAccumulatedSeconds: number;
  stepAnchorMs: number;
  sessionAnchorMs: number;
  stepElapsedAtAnchor: number;
  sessionElapsedAtAnchor: number;
  completedSteps: NightStepId[];
  skippedSteps: NightStepId[];
  seatedScreens: boolean;
  breathingEnabled: boolean;
  planMicroIndex: number;
  selectedTomorrowPlan: NightTomorrowPlan | null;
  helpText: string | null;
  endedReason: string | null;
  confirmEnd: boolean;
  pinEnabled: boolean;
  prepare: NightSubstep[];
  settleActualSeconds: number | null;
  chimePlayed: boolean;
  lastSpokenKey: string | null;
  updatedAt: string;
}

export const SCREEN_SUBSTEPS: NightSubstep[] = [
  { id: 'feeds', seconds: 60, command: 'Close the feeds.', seated: 'Just close the feeds.' },
  { id: 'chats', seconds: 60, command: 'Leave the chats alone.', seated: 'Leave the chats alone while seated.' },
  { id: 'brightness', seconds: 60, command: 'Lower the brightness.', seated: 'Lower the brightness.' },
  { id: 'aside', seconds: 60, command: 'Put the phone aside.', seated: 'Put the phone beside you.' },
];

export const DEFAULT_PREPARE: NightSubstep[] = [
  { id: 'cool', seconds: 120, command: 'Make the room a little cooler.' },
  { id: 'wash', seconds: 180, command: 'Wash up gently / brush teeth.' },
  { id: 'bed', seconds: 180, command: 'Prepare the bed.' },
];

export const STEP_SECONDS: Record<NightStepId, number> = {
  dim: 60,
  screens: 240,
  prepare: 480,
  settle: 780,
  close: 240,
};

export const STEP_ORDER: NightStepId[] = ['dim', 'screens', 'prepare', 'settle', 'close'];

export const COPY = {
  title: 'NIGHT MODE',
  dim: 'Dim the lights. Let\'s close out the day.',
  dimSub: 'Warm light only. Close the curtains if you need to.',
  ready: 'Ready',
  done: 'Done',
  pause: 'Pause',
  resume: 'Continue',
  skip: 'Skip',
  help: 'Help',
  easier: 'Easier',
  other: 'Other',
  extend: 'One more minute',
  next: 'Next',
  end: 'End Night Mode',
  endConfirm: 'Done for tonight?',
  endYes: 'Yes, done',
  endNo: 'Continue',
  settleTitle: 'Quiet',
  settleGuide:
    'Sit or lie down comfortably. Notice your breath. When your mind wanders, gently come back.',
  settleStopped: 'You stopped early. Stay quiet for a minute, or go to close-out.',
  sitQuietly: 'Stay quiet',
  goToClose: 'Close-out',
  hideBreath: 'No motion',
  showBreath: 'Breath',
  fallbackPlanTitle: 'First step for tomorrow',
  fallbackFirstAction: 'Write one small first step for tomorrow.',
  fallbackNext: 'Put the phone on charge away from the bed.',
  fallbackChoose: 'Pick just one thing for tomorrow morning.',
  fallbackEasier: 'Write only one word for tomorrow. Nothing else.',
  fallbackReason: 'Close the loop with one small, concrete step.',
  noPlan: 'No saved plan. Write one small first step for tomorrow.',
  helpDim: 'Dim one light. Warm light is enough.',
  helpScreens: 'Close just one screen. Leave the rest.',
  helpPrepare: 'Do only one thing: cool the room, wash up, or make the bed.',
  helpSettle: 'You do not need to do it right. Stay quiet.',
  helpClose: 'Write one small step. Then put the phone away.',
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
  return minutes >= NIGHT_TRIGGER_HOUR * 60 + NIGHT_TRIGGER_MINUTE;
}

export function sessionIdFor(localDate: string): string {
  return `night-${localDate}`;
}

export function emptyWaiting(now: Date): NightSession {
  const localDate = localDateKey(now);
  return baseSession(now, localDate, isAtOrAfterTrigger(now) ? 'WAITING_FOR_FIRST_UNLOCK' : 'NOT_DUE');
}

function baseSession(now: Date, localDate: string, status: NightStatus): NightSession {
  return {
    id: sessionIdFor(localDate),
    localDate,
    timezone: timezoneName(now),
    status,
    firstEligibleUnlockAt: null,
    activationAt: null,
    currentStep: 'dim',
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
    seatedScreens: false,
    breathingEnabled: true,
    planMicroIndex: 0,
    selectedTomorrowPlan: null,
    helpText: null,
    endedReason: null,
    confirmEnd: false,
    pinEnabled: false,
    prepare: DEFAULT_PREPARE.map((item) => ({ ...item })),
    settleActualSeconds: null,
    chimePlayed: false,
    lastSpokenKey: null,
    updatedAt: now.toISOString(),
  };
}

export function fallbackTomorrowPlan(task?: { id?: string | null; title?: string | null } | null): NightTomorrowPlan {
  const title = task?.title?.trim();
  if (!title) {
    return {
      taskId: null,
      taskTitle: COPY.fallbackPlanTitle,
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

function stamp(session: NightSession, now: Date, patch: Partial<NightSession>): NightSession {
  return { ...session, ...patch, updatedAt: now.toISOString() };
}

function elapsedNow(session: NightSession, now: Date): { step: number; sessionElapsed: number } {
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

function substepsOf(session: NightSession, step: NightStepId): NightSubstep[] {
  if (step === 'screens') return SCREEN_SUBSTEPS;
  if (step === 'prepare') return session.prepare;
  return [];
}

function plannedSeconds(session: NightSession, step: NightStepId, substep: number): number {
  const subs = substepsOf(session, step);
  if (subs.length > 0) return subs[Math.min(substep, subs.length - 1)]?.seconds ?? STEP_SECONDS[step];
  return STEP_SECONDS[step];
}

function anchor(session: NightSession, now: Date, stepElapsed: number, sessionElapsed: number): Partial<NightSession> {
  return {
    stepElapsedSeconds: stepElapsed,
    sessionElapsedSeconds: sessionElapsed,
    stepElapsedAtAnchor: stepElapsed,
    sessionElapsedAtAnchor: sessionElapsed,
    stepAnchorMs: now.getTime(),
    sessionAnchorMs: now.getTime(),
  };
}

function activate(session: NightSession, now: Date): NightSession {
  return stamp(session, now, {
    status: 'ACTIVE',
    firstEligibleUnlockAt: session.firstEligibleUnlockAt ?? now.toISOString(),
    activationAt: session.activationAt ?? now.toISOString(),
    currentStep: session.activationAt ? session.currentStep : 'dim',
    ...anchor(session, now, session.activationAt ? session.stepElapsedSeconds : 0, session.activationAt ? session.sessionElapsedSeconds : 0),
    helpText: null,
    confirmEnd: false,
  });
}

function finishDay(session: NightSession, now: Date, status: 'COMPLETED' | 'ENDED_EARLY', reason?: string): NightSession {
  const times = elapsedNow(session, now);
  return stamp(session, now, {
    status,
    endedReason: reason ?? (status === 'COMPLETED' ? 'completed' : 'ended_early'),
    confirmEnd: false,
    helpText: null,
    ...anchor(session, now, times.step, times.sessionElapsed),
  });
}

function goToStep(session: NightSession, now: Date, step: NightStepId, skipped?: boolean): NightSession {
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
    planMicroIndex: step === 'close' ? session.planMicroIndex : 0,
    settleActualSeconds: session.currentStep === 'settle' ? times.step : session.settleActualSeconds,
    ...anchor(session, now, 0, times.sessionElapsed),
  });
}

function nextAfter(session: NightSession, now: Date, skipped = false): NightSession {
  const index = STEP_ORDER.indexOf(session.currentStep);
  if (index < 0 || index >= STEP_ORDER.length - 1) {
    return finishDay(session, now, 'COMPLETED');
  }
  return goToStep(session, now, STEP_ORDER[index + 1], skipped);
}

function completeCurrent(session: NightSession, now: Date, skipped = false): NightSession {
  const subs = substepsOf(session, session.currentStep);
  const times = elapsedNow(session, now);
  if (subs.length > 0 && session.currentSubstep < subs.length - 1) {
    return stamp(session, now, {
      currentSubstep: session.currentSubstep + 1,
      helpText: null,
      ...anchor(session, now, 0, times.sessionElapsed),
    });
  }
  if (session.currentStep === 'close' && !skipped) {
    const plan = session.selectedTomorrowPlan ?? fallbackTomorrowPlan();
    const actions = [plan.firstPhysicalAction, ...plan.nextMicroActions];
    if (session.planMicroIndex < actions.length - 1) {
      return stamp(session, now, {
        selectedTomorrowPlan: plan,
        planMicroIndex: session.planMicroIndex + 1,
        helpText: null,
        ...anchor(session, now, times.step, times.sessionElapsed),
      });
    }
  }
  return nextAfter(session, now, skipped);
}

function ensureDay(session: NightSession | null, now: Date): NightSession {
  const today = localDateKey(now);
  if (!session || session.localDate !== today) {
    return emptyWaiting(now);
  }
  if (session.status === 'NOT_DUE' && isAtOrAfterTrigger(now)) {
    return stamp(session, now, { status: 'WAITING_FOR_FIRST_UNLOCK' });
  }
  return session;
}

export function reduceNight(
  input: NightSession | null,
  event: NightEvent,
  now: Date
): NightSession {
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
    if (event.type === 'setTomorrowPlan') {
      return stamp(session, now, { selectedTomorrowPlan: event.plan });
    }
    return session;
  }

  if (event.type === 'tick') {
    if (session.status !== 'ACTIVE') return session;
    const times = elapsedNow(session, now);
    const planned = plannedSeconds(session, session.currentStep, session.currentSubstep);
    const patch: Partial<NightSession> = {
      stepElapsedSeconds: times.step,
      sessionElapsedSeconds: times.sessionElapsed,
    };
    if (session.currentStep === 'settle' && times.step >= STEP_SECONDS.settle && !session.chimePlayed) {
      patch.chimePlayed = true;
      patch.settleActualSeconds = STEP_SECONDS.settle;
    }
    if (times.step >= planned && session.currentStep !== 'settle' && session.currentStep !== 'close') {
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

  if (event.type === 'setTomorrowPlan') {
    return stamp(session, now, { selectedTomorrowPlan: event.plan, planMicroIndex: 0 });
  }

  if (event.type === 'setPrepare') {
    const total = event.prepare.reduce((sum, item) => sum + item.seconds, 0);
    const prepare = total <= STEP_SECONDS.prepare ? event.prepare : DEFAULT_PREPARE;
    return stamp(session, now, { prepare });
  }

  if (event.type === 'help') {
    const help =
      session.currentStep === 'dim'
        ? COPY.helpDim
        : session.currentStep === 'screens'
          ? COPY.helpScreens
          : session.currentStep === 'prepare'
            ? COPY.helpPrepare
            : session.currentStep === 'settle'
              ? COPY.helpSettle
              : COPY.helpClose;
    return stamp(session, now, { helpText: help });
  }

  if (event.type === 'easier') {
    if (session.currentStep === 'screens') {
      return stamp(session, now, { seatedScreens: true, helpText: SCREEN_SUBSTEPS[session.currentSubstep]?.seated ?? COPY.helpScreens });
    }
    if (session.currentStep === 'prepare') {
      return stamp(session, now, { helpText: COPY.helpPrepare });
    }
    if (session.currentStep === 'close') {
      const plan = session.selectedTomorrowPlan ?? fallbackTomorrowPlan();
      return stamp(session, now, {
        selectedTomorrowPlan: plan,
        helpText: plan.easierAlternative,
        planMicroIndex: 0,
      });
    }
    return stamp(session, now, { helpText: COPY.helpDim });
  }

  if (event.type === 'extend') {
    const extra = event.seconds ?? 60;
    return stamp(session, now, {
      stepElapsedAtAnchor: Math.max(0, session.stepElapsedSeconds - extra),
      stepElapsedSeconds: Math.max(0, session.stepElapsedSeconds - extra),
      stepAnchorMs: now.getTime(),
    });
  }

  if (event.type === 'otherPlan') {
    const plan = session.selectedTomorrowPlan;
    if (plan?.easierAlternative) {
      return stamp(session, now, { helpText: plan.easierAlternative, planMicroIndex: 0 });
    }
    return stamp(session, now, { selectedTomorrowPlan: fallbackTomorrowPlan(), planMicroIndex: 0 });
  }

  if (event.type === 'nextMicro') {
    return completeCurrent(session, now);
  }

  if (event.type === 'quietAlternative') {
    if (session.currentStep !== 'settle') return session;
    return nextAfter(session, now, true);
  }

  if (event.type === 'skip') {
    if (session.currentStep === 'settle') {
      const times = elapsedNow(session, now);
      return stamp(session, now, {
        settleActualSeconds: times.step,
        skippedSteps: session.skippedSteps.includes('settle') ? session.skippedSteps : [...session.skippedSteps, 'settle'],
        helpText: COPY.settleStopped,
        status: 'PAUSED',
        ...anchor(session, now, times.step, times.sessionElapsed),
      });
    }
    return completeCurrent(session, now, true);
  }

  if (event.type === 'ready') {
    if (session.currentStep === 'settle' && session.helpText === COPY.settleStopped) {
      return nextAfter(session, now, true);
    }
    if (session.currentStep === 'settle') {
      const times = elapsedNow(session, now);
      if (times.step < STEP_SECONDS.settle && !session.chimePlayed) {
        return session;
      }
      return nextAfter(session, now);
    }
    return completeCurrent(session, now);
  }

  return session;
}

export function currentCommand(session: NightSession): string {
  if (session.currentStep === 'dim') return COPY.dim;
  if (session.currentStep === 'settle') return session.helpText === COPY.settleStopped ? COPY.settleStopped : COPY.settleGuide;
  if (session.currentStep === 'close') {
    const plan = session.selectedTomorrowPlan ?? fallbackTomorrowPlan();
    const actions = [plan.firstPhysicalAction, ...plan.nextMicroActions];
    return actions[Math.min(session.planMicroIndex, actions.length - 1)] ?? COPY.fallbackChoose;
  }
  const subs = substepsOf(session, session.currentStep);
  const item = subs[session.currentSubstep];
  if (!item) return '';
  if (session.currentStep === 'screens' && session.seatedScreens) return item.seated ?? item.command;
  return item.command;
}

export function currentSubtext(session: NightSession): string | null {
  if (session.helpText) return session.helpText;
  if (session.currentStep === 'dim') return COPY.dimSub;
  if (session.currentStep === 'close') return session.selectedTomorrowPlan?.taskTitle ?? COPY.fallbackPlanTitle;
  return null;
}

export function stepRemainingSeconds(session: NightSession): number {
  const planned = plannedSeconds(session, session.currentStep, session.currentSubstep);
  return Math.max(0, planned - session.stepElapsedSeconds);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function shouldSpeak(session: NightSession, previous: NightSession | null): string | null {
  if (session.status !== 'ACTIVE') return null;
  if (session.currentStep === 'settle' && previous?.currentStep === 'settle' && previous.status === 'ACTIVE') {
    return null;
  }
  const key = `${session.currentStep}:${session.currentSubstep}:${session.planMicroIndex}:${currentCommand(session)}`;
  if (session.lastSpokenKey === key) return null;
  if (previous && previous.currentStep === session.currentStep && previous.currentSubstep === session.currentSubstep && previous.planMicroIndex === session.planMicroIndex && previous.status === 'ACTIVE') {
    return null;
  }
  return currentCommand(session);
}

export function spokenKey(session: NightSession): string {
  return `${session.currentStep}:${session.currentSubstep}:${session.planMicroIndex}:${currentCommand(session)}`;
}

export function primaryLabel(session: NightSession): string {
  if (session.currentStep === 'dim') return COPY.ready;
  if (session.currentStep === 'settle' && session.helpText === COPY.settleStopped) return COPY.goToClose;
  if (session.currentStep === 'settle' && session.chimePlayed) return COPY.done;
  if (session.currentStep === 'settle') return COPY.pause;
  if (stepRemainingSeconds(session) <= 0 && session.currentStep !== 'close') return COPY.next;
  return COPY.done;
}

export function isNightTakeover(session: NightSession | null): boolean {
  return session?.status === 'ACTIVE' || session?.status === 'PAUSED';
}

export function timeBudgetOk(): boolean {
  return STEP_SECONDS.dim + STEP_SECONDS.screens + STEP_SECONDS.prepare + STEP_SECONDS.settle + STEP_SECONDS.close === NIGHT_TOTAL_SECONDS;
}
