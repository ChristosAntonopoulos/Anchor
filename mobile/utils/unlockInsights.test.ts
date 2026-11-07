import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildUnlockInsights,
  unlockCategoryOf,
  unlockLocalDayKey,
} from './unlockInsights.ts';
import type { PhoneUnlockEntry } from '../types/index.ts';

function entry(
  partial: Partial<PhoneUnlockEntry> & { unlockedAt: string; id: string },
): PhoneUnlockEntry {
  return {
    reason: '',
    createdAt: partial.unlockedAt,
    ...partial,
  };
}

test('categories map pay, skip, and put down separately from intentions', () => {
  assert.equal(unlockCategoryOf({ intentionCode: 'social_check' }), 'social_check');
  assert.equal(unlockCategoryOf({ intentionCode: 'pay', submissionPath: 'wallet_shortcut' } as PhoneUnlockEntry), 'pay');
  assert.equal(unlockCategoryOf({ action: 'put_down' }), 'put_down');
  assert.equal(unlockCategoryOf({ status: 'skipped', action: 'skip' }), 'skipped');
  assert.equal(unlockCategoryOf({ status: 'dismissed' }), 'unspecified');
});

test('day insights group today by category and ignore other days', () => {
  const now = new Date(2026, 10, 4, 20, 0, 0);
  const today = unlockLocalDayKey(now);
  const insights = buildUnlockInsights(
    [
      entry({
        id: '1',
        unlockedAt: new Date(2026, 10, 4, 8, 0, 0).toISOString(),
        intentionCode: 'social_check',
        unlockedDurationMs: 60_000,
      }),
      entry({
        id: '2',
        unlockedAt: new Date(2026, 10, 4, 9, 0, 0).toISOString(),
        intentionCode: 'social_check',
        unlockedDurationMs: 120_000,
      }),
      entry({
        id: '3',
        unlockedAt: new Date(2026, 10, 4, 10, 0, 0).toISOString(),
        intentionCode: 'specific_task',
        unlockedDurationMs: 30_000,
      }),
      entry({
        id: '4',
        unlockedAt: new Date(2026, 10, 3, 10, 0, 0).toISOString(),
        intentionCode: 'spotify',
      }),
    ],
    'day',
    now,
  );
  assert.equal(insights.days.length, 1);
  assert.equal(insights.days[0].key, today);
  assert.equal(insights.totalCount, 3);
  assert.equal(insights.categories[0].id, 'social_check');
  assert.equal(insights.categories[0].count, 2);
  assert.equal(insights.categories[1].id, 'specific_task');
  assert.equal(insights.averageDurationMs, 70_000);
});

test('week insights fill seven local days and keep category stacks', () => {
  const now = new Date(2026, 10, 4, 20, 0, 0);
  const insights = buildUnlockInsights(
    [
      entry({
        id: '1',
        unlockedAt: new Date(2026, 10, 4, 8, 0, 0).toISOString(),
        intentionCode: 'social_check',
      }),
      entry({
        id: '2',
        unlockedAt: new Date(2026, 10, 2, 8, 0, 0).toISOString(),
        action: 'put_down',
      }),
      entry({
        id: '3',
        unlockedAt: new Date(2026, 9, 20, 8, 0, 0).toISOString(),
        intentionCode: 'spotify',
      }),
    ],
    'week',
    now,
  );
  assert.equal(insights.days.length, 7);
  assert.equal(insights.days[6].label, 'Today');
  assert.equal(insights.totalCount, 2);
  assert.equal(insights.categories.find((item) => item.id === 'put_down')?.count, 1);
  assert.equal(
    insights.days.find((day) => day.byCategory.social_check.count === 1)?.byCategory.social_check.count,
    1,
  );
});
