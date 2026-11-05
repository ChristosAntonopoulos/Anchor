import assert from 'node:assert/strict';
import test from 'node:test';
import { CURRENT_WORK_SENTINEL } from '../constants/work.ts';
import { currentWorkStep, resolveWorkBlock, workPath } from './workBlock.ts';
import type { ScheduleBlock } from '../types/index.ts';

function block(partial: Partial<ScheduleBlock> & Pick<ScheduleBlock, 'id' | 'title'>): ScheduleBlock {
  return {
    startTime: '09:00',
    endTime: '11:00',
    ...partial,
  };
}

test('work path uses current when id is missing', () => {
  assert.equal(workPath(), `/work/${CURRENT_WORK_SENTINEL}`);
  assert.equal(workPath('  '), `/work/${CURRENT_WORK_SENTINEL}`);
  assert.equal(workPath('deep-1'), '/work/deep-1');
});

test('resolve work block prefers schedule match then current', () => {
  const current = block({ id: 'now', title: 'Deep work' });
  const later = block({ id: 'later', title: 'Admin' });
  assert.equal(resolveWorkBlock('current', current, [current, later])?.title, 'Deep work');
  assert.equal(resolveWorkBlock('later', current, [current, later])?.title, 'Admin');
  assert.equal(resolveWorkBlock('missing', current, [later]), null);
  assert.equal(resolveWorkBlock('now', current, [later])?.id, 'now');
});

test('current work step is the first incomplete checklist item', () => {
  const done = block({
    id: 'now',
    title: 'Deep work',
    checklistItems: [
      { id: 'a', title: 'Outline', durationMinutes: 10, completed: true, order: 1 },
      { id: 'b', title: 'Draft', durationMinutes: 20, completed: false, order: 2 },
    ],
  });
  assert.equal(currentWorkStep(done)?.title, 'Draft');
  assert.equal(currentWorkStep(block({ id: 'empty', title: 'Empty' })), null);
});
