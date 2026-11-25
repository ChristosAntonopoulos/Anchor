import {
  NIGHT_ROUTINE,
  stepOrder,
  stepSecondsMap,
} from './routineCatalog';
import {
  getRuntimeRoutine,
  getRuntimeShorterStepOrder,
  getRuntimeStepOrder,
  getRuntimeStepSeconds,
  getRuntimeTrigger,
} from './routineRuntime';

export const NIGHT_TOTAL_SECONDS = NIGHT_ROUTINE.totalSeconds;
/** Catalog fallback; prefer getNightTrigger() after hydrate. */
export const NIGHT_TRIGGER_HOUR = NIGHT_ROUTINE.triggerHour;
export const NIGHT_TRIGGER_MINUTE = NIGHT_ROUTINE.triggerMinute;

export function getNightTrigger(): { hour: number; minute: number } {
  return getRuntimeTrigger('night');
}

export function getNightTotalSeconds(): number {
  return getRuntimeRoutine('night').totalSeconds || NIGHT_TOTAL_SECONDS;
}

export function formatNightTriggerLabel(): string {
  const t = getNightTrigger();
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

function runtimeStepSeconds(): Record<string, number> {
  const live = getRuntimeStepSeconds('night');
  return Object.keys(live).length > 0 ? live : STEP_SECONDS;
}

export type NightStatus =
  | 'NOT_DUE'
  | 'WAITING_FOR_FIRST_UNLOCK'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ENDED_EARLY';

export type NightStepId = 'screens' | 'read' | 'brush' | 'breathe' | 'close';

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
  | { type: 'quietAlternative' }
  | { type: 'useShorter' }
  | { type: 'setPin'; enabled: boolean };

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
  breatheActualSeconds: number | null;
  chimePlayed: boolean;
  lastSpokenKey: string | null;
  shorter: boolean;
  catalogVersion: string;
  updatedAt: string;
}

export const SCREEN_SUBSTEPS: NightSubstep[] = [
  { id: 'dim', seconds: 60, command: 'Dim the lights. Warm only.', seated: 'Dim one light.' },
  { id: 'feeds', seconds: 60, command: 'Close feeds and social.', seated: 'Close just the feeds.' },
  { id: 'chats', seconds: 60, command: 'Leave chats unread.', seated: 'Leave chats alone.' },
  { id: 'aside', seconds: 60, command: 'Phone face-down aside.', seated: 'Phone face-down beside you.' },
  { id: 'brightness', seconds: 60, command: 'Lower brightness if still on.', seated: 'Lower brightness.' },
];

/** Short breathing close: soft inhale 4, longer exhale 6. */
export const BREATHE_SUBSTEPS: NightSubstep[] = [
  { id: 'inhale', seconds: 60, command: 'Inhale gently through your nose. Count four.', seated: 'Soft nose inhale. Count four.' },
  { id: 'exhale', seconds: 60, command: 'Exhale a little longer. Count six.', seated: 'Longer quiet exhale. Count six.' },
  { id: 'rounds', seconds: 60, command: 'Two quiet rounds. Then stay still.', seated: 'Two quiet rounds. Then still.' },
];

export const STEP_SECONDS: Record<NightStepId, number> = stepSecondsMap<NightStepId>(NIGHT_ROUTINE.steps);

export const STEP_ORDER: NightStepId[] = stepOrder<NightStepId>(NIGHT_ROUTINE.steps);

export const SHORTER_STEP_ORDER: NightStepId[] = stepOrder<NightStepId>(NIGHT_ROUTINE.shorterSteps);

export const COPY = {
  title: 'NIGHT MODE',
  screens: 'Screens down. Evening starts.',
  screensSub: 'Dim lights. Close feeds. Phone face-down.',
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
  breatheTitle: 'Quiet breath',
  breatheGuide: 'Soft nose inhale count four. Longer exhale count six. Two quiet rounds.',
  breatheStopped: 'You stopped early. One more soft breath, or go to close-out.',
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
  helpScreens: 'Close just one screen. Leave the rest.',
  helpRead: 'Read one page. That is enough.',
  helpBrush: 'Brush gently. Skip the rest.',
  helpBreathe: 'One soft inhale, one longer exhale.',
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
  const trigger = getNightTrigger();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= trigger.hour * 60 + trigger.minute;
}

