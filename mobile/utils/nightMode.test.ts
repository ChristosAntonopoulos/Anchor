import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BREATHE_SUBSTEPS,
  COPY,
  NIGHT_TOTAL_SECONDS,
  STEP_ORDER,
  STEP_SECONDS,
  currentCommand,
  emptyWaiting,
  fallbackTomorrowPlan,
  formatClock,
  isAtOrAfterTrigger,
  localDateKey,
  reduceNight,
  shouldSpeak,
  timeBudgetOk,
} from './nightMode.ts';

const night = (h: number, m = 0, s = 0) => new Date(2026, 10, 12, h, m, s, 0);

test('planned durations total exactly 30 minutes including breathe close', () => {
  assert.equal(
    STEP_SECONDS.dim +
      STEP_SECONDS.screens +
      STEP_SECONDS.prepare +
      STEP_SECONDS.settle +
      STEP_SECONDS.breathe +
      STEP_SECONDS.close,
    NIGHT_TOTAL_SECONDS
  );
  assert.equal(timeBudgetOk(), true);
  assert.equal(STEP_SECONDS.breathe, 180);
  assert.equal(BREATHE_SUBSTEPS.reduce((sum, step) => sum + step.seconds, 0), STEP_SECONDS.breathe);
  assert.deepEqual(STEP_ORDER, ['dim', 'screens', 'prepare', 'settle', 'breathe', 'close']);
});

test('unlock before 22:00 does not activate', () => {
  const now = night(21, 59);
  const waiting = emptyWaiting(now);
  const next = reduceNight(waiting, { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(next.status, 'NOT_DUE');
  assert.equal(isAtOrAfterTrigger(now), false);
});

test('first unlock at 22:00 activates once', () => {
  const now = night(22, 0);
  const session = reduceNight(emptyWaiting(now), { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.currentStep, 'dim');
  assert.equal(currentCommand(session), COPY.dim);
  const again = reduceNight(session, { type: 'unlock', fromUserPresent: true }, night(22, 35));
  assert.equal(again.status, 'ACTIVE');
  assert.equal(again.id, session.id);
});

test('unlock that is not USER_PRESENT is ignored', () => {
  const now = night(22, 30);
  const next = reduceNight(emptyWaiting(now), { type: 'unlock', fromUserPresent: false }, now);
  assert.equal(next.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('late first unlock at 22:35 still starts the routine', () => {
  const session = reduceNight(emptyWaiting(night(22, 35)), { type: 'unlock', fromUserPresent: true }, night(22, 35));
  assert.equal(session.status, 'ACTIVE');
  assert.equal(localDateKey(night(22, 35)), '2026-11-12');
});

test('completed routine does not activate again the same day', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = reduceNight(session, { type: 'endEarly' }, night(22, 1));
  session = reduceNight(session, { type: 'confirmEnd' }, night(22, 1));
  assert.equal(session.status, 'ENDED_EARLY');
  const again = reduceNight(session, { type: 'unlock', fromUserPresent: true }, night(23));
  assert.equal(again.status, 'ENDED_EARLY');
});

test('new local date resets after completion', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = reduceNight(session, { type: 'confirmEnd' }, night(22));
  session = reduceNight({ ...session, status: 'COMPLETED', localDate: '2026-11-12' }, { type: 'civilRollover' }, new Date(2026, 10, 13, 22, 0, 0));
  assert.equal(session.localDate, '2026-11-13');
  assert.equal(session.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('dim ready then screen commands stay one at a time', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = reduceNight(session, { type: 'ready' }, night(22, 0, 20));
  assert.equal(session.currentStep, 'screens');
  assert.equal(currentCommand(session), 'Close feeds and social.');
  session = reduceNight(session, { type: 'easier' }, night(22, 0, 21));
  assert.equal(currentCommand(session), 'Close just the feeds.');
});

test('settle then breathe then close', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = {
    ...session,
    currentStep: 'settle',
    status: 'ACTIVE',
    chimePlayed: true,
    stepElapsedAtAnchor: STEP_SECONDS.settle,
    stepAnchorMs: night(23).getTime(),
    sessionAnchorMs: night(23).getTime(),
  };
  session = reduceNight(session, { type: 'ready' }, night(23, 0, 1));
  assert.equal(session.currentStep, 'breathe');
  assert.equal(currentCommand(session), BREATHE_SUBSTEPS[0].command);
  session = reduceNight(session, { type: 'ready' }, night(23, 0, 2));
  assert.equal(session.currentSubstep, 1);
  assert.equal(currentCommand(session), BREATHE_SUBSTEPS[1].command);
  session = reduceNight(session, { type: 'ready' }, night(23, 0, 3));
  assert.equal(session.currentSubstep, 2);
  session = reduceNight(session, { type: 'ready' }, night(23, 0, 4));
  assert.equal(session.currentStep, 'close');
});

test('settle stays silent after the opening line and keeps remaining time across pause', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = { ...session, currentStep: 'settle', status: 'ACTIVE', stepElapsedAtAnchor: 0, stepAnchorMs: night(23).getTime(), sessionAnchorMs: night(23).getTime() };
  const spoken = shouldSpeak(session, { ...session, currentStep: 'prepare' });
  assert.equal(spoken, COPY.settleGuide);
  const later = reduceNight(session, { type: 'tick' }, night(23, 2));
  assert.equal(shouldSpeak(later, session), null);
  const paused = reduceNight(later, { type: 'pause' }, night(23, 2));
  assert.equal(paused.status, 'PAUSED');
  assert.equal(paused.stepElapsedSeconds, 120);
  const resumed = reduceNight(paused, { type: 'resume' }, night(23, 4));
  const after = reduceNight(resumed, { type: 'tick' }, night(23, 4, 10));
  assert.ok(after.stepElapsedSeconds >= 129 && after.stepElapsedSeconds <= 131);
});

test('stopping settle early records actual duration and is not punished', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = {
    ...session,
    currentStep: 'settle',
    status: 'ACTIVE',
    stepElapsedAtAnchor: 90,
    stepAnchorMs: night(23).getTime(),
    sessionAnchorMs: night(23).getTime(),
  };
  session = reduceNight(session, { type: 'skip' }, night(23, 0, 10));
  assert.equal(session.status, 'PAUSED');
  assert.equal(session.settleActualSeconds, 100);
  assert.ok(session.skippedSteps.includes('settle'));
  assert.equal(session.helpText, COPY.settleStopped);
});

test('close uses progressive physical actions, not a list', () => {
  let session = reduceNight(emptyWaiting(night(22)), { type: 'unlock', fromUserPresent: true }, night(22));
  session = reduceNight(session, { type: 'setTomorrowPlan', plan: fallbackTomorrowPlan({ id: 't1', title: 'Ship the night engine' }) }, night(22));
  session = { ...session, currentStep: 'close', status: 'ACTIVE' };
  assert.equal(currentCommand(session), COPY.fallbackFirstAction);
  session = reduceNight(session, { type: 'ready' }, night(22, 28));
  assert.equal(currentCommand(session), COPY.fallbackNext);
  session = reduceNight(session, { type: 'ready' }, night(22, 29));
  assert.equal(currentCommand(session), COPY.fallbackChoose);
});

test('clock formatting is zero-padded', () => {
  assert.equal(formatClock(780), '13:00');
  assert.equal(formatClock(5), '00:05');
});
