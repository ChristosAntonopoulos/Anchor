import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COPY,
  MORNING_TOTAL_SECONDS,
  STEP_ORDER,
  STEP_SECONDS,
  currentCommand,
  emptyWaiting,
  fallbackFirstTask,
  formatClock,
  isAtOrAfterTrigger,
  localDateKey,
  normalizeMorningSession,
  reduceMorning,
  shouldSpeak,
  stepRemainingSeconds,
  timeBudgetOk,
} from './morningMode.ts';

const morning = (h: number, m = 0, s = 0) => new Date(2026, 10, 12, h, m, s, 0);

test('planned durations total exactly 30 minutes', () => {
  assert.equal(
    STEP_ORDER.reduce((sum, id) => sum + STEP_SECONDS[id], 0),
    MORNING_TOTAL_SECONDS
  );
  assert.equal(timeBudgetOk(), true);
  assert.equal(STEP_SECONDS.settle, 780);
});

test('unlock before 07:00 does not activate', () => {
  const now = morning(6, 59);
  const waiting = emptyWaiting(now);
  const next = reduceMorning(waiting, { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(next.status, 'NOT_DUE');
  assert.equal(isAtOrAfterTrigger(now), false);
});

test('first unlock at 07:00 activates once', () => {
  const now = morning(7, 0);
  const session = reduceMorning(emptyWaiting(now), { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.currentStep, 'water');
  assert.equal(currentCommand(session), 'Open curtains if you want. Drink a glass of water.');
  const again = reduceMorning(session, { type: 'unlock', fromUserPresent: true }, morning(7, 35));
  assert.equal(again.status, 'ACTIVE');
  assert.equal(again.id, session.id);
});

test('unlock that is not USER_PRESENT is ignored', () => {
  const now = morning(7, 30);
  const next = reduceMorning(emptyWaiting(now), { type: 'unlock', fromUserPresent: false }, now);
  assert.equal(next.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('late first unlock at 07:35 still starts the routine', () => {
  const session = reduceMorning(emptyWaiting(morning(7, 35)), { type: 'unlock', fromUserPresent: true }, morning(7, 35));
  assert.equal(session.status, 'ACTIVE');
  assert.equal(localDateKey(morning(7, 35)), '2026-11-12');
});

test('completed routine does not activate again the same day', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = reduceMorning(session, { type: 'endEarly' }, morning(7, 1));
  session = reduceMorning(session, { type: 'confirmEnd' }, morning(7, 1));
  assert.equal(session.status, 'ENDED_EARLY');
  const again = reduceMorning(session, { type: 'unlock', fromUserPresent: true }, morning(8));
  assert.equal(again.status, 'ENDED_EARLY');
});

test('new local date resets after completion', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = reduceMorning(session, { type: 'confirmEnd' }, morning(7));
  session = reduceMorning({ ...session, status: 'COMPLETED', localDate: '2026-11-12' }, { type: 'civilRollover' }, new Date(2026, 10, 13, 8, 0, 0));
  assert.equal(session.localDate, '2026-11-13');
  assert.equal(session.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('water ready then move uses routine command as one block', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = reduceMorning(session, { type: 'ready' }, morning(7, 0, 20));
  assert.equal(session.currentStep, 'move');
  assert.match(currentCommand(session), /movement|outside|stretch/i);
  session = reduceMorning(session, { type: 'easier' }, morning(7, 0, 21));
  assert.match(session.helpText ?? '', /sit|seated|comfortable/i);
});

test('skipping brush advances substeps without inventing chores', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = { ...session, currentStep: 'brush', currentSubstep: 0 };
  session = reduceMorning(session, { type: 'skip' }, morning(7, 10));
  assert.equal(session.currentSubstep, 1);
  assert.ok(!session.brush.some((item) => item.seconds > 180));
});

test('settle stays silent after the opening line and keeps remaining time across pause', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = { ...session, currentStep: 'settle', status: 'ACTIVE', stepElapsedAtAnchor: 0, stepAnchorMs: morning(8).getTime(), sessionAnchorMs: morning(8).getTime() };
  const spoken = shouldSpeak(session, { ...session, currentStep: 'brush' });
  assert.equal(spoken, COPY.settleGuide);
  const later = reduceMorning(session, { type: 'tick' }, morning(8, 2));
  assert.equal(shouldSpeak(later, session), null);
  const paused = reduceMorning(later, { type: 'pause' }, morning(8, 2));
  assert.equal(paused.status, 'PAUSED');
  assert.equal(paused.stepElapsedSeconds, 120);
  const resumed = reduceMorning(paused, { type: 'resume' }, morning(8, 4));
  const after = reduceMorning(resumed, { type: 'tick' }, morning(8, 4, 10));
  assert.ok(after.stepElapsedSeconds >= 129 && after.stepElapsedSeconds <= 131);
});

test('stopping settle early records actual duration and is not punished', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = {
    ...session,
    currentStep: 'settle',
    status: 'ACTIVE',
    stepElapsedAtAnchor: 90,
    stepAnchorMs: morning(8).getTime(),
    sessionAnchorMs: morning(8).getTime(),
  };
  session = reduceMorning(session, { type: 'skip' }, morning(8, 0, 10));
  assert.equal(session.status, 'PAUSED');
  assert.equal(session.settleActualSeconds, 100);
  assert.ok(session.skippedSteps.includes('settle'));
  assert.equal(session.helpText, COPY.settleStopped);
});

test('bad-day shorter path is water then first task', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = reduceMorning(session, { type: 'useShorter' }, morning(7, 1));
  assert.equal(session.shorter, true);
  assert.equal(session.currentStep, 'water');
  session = reduceMorning(session, { type: 'ready' }, morning(7, 1, 10));
  assert.equal(session.currentStep, 'task');
});

test('first task uses progressive physical actions, not a list', () => {
  let session = reduceMorning(emptyWaiting(morning(7)), { type: 'unlock', fromUserPresent: true }, morning(7));
  session = reduceMorning(session, { type: 'setFirstTask', task: fallbackFirstTask({ id: 't1', title: 'Write the morning engine' }) }, morning(7));
  session = { ...session, currentStep: 'task', status: 'ACTIVE' };
  assert.equal(currentCommand(session), COPY.fallbackFirstAction);
  session = reduceMorning(session, { type: 'ready' }, morning(7, 28));
  assert.equal(currentCommand(session), COPY.fallbackNext);
  session = reduceMorning(session, { type: 'ready' }, morning(7, 29));
  assert.equal(currentCommand(session), COPY.fallbackChoose);
});

test('clock formatting is zero-padded', () => {
  assert.equal(formatClock(780), '13:00');
  assert.equal(formatClock(5), '00:05');
});

test('missing brush array does not crash planned/remaining timers', () => {
  const now = morning(7, 20);
  const raw = {
    ...emptyWaiting(now),
    status: 'ACTIVE' as const,
    currentStep: 'brush' as const,
    currentSubstep: 0,
    brush: undefined as unknown as [],
  };
  const remaining = stepRemainingSeconds(raw as never);
  assert.ok(remaining > 0);
  const normalized = normalizeMorningSession(raw as never, now);
  assert.equal(normalized.brush.length, 2);
  const advanced = reduceMorning(raw as never, { type: 'ready' }, now);
  assert.equal(advanced.currentSubstep, 1);
});

test('currentSubstep past end is clamped', () => {
  const now = morning(7, 20);
  let session = reduceMorning(emptyWaiting(now), { type: 'unlock', fromUserPresent: true }, now);
  session = {
    ...session,
    currentStep: 'brush',
    currentSubstep: 99,
  };
  const remaining = stepRemainingSeconds(session);
  assert.ok(remaining > 0);
  const next = reduceMorning(session, { type: 'tick' }, now);
  assert.ok(next.currentSubstep < next.brush.length);
});