export function sessionIdFor(localDate: string): string {
  return `night-${localDate}`;
}

export function emptyWaiting(now: Date): NightSession {
  const localDate = localDateKey(now);
  return baseSession(now, localDate, isAtOrAfterTrigger(now) ? 'WAITING_FOR_FIRST_UNLOCK' : 'NOT_DUE');
}

function firstStepId(): NightStepId {
  const order = getRuntimeStepOrder('night');
  return (order[0] as NightStepId) || 'screens';
}

function baseSession(now: Date, localDate: string, status: NightStatus): NightSession {
  return {
    id: sessionIdFor(localDate),
    localDate,
    timezone: timezoneName(now),
    status,
    firstEligibleUnlockAt: null,
    activationAt: null,
    currentStep: firstStepId(),
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
    breatheActualSeconds: null,
    chimePlayed: false,
    lastSpokenKey: null,
    shorter: false,
    catalogVersion: NIGHT_ROUTINE.key + '-unify-v1',
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

function orderOf(session: NightSession): NightStepId[] {
  const live = session.shorter
    ? (getRuntimeShorterStepOrder('night') as NightStepId[])
    : (getRuntimeStepOrder('night') as NightStepId[]);
  if (live.length > 0) return live;
  return session.shorter ? SHORTER_STEP_ORDER : STEP_ORDER;
}

function secondsFor(step: string): number {
  const live = runtimeStepSeconds();
  if (typeof live[step] === 'number') return live[step];
  return STEP_SECONDS[step as NightStepId] ?? 60;
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
  // Breathe uses a single timed block (STEP_SECONDS.breathe) with guide copy;
  // BREATHE_SUBSTEPS are cue text only, not the step timer.
  if (step === 'screens') return SCREEN_SUBSTEPS;
  return [];
}

function plannedSeconds(session: NightSession, step: NightStepId, substep: number): number {
  const subs = substepsOf(session, step) ?? [];
  if (subs.length === 0) return secondsFor(step);
  const safeIndex = Math.min(Math.max(0, substep), subs.length - 1);
  const seconds = subs[safeIndex]?.seconds;
  return typeof seconds === 'number' && seconds > 0 ? seconds : secondsFor(step);
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
    currentStep: session.activationAt ? session.currentStep : firstStepId(),
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
    breatheActualSeconds: session.currentStep === 'breathe' ? times.step : session.breatheActualSeconds,
    ...anchor(session, now, 0, times.sessionElapsed),
  });
}

