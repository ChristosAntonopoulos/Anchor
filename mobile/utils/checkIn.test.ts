import assert from 'node:assert/strict';
import test from 'node:test';
import {
  confirmedFeelings,
  entryPreview,
  entryTitle,
  formatFeeling,
  groupActivityPlans,
  historyKind,
  looksLikeImmediateDanger,
  type CheckInLike,
  type PlanLike,
} from './checkIn.ts';

function entry(partial: Partial<CheckInLike>): CheckInLike {
  return {
    text: '',
    schemaVersion: 2,
    recordState: 'saved',
    ...partial,
  };
}

test('preserves original wording in the preview', () => {
  const text = 'I never follow through.';
  assert.equal(entryPreview(entry({ text })), text);
});

test('does not remap a legacy mood string', () => {
  const legacy = entry({
    schemaVersion: 1,
    mood: 'anxious-about-work',
    moodIntensity: 8,
    text: 'Old journal',
  });
  const feelings = confirmedFeelings(legacy);
  assert.equal(feelings[0]?.customLabel, 'anxious-about-work');
  assert.equal(feelings[0]?.code, undefined);
  assert.equal(historyKind(legacy), 'legacy');
});

test('keeps missing intensity missing instead of showing /10', () => {
  assert.equal(formatFeeling({ code: 'anxious' }), 'Anxious');
  assert.equal(formatFeeling({ code: 'anxious', intensity: 7 }), 'Anxious, 7/10');
});

test('drafts stay drafts and history titles prefer the user title', () => {
  const draft = entry({ recordState: 'draft', title: 'Application', text: 'Longer body' });
  assert.equal(historyKind(draft), 'draft');
  assert.equal(entryTitle(draft), 'Application');
});

test('groups plans without treating a scheduled time as an attempt', () => {
  const groups = groupActivityPlans([
    { id: 'a', title: 'Open the document', isCompleted: false, createdAt: '', lifecycle: 'planned', scheduledDate: '2026-11-01T12:00:00.000Z' },
    { id: 'b', title: 'Step outside', isCompleted: false, createdAt: '', lifecycle: 'in_progress' },
    { id: 'c', title: 'Wrote one sentence', isCompleted: true, createdAt: '', lifecycle: 'completed' },
  ] as PlanLike[]);
  assert.deepEqual(groups.ready.map((item) => item.id), ['b']);
  assert.deepEqual(groups.planned.map((item) => item.id), ['a']);
  assert.deepEqual(groups.previously.map((item) => item.id), ['c']);
});

test('crisis detection stays narrow and does not fire on ordinary worry', () => {
  assert.equal(looksLikeImmediateDanger('I keep thinking I will mess this up'), false);
  assert.equal(looksLikeImmediateDanger('I want to die'), true);
});
