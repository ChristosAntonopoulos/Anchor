import {
  MORNING_ROUTINE,
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

export const MORNING_TOTAL_SECONDS = MORNING_ROUTINE.totalSeconds;
/** Catalog fallback; prefer getMorningTrigger() after hydrate. */
export const MORNING_TRIGGER_HOUR = MORNING_ROUTINE.triggerHour;
export const MORNING_TRIGGER_MINUTE = MORNING_ROUTINE.triggerMinute;

export function getMorningTrigger(): { hour: number; minute: number } {
  return getRuntimeTrigger('morning');
}

export function getMorningTotalSeconds(): number {
  return getRuntimeRoutine('morning').totalSeconds || MORNING_TOTAL_SECONDS;
}

export function formatMorningTriggerLabel(): string {
  const t = getMorningTrigger();
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
}

function runtimeStepSeconds(): Record<string, number> {
  const live = getRuntimeStepSeconds('morning');
  return Object.keys(live).length > 0 ? live : STEP_SECONDS;
}

export type MorningStatus =
  | 'NOT_DUE'
  | 'WAITING_FOR_FIRST_UNLOCK'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ENDED_EARLY';

export type MorningStepId = 'water' | 'move' | 'brush' | 'settle' | 'task';

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
  | { type: 'setBrush'; brush: MorningSubstep[] }
  | { type: 'quietAlternative' }
  | { type: 'useShorter' }
  | { type: 'setPin'; enabled: boolean };

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
  brush: MorningSubstep[];
  settleActualSeconds: number | null;
  chimePlayed: boolean;
  lastSpokenKey: string | null;
  shorter: boolean;
  catalogVersion: string;
  updatedAt: string;
}

export const MOVE_SUBSTEPS: MorningSubstep[] = [
  { id: 'march', seconds: 75, command: 'March in place.', seated: 'Move your feet while seated.' },
  { id: 'shoulders', seconds: 75, command: 'Relax your shoulders.', seated: 'Relax your shoulders while seated.' },
  { id: 'stands', seconds: 75, command: 'Do a few squats.', seated: 'Stand and sit with support.' },
  { id: 'stretch', seconds: 75, command: 'Stretch gently.', seated: 'Stretch gently while seated.' },
];

export const DEFAULT_BRUSH: MorningSubstep[] = [
  { id: 'teeth', seconds: 120, command: 'Brush your teeth.' },
  { id: 'wash', seconds: 120, command: 'Quick wash of face and hands.' },
];

export const STEP_SECONDS: Record<MorningStepId, number> = stepSecondsMap<MorningStepId>(MORNING_ROUTINE.steps);

export const STEP_ORDER: MorningStepId[] = stepOrder<MorningStepId>(MORNING_ROUTINE.steps);

export const SHORTER_STEP_ORDER: MorningStepId[] = stepOrder<MorningStepId>(MORNING_ROUTINE.shorterSteps);

export const COPY = {
  title: 'MORNING MODE',
  water: 'Drink water. Let\'s get started.',
  waterSub: 'Open the curtains if you want. One glass is enough.',
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
  end: 'End Morning Mode',
  endConfirm: 'Done for today?',
  endYes: 'Yes, done',
  endNo: 'Continue',
  settleTitle: 'Short settle',
  settleGuide:
    'Sit comfortably. Notice your breath. When your mind wanders, gently come back.',
  settleStopped: 'You stopped early. Sit quietly for a minute, or go to the first task.',
  sitQuietly: 'Sit quietly',
  goToTask: 'First task',
  hideBreath: 'No motion',
  showBreath: 'Breath',
  fallbackTaskTitle: 'First task of the day',
  fallbackFirstAction: 'Open Cursor.',
  fallbackNext: 'Open the project.',
  fallbackChoose: 'Pick the first small thing you will do.',
  fallbackEasier: 'Just open Cursor. Nothing else.',
  fallbackReason: 'Start with something small you already know.',
  noTask: 'No saved task. Open Cursor and pick one small step.',
  helpWater: 'Open the curtains. A glass of water is enough.',
  helpMove: 'Only do what feels comfortable. Sit if you need to.',
  helpBrush: 'Brush and wash gently. That is enough.',
  helpSettle: 'You do not need to do it right. Just sit.',
  helpTask: 'Do only the first physical move. No planning.',
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
  const trigger = getMorningTrigger();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= trigger.hour * 60 + trigger.minute;
}

export function sessionIdFor(localDate: string): string {
  return `morning-${localDate}`;
}

export function emptyWaiting(now: Date): MorningSession {
  const localDate = localDateKey(now);
  return baseSession(now, localDate, isAtOrAfterTrigger(now) ? 'WAITING_FOR_FIRST_UNLOCK' : 'NOT_DUE');
}

function firstStepId(): MorningStepId {
  const order = getRuntimeStepOrder('morning');
  return (order[0] as MorningStepId) || 'water';
}

