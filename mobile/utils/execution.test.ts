import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SESSION_MINUTES,
  formatElapsed,
  looksSimpleTask,
  remainingMs,
  resolveSessionMinutes,
} from './execution.ts';

test('session minutes remember the last explicit choice and default to five', () => {
  assert.equal(resolveSessionMinutes(), DEFAULT_SESSION_MINUTES);
  assert.equal(resolveSessionMinutes(undefined, 15), 15);
  assert.equal(resolveSessionMinutes(2, 15), 2);
});

test('simple tasks stay as one action', () => {
  assert.equal(looksSimpleTask('Call dentist'), true);
  assert.equal(looksSimpleTask('Drink water'), true);
  assert.equal(looksSimpleTask('Prepare client presentation'), false);
  assert.equal(looksSimpleTask('Call dentist', 'Ask about the crown'), false);
});

test('timer remaining never auto-extends', () => {
  assert.equal(remainingMs(5, 5 * 60_000), 0);
  assert.equal(remainingMs(5, 6 * 60_000), 0);
  assert.equal(formatElapsed(90_000), '1:30');
});
