import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FOCUS_PULSE_MS,
  blockHasActiveTask,
  blockWindowMs,
  buildFocusCues,
  focusWindows,
} from './focusPresence.ts';
import type { ScheduleBlock } from '../types';
import type { WorkSession } from '../types/execution';

const noon = new Date(2026, 10, 11, 12, 0, 0, 0).getTime();

function block(partial: Partial<ScheduleBlock> & Pick<ScheduleBlock, 'id' | 'title' | 'startTime' | 'endTime'>): ScheduleBlock {
  return partial;
}

test('only blocks with a task are focus windows', () => {
  assert.equal(
    blockHasActiveTask(block({ id: '1', title: 'Deep work', startTime: '12:00', endTime: '13:00', taskTitle: 'Write the brief' })),
    true
  );
  assert.equal(
    blockHasActiveTask(block({ id: '2', title: 'Lunch', startTime: '13:00', endTime: '14:00' })),
    false
  );
  assert.equal(
    blockHasActiveTask(block({ id: '3', title: 'Deep work', startTime: '12:00', endTime: '13:00', taskId: 't1', skipped: true })),
    false
  );
});

test('overnight blocks wrap past midnight', () => {
  const span = blockWindowMs({ startTime: '23:00', endTime: '01:00' }, new Date(noon));
  assert.ok(span);
  assert.equal(span.endMs - span.startMs, 2 * 60 * 60 * 1000);
});

test('start cue is at block start and pulses land every five minutes', () => {
  const startMs = new Date(2026, 10, 11, 14, 0, 0, 0).getTime();
  const cues = buildFocusCues(
    [{ id: 'block:a', label: 'Write the brief', startMs, endMs: startMs + 17 * 60 * 1000 }],
    startMs - 60_000
  );
  const starts = cues.filter((c) => c.kind === 'start');
  const pulses = cues.filter((c) => c.kind === 'pulse');
  assert.equal(starts.length, 1);
  assert.equal(starts[0].atMs, startMs);
  assert.deepEqual(
    pulses.map((c) => (c.atMs - startMs) / FOCUS_PULSE_MS),
    [1, 2, 3]
  );
});

test('past pulses are skipped when joining a block late', () => {
  const startMs = noon;
  const nowMs = startMs + 12 * 60 * 1000;
  const cues = buildFocusCues(
    [{ id: 'block:a', label: 'Write the brief', startMs, endMs: startMs + 20 * 60 * 1000 }],
    nowMs
  );
  assert.equal(cues.some((c) => c.kind === 'start'), false);
  assert.deepEqual(
    cues.filter((c) => c.kind === 'pulse').map((c) => Math.round((c.atMs - startMs) / 60000)),
    [15]
  );
});

test('a running session without a block still gets a focus window', () => {
  const session = {
    id: 's1',
    status: 'running',
    currentAction: 'Draft intro',
    taskTitle: 'Write the brief',
    timerEnabled: true,
    timerStyle: 'countdown',
    elapsedMs: 0,
    upcomingSteps: [],
    startedAt: new Date(noon).toISOString(),
    plannedMinutes: 25,
  } as WorkSession;
  const windows = focusWindows([], session, noon + 1000);
  assert.equal(windows.length, 1);
  assert.equal(windows[0].id, 'session:s1');
  assert.equal(windows[0].endMs - windows[0].startMs, 25 * 60 * 1000);
});

test('a paused session does not keep a session-only window', () => {
  const session = {
    id: 's1',
    status: 'paused',
    currentAction: 'Draft intro',
    timerEnabled: true,
    timerStyle: 'countdown',
    elapsedMs: 0,
    upcomingSteps: [],
    plannedMinutes: 25,
  } as WorkSession;
  assert.equal(focusWindows([], session, noon).length, 0);
});