function baseSession(now: Date, localDate: string, status: MorningStatus): MorningSession {
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
    seatedMovement: false,
    breathingEnabled: true,
    taskMicroIndex: 0,
    selectedFirstTask: null,
    helpText: null,
    endedReason: null,
    confirmEnd: false,
    pinEnabled: false,
    brush: DEFAULT_BRUSH.map((item) => ({ ...item })),
    settleActualSeconds: null,
    chimePlayed: false,
    lastSpokenKey: null,
    shorter: false,
    catalogVersion: getRuntimeRoutine('morning').key + '-unify-v1',
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

function orderOf(session: MorningSession): MorningStepId[] {
  const live = session.shorter
    ? (getRuntimeShorterStepOrder('morning') as MorningStepId[])
    : (getRuntimeStepOrder('morning') as MorningStepId[]);
  if (live.length > 0) return live;
  return session.shorter ? SHORTER_STEP_ORDER : STEP_ORDER;
}

function secondsFor(step: string): number {
  const live = runtimeStepSeconds();
  if (typeof live[step] === 'number' && Number.isFinite(live[step])) return live[step];
  return STEP_SECONDS[step as MorningStepId] ?? 60;
}

function sanitizeSubsteps(items: MorningSubstep[] | null | undefined, fallback: MorningSubstep[]): MorningSubstep[] {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback.map((item) => ({ ...item }));
  }
  return items.map((item, index) => ({
    id: typeof item?.id === 'string' && item.id.trim() ? item.id : `sub-${index + 1}`,
    seconds: typeof item?.seconds === 'number' && item.seconds > 0 ? item.seconds : fallback[index]?.seconds ?? 60,
    command: typeof item?.command === 'string' ? item.command : fallback[index]?.command ?? '',
    seated: typeof item?.seated === 'string' ? item.seated : fallback[index]?.seated,
  }));
}

/** Fill missing optional fields from API/native payloads so timers never see undefined. */
export function normalizeMorningSession(
  input: Partial<MorningSession> & Pick<MorningSession, 'localDate' | 'status'>,
  now = new Date()
): MorningSession {
  const base = baseSession(now, input.localDate, input.status);
  const merged: MorningSession = {
    ...base,
    ...input,
    brush: sanitizeSubsteps(input.brush, DEFAULT_BRUSH),
    completedSteps: Array.isArray(input.completedSteps) ? input.completedSteps : [],
    skippedSteps: Array.isArray(input.skippedSteps) ? input.skippedSteps : [],
    stepElapsedSeconds: typeof input.stepElapsedSeconds === 'number' ? input.stepElapsedSeconds : 0,
    sessionElapsedSeconds: typeof input.sessionElapsedSeconds === 'number' ? input.sessionElapsedSeconds : 0,
    currentSubstep: typeof input.currentSubstep === 'number' && input.currentSubstep >= 0 ? input.currentSubstep : 0,
    taskMicroIndex: typeof input.taskMicroIndex === 'number' && input.taskMicroIndex >= 0 ? input.taskMicroIndex : 0,
  };
  const order = orderOf(merged);
  if (!order.includes(merged.currentStep)) {
    merged.currentStep = (order[0] as MorningStepId) || 'water';
    merged.currentSubstep = 0;
  }
  const subs = substepsOf(merged, merged.currentStep);
  if (subs.length > 0 && merged.currentSubstep >= subs.length) {
    merged.currentSubstep = Math.max(0, subs.length - 1);
  }
  return merged;
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
  // Move is a single timed block from routine data (e.g. "go outside");
  // MOVE_SUBSTEPS remain available for easier/seated help copy only.
  if (step === 'brush') return sanitizeSubsteps(session.brush, DEFAULT_BRUSH);
  return [];
}

function plannedSeconds(session: MorningSession, step: MorningStepId, substep: number): number {
  const subs = substepsOf(session, step);
  if (!subs || subs.length === 0) return secondsFor(step);
  const safeIndex = Math.min(Math.max(0, substep), subs.length - 1);
  const seconds = subs[safeIndex]?.seconds;
  return typeof seconds === 'number' && seconds > 0 ? seconds : secondsFor(step);
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
    currentStep: session.activationAt ? session.currentStep : firstStepId(),
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
    settleActualSeconds: session.currentStep === 'settle' ? times.step : session.settleActualSeconds,
    ...anchor(session, now, 0, times.sessionElapsed),
  });
}

