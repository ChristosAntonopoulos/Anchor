import assert from 'node:assert/strict';
import test from 'node:test';
import {
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

test('planned durations total exactly 30 minutes', () => {
  assert.equal(
    STEP_ORDER.reduce((sum, id) => sum + STEP_SECONDS[id], 0),
    NIGHT_TOTAL_SECONDS
  );
  assert.equal(timeBudgetOk(), true);
  assert.equal(STEP_SECONDS.breathe, 180);
});

test('unlock before 21:30 does not activate', () => {
  const now = night(21, 29);
  const waiting = emptyWaiting(now);
  const next = reduceNight(waiting, { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(next.status, 'NOT_DUE');
  assert.equal(isAtOrAfterTrigger(now), false);
});

test('first unlock at 21:30 activates once', () => {
  const now = night(21, 30);
  const session = reduceNight(emptyWaiting(now), { type: 'unlock', fromUserPresent: true }, now);
  assert.equal(session.status, 'ACTIVE');
  assert.equal(session.currentStep, 'screens');
  assert.equal(
    currentCommand(session),
    'Dim lights. Close feeds and chats. Lower brightness. Phone face-down.'
  );
  const again = reduceNight(session, { type: 'unlock', fromUserPresent: true }, night(21, 50));
  assert.equal(again.status, 'ACTIVE');
  assert.equal(again.id, session.id);
});

test('unlock that is not USER_PRESENT is ignored', () => {
  const now = night(21, 45);
  const next = reduceNight(emptyWaiting(now), { type: 'unlock', fromUserPresent: false }, now);
  assert.equal(next.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('late first unlock at 22:05 still starts the routine', () => {
  const session = reduceNight(emptyWaiting(night(22, 5)), { type: 'unlock', fromUserPresent: true }, night(22, 5));
  assert.equal(session.status, 'ACTIVE');
  assert.equal(localDateKey(night(22, 5)), '2026-11-12');
});

test('completed routine does not activate again the same day', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = reduceNight(session, { type: 'endEarly' }, night(21, 31));
  session = reduceNight(session, { type: 'confirmEnd' }, night(21, 31));
  assert.equal(session.status, 'ENDED_EARLY');
  const again = reduceNight(session, { type: 'unlock', fromUserPresent: true }, night(23));
  assert.equal(again.status, 'ENDED_EARLY');
});

test('new local date resets after completion', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = reduceNight(session, { type: 'confirmEnd' }, night(21, 30));
  session = reduceNight({ ...session, status: 'COMPLETED', localDate: '2026-11-12' }, { type: 'civilRollover' }, new Date(2026, 10, 13, 21, 30, 0));
  assert.equal(session.localDate, '2026-11-13');
  assert.equal(session.status, 'WAITING_FOR_FIRST_UNLOCK');
});

test('screens ready then substeps stay one at a time', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = reduceNight(session, { type: 'ready' }, night(21, 30, 20));
  assert.equal(session.currentStep, 'screens');
  assert.equal(session.currentSubstep, 1);
  assert.equal(currentCommand(session), 'Close feeds and social.');
  session = reduceNight(session, { type: 'easier' }, night(21, 30, 21));
  assert.equal(currentCommand(session), 'Close just the feeds.');
});

test('skipping read goes to brush', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = { ...session, currentStep: 'read', currentSubstep: 0 };
  session = reduceNight(session, { type: 'skip' }, night(21, 40));
  assert.equal(session.currentStep, 'brush');
});

test('breathe stays silent after the opening line and keeps remaining time across pause', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = { ...session, currentStep: 'breathe', status: 'ACTIVE', stepElapsedAtAnchor: 0, stepAnchorMs: night(22).getTime(), sessionAnchorMs: night(22).getTime() };
  const spoken = shouldSpeak(session, { ...session, currentStep: 'brush' });
  assert.equal(spoken, COPY.breatheGuide);
  const later = reduceNight(session, { type: 'tick' }, night(22, 1));
  assert.equal(shouldSpeak(later, session), null);
  const paused = reduceNight(later, { type: 'pause' }, night(22, 1));
  assert.equal(paused.status, 'PAUSED');
  assert.equal(paused.stepElapsedSeconds, 60);
  const resumed = reduceNight(paused, { type: 'resume' }, night(22, 2));
  const after = reduceNight(resumed, { type: 'tick' }, night(22, 2, 10));
  assert.ok(after.stepElapsedSeconds >= 69 && after.stepElapsedSeconds <= 71);
});

test('stopping breathe early records actual duration and is not punished', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = {
    ...session,
    currentStep: 'breathe',
    status: 'ACTIVE',
    stepElapsedAtAnchor: 90,
    stepAnchorMs: night(22).getTime(),
    sessionAnchorMs: night(22).getTime(),
  };
  session = reduceNight(session, { type: 'skip' }, night(22, 0, 10));
  assert.equal(session.status, 'PAUSED');
  assert.equal(session.breatheActualSeconds, 100);
  assert.ok(session.skippedSteps.includes('breathe'));
  assert.equal(session.helpText, COPY.breatheStopped);
});

test('bad-day shorter path is screens then breathe then close', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = reduceNight(session, { type: 'useShorter' }, night(21, 31));
  assert.equal(session.shorter, true);
  assert.equal(session.currentStep, 'screens');
  // finish screens substeps quickly via skip through remaining
  while (session.currentStep === 'screens') {
    session = reduceNight(session, { type: 'skip' }, night(21, 32));
  }
  assert.equal(session.currentStep, 'breathe');
  session = { ...session, chimePlayed: true, stepElapsedAtAnchor: STEP_SECONDS.breathe, stepElapsedSeconds: STEP_SECONDS.breathe };
  session = reduceNight(session, { type: 'ready' }, night(21, 35));
  assert.equal(session.currentStep, 'close');
});

test('close uses progressive physical actions, not a list', () => {
  let session = reduceNight(emptyWaiting(night(21, 30)), { type: 'unlock', fromUserPresent: true }, night(21, 30));
  session = reduceNight(session, { type: 'setTomorrowPlan', plan: fallbackTomorrowPlan({ id: 't1', title: 'Ship the night engine' }) }, night(21, 30));
  session = { ...session, currentStep: 'close', status: 'ACTIVE' };
  assert.equal(currentCommand(session), COPY.fallbackFirstAction);
  session = reduceNight(session, { type: 'ready' }, night(21, 50));
  assert.equal(currentCommand(session), COPY.fallbackNext);
  session = reduceNight(session, { type: 'ready' }, night(21, 51));
  assert.equal(currentCommand(session), COPY.fallbackChoose);
});

test('clock formatting is zero-padded', () => {
  assert.equal(formatClock(780), '13:00');
  assert.equal(formatClock(5), '00:05');
});