function nextAfter(session: NightSession, now: Date, skipped = false): NightSession {
  const order = orderOf(session);
  const index = order.indexOf(session.currentStep);
  if (index < 0 || index >= order.length - 1) {
    return finishDay(session, now, 'COMPLETED');
  }
  return goToStep(session, now, order[index + 1], skipped);
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
    if (session.currentStep === 'breathe' && times.step >= secondsFor('breathe') && !session.chimePlayed) {
      patch.chimePlayed = true;
      patch.breatheActualSeconds = secondsFor('breathe');
    }
    if (times.step >= planned && session.currentStep !== 'breathe' && session.currentStep !== 'close') {
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

  if (event.type === 'setPin') {
    return stamp(session, now, { pinEnabled: event.enabled });
  }

  if (event.type === 'useShorter') {
    if (session.shorter) return session;
    const times = elapsedNow(session, now);
    const shortOrder = orderOf({ ...session, shorter: true });
    return stamp(session, now, {
      shorter: true,
      currentStep: shortOrder[0] || 'screens',
      currentSubstep: 0,
      helpText: 'Bad-day path: shorter evening routine.',
      ...anchor(session, now, 0, times.sessionElapsed),
    });
  }

  if (event.type === 'help') {
    const help =
      session.currentStep === 'screens'
        ? COPY.helpScreens
        : session.currentStep === 'read'
          ? COPY.helpRead
          : session.currentStep === 'brush'
            ? COPY.helpBrush
            : session.currentStep === 'breathe'
              ? COPY.helpBreathe
              : COPY.helpClose;
    return stamp(session, now, { helpText: help });
  }

  if (event.type === 'easier') {
    if (session.currentStep === 'screens') {
      return stamp(session, now, { seatedScreens: true, helpText: SCREEN_SUBSTEPS[session.currentSubstep]?.seated ?? COPY.helpScreens });
    }
    if (session.currentStep === 'read' || session.currentStep === 'brush') {
      return stamp(session, now, {
        helpText: session.currentStep === 'read' ? COPY.helpRead : COPY.helpBrush,
      });
    }
    if (session.currentStep === 'close') {
      const plan = session.selectedTomorrowPlan ?? fallbackTomorrowPlan();
      return stamp(session, now, {
        selectedTomorrowPlan: plan,
        helpText: plan.easierAlternative,
        planMicroIndex: 0,
      });
    }
    return stamp(session, now, { helpText: COPY.helpScreens });
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
    if (session.currentStep !== 'breathe') return session;
    return nextAfter(session, now, true);
  }

  if (event.type === 'skip') {
    if (session.currentStep === 'breathe') {
      const times = elapsedNow(session, now);
      return stamp(session, now, {
        breatheActualSeconds: times.step,
        skippedSteps: session.skippedSteps.includes('breathe') ? session.skippedSteps : [...session.skippedSteps, 'breathe'],
        helpText: COPY.breatheStopped,
        status: 'PAUSED',
        ...anchor(session, now, times.step, times.sessionElapsed),
      });
    }
    return completeCurrent(session, now, true);
  }

  if (event.type === 'ready') {
    if (session.currentStep === 'breathe' && session.helpText === COPY.breatheStopped) {
      return nextAfter(session, now, true);
    }
    if (session.currentStep === 'breathe') {
      const times = elapsedNow(session, now);
      if (times.step < secondsFor('breathe') && !session.chimePlayed) {
        return session;
      }
      return nextAfter(session, now);
    }
    return completeCurrent(session, now);
  }

  return session;
}

export function currentCommand(session: NightSession): string {
  if (session.currentStep === 'breathe') {
    return session.helpText === COPY.breatheStopped ? COPY.breatheStopped : COPY.breatheGuide;
  }
  if (session.currentStep === 'close') {
    const plan = session.selectedTomorrowPlan ?? fallbackTomorrowPlan();
    const actions = [plan.firstPhysicalAction, ...plan.nextMicroActions];
    return actions[Math.min(session.planMicroIndex, actions.length - 1)] ?? COPY.fallbackChoose;
  }
  // Opening screens cue uses the routine definition (or COPY fallback) before substeps.
  if (session.currentStep === 'screens' && session.currentSubstep === 0) {
    const def = getRuntimeRoutine('night');
    const steps = session.shorter ? def.shorterSteps : def.steps;
    return steps.find((s) => s.id === 'screens')?.command || COPY.screens;
  }
  const subs = substepsOf(session, session.currentStep);
  const item = subs[session.currentSubstep];
  if (item) {
    if (session.currentStep === 'screens' && session.seatedScreens) return item.seated ?? item.command;
    return item.command;
  }
  const def = getRuntimeRoutine('night');
  const steps = session.shorter ? def.shorterSteps : def.steps;
  const remote = steps.find((s) => s.id === session.currentStep);
  if (remote?.command) return remote.command;
  return remote?.title ?? '';
}

export function currentSubtext(session: NightSession): string | null {
  if (session.helpText) return session.helpText;
  if (session.currentStep === 'screens' && session.currentSubstep === 0) return COPY.screensSub;
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
  if (session.currentStep === 'breathe' && previous?.currentStep === 'breathe' && previous.status === 'ACTIVE') {
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
  if (session.currentStep === 'screens' && session.currentSubstep === 0) return COPY.ready;
  if (session.currentStep === 'breathe' && session.helpText === COPY.breatheStopped) return COPY.goToClose;
  if (session.currentStep === 'breathe' && session.chimePlayed) return COPY.done;
  if (session.currentStep === 'breathe') return COPY.pause;
  if (stepRemainingSeconds(session) <= 0 && session.currentStep !== 'close') return COPY.next;
  return COPY.done;
}

export function isNightTakeover(session: NightSession | null): boolean {
  return session?.status === 'ACTIVE' || session?.status === 'PAUSED';
}

export function timeBudgetOk(): boolean {
  const seconds = runtimeStepSeconds();
  const order = getRuntimeStepOrder('night');
  const ids = order.length > 0 ? order : STEP_ORDER;
  const total = ids.reduce((sum, id) => sum + (seconds[id] ?? 0), 0);
  return total === getNightTotalSeconds();
}