function nextAfter(session: MorningSession, now: Date, skipped = false): MorningSession {
  const order = orderOf(session);
  const index = order.indexOf(session.currentStep);
  if (index < 0 || index >= order.length - 1) {
    return finishDay(session, now, 'COMPLETED');
  }
  return goToStep(session, now, order[index + 1], skipped);
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
  const normalized = normalizeMorningSession(session, now);
  if (normalized.status === 'NOT_DUE' && isAtOrAfterTrigger(now)) {
    return stamp(normalized, now, { status: 'WAITING_FOR_FIRST_UNLOCK' });
  }
  return normalized;
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
    if (session.currentStep === 'settle' && times.step >= secondsFor('settle') && !session.chimePlayed) {
      patch.chimePlayed = true;
      patch.settleActualSeconds = secondsFor('settle');
    }
    if (times.step >= planned && session.currentStep !== 'settle' && session.currentStep !== 'task') {
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

  if (event.type === 'setBrush') {
    const candidate = sanitizeSubsteps(event.brush, DEFAULT_BRUSH);
    const total = candidate.reduce((sum, item) => sum + item.seconds, 0);
    const brush = total <= secondsFor('brush') ? candidate : DEFAULT_BRUSH.map((item) => ({ ...item }));
    return stamp(session, now, { brush });
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
      currentStep: shortOrder[0] || 'water',
      currentSubstep: 0,
      helpText: 'Bad-day path: shorter routine.',
      ...anchor(session, now, 0, times.sessionElapsed),
    });
  }

  if (event.type === 'help') {
    const help =
      session.currentStep === 'water'
        ? COPY.helpWater
        : session.currentStep === 'move'
          ? COPY.helpMove
          : session.currentStep === 'brush'
            ? COPY.helpBrush
            : session.currentStep === 'settle'
              ? COPY.helpSettle
              : COPY.helpTask;
    return stamp(session, now, { helpText: help });
  }

  if (event.type === 'easier') {
    if (session.currentStep === 'move') {
      return stamp(session, now, { seatedMovement: true, helpText: MOVE_SUBSTEPS[session.currentSubstep]?.seated ?? COPY.helpMove });
    }
    if (session.currentStep === 'brush') {
      return stamp(session, now, { helpText: COPY.helpBrush });
    }
    if (session.currentStep === 'task') {
      const task = session.selectedFirstTask ?? fallbackFirstTask();
      return stamp(session, now, {
        selectedFirstTask: task,
        helpText: task.easierAlternative,
        taskMicroIndex: 0,
      });
    }
    return stamp(session, now, { helpText: COPY.helpWater });
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
      if (times.step < secondsFor('settle') && !session.chimePlayed) {
        return session;
      }
      return nextAfter(session, now);
    }
    return completeCurrent(session, now);
  }

  return session;
}

export function currentCommand(session: MorningSession): string {
  if (session.currentStep === 'settle') {
    return session.helpText === COPY.settleStopped ? COPY.settleStopped : COPY.settleGuide;
  }
  if (session.currentStep === 'task') {
    const task = session.selectedFirstTask ?? fallbackFirstTask();
    const actions = [task.firstPhysicalAction, ...task.nextMicroActions];
    return actions[Math.min(session.taskMicroIndex, actions.length - 1)] ?? COPY.fallbackChoose;
  }
  const subs = substepsOf(session, session.currentStep);
  const item = subs[session.currentSubstep];
  if (item) {
    if (session.currentStep === 'move' && session.seatedMovement) return item.seated ?? item.command;
    return item.command;
  }
  const def = getRuntimeRoutine('morning');
  const steps = session.shorter ? def.shorterSteps : def.steps;
  const remote = steps.find((s) => s.id === session.currentStep);
  if (remote?.command) return remote.command;
  if (session.currentStep === 'water') return COPY.water;
  return remote?.title ?? '';
}

export function currentSubtext(session: MorningSession): string | null {
  if (session.helpText) return session.helpText;
  if (session.currentStep === 'water') return COPY.waterSub;
  if (session.currentStep === 'task') return session.selectedFirstTask?.taskTitle ?? COPY.fallbackTaskTitle;
  return null;
}

export function stepRemainingSeconds(session: MorningSession): number {
  const safe = normalizeMorningSession(session);
  const planned = plannedSeconds(safe, safe.currentStep, safe.currentSubstep);
  const elapsed = typeof safe.stepElapsedSeconds === 'number' ? safe.stepElapsedSeconds : 0;
  return Math.max(0, planned - elapsed);
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function shouldSpeak(session: MorningSession, previous: MorningSession | null): string | null {
  if (session.status !== 'ACTIVE') return null;
  if (session.currentStep === 'settle' && previous?.currentStep === 'settle' && previous.status === 'ACTIVE') {
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
  if (session.currentStep === 'water') return COPY.ready;
  if (session.currentStep === 'settle' && session.helpText === COPY.settleStopped) return COPY.goToTask;
  if (session.currentStep === 'settle' && session.chimePlayed) return COPY.done;
  if (session.currentStep === 'settle') return COPY.pause;
  if (stepRemainingSeconds(session) <= 0 && session.currentStep !== 'task') return COPY.next;
  return COPY.done;
}

export function isMorningTakeover(session: MorningSession | null): boolean {
  return session?.status === 'ACTIVE' || session?.status === 'PAUSED';
}

export function timeBudgetOk(): boolean {
  const seconds = runtimeStepSeconds();
  const order = getRuntimeStepOrder('morning');
  const ids = order.length > 0 ? order : STEP_ORDER;
  const total = ids.reduce((sum, id) => sum + (seconds[id] ?? 0), 0);
  return total === getMorningTotalSeconds();
}
