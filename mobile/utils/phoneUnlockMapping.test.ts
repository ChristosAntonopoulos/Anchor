import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PHONE_UNLOCK_NOTE_MAX_LENGTH,
  displayUnlockHeadline,
  fieldsForUnlockChoice,
  intentionLabel,
  formatCurrentBlockLine,
  formatUnlockedDuration,
  needsUnlockPause,
  summarizeUnlockEntries,
  noteCopyForIntention,
  sanitizeUnlockNote,
} from './phoneUnlockMapping.ts';

test('quick intention choice keeps the stable code and continue action', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: false,
    contextExpanded: false,
    intention: 'specific_task',
    trigger: 'notification',
    feeling: 'calm',
    note: 'should not save',
    action: 'continue',
    status: 'answered',
    path: 'quick_choice',
    putDownExecution: null,
  });
  assert.equal(result.intentionCode, 'specific_task');
  assert.equal(result.action, 'continue');
  assert.equal(result.triggerCode, null);
  assert.equal(result.feelingCode, null);
  assert.equal(result.note, null);
  assert.equal(result.submissionPath, 'quick_choice');
});

test('choice intention codes stay distinct', () => {
  const codes = [
    'specific_task',
    'connection',
    'intentional_break',
    'social_check',
    'automatic_check',
    'spotify',
    'other',
  ];
  for (const code of codes) {
    const result = fieldsForUnlockChoice({
      skip: false,
      keepContext: false,
      contextExpanded: false,
      intention: code,
      trigger: null,
      feeling: null,
      note: null,
      action: 'continue',
      status: 'answered',
      path: 'quick_choice',
      putDownExecution: null,
    });
    assert.equal(result.intentionCode, code);
  }
  assert.notEqual(
    fieldsForUnlockChoice({
      skip: false,
      keepContext: false,
      contextExpanded: false,
      intention: 'spotify',
      trigger: null,
      feeling: null,
      note: null,
      action: 'continue',
      status: 'answered',
      path: 'quick_choice',
      putDownExecution: null,
    }).intentionCode,
    'other',
  );
});

test('lock-screen wallet still stores pay without being a choice', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: false,
    contextExpanded: false,
    intention: 'pay',
    trigger: null,
    feeling: null,
    note: null,
    action: 'continue',
    status: 'answered',
    path: 'wallet_shortcut',
    putDownExecution: null,
  });
  assert.equal(result.intentionCode, 'pay');
  assert.equal(result.action, 'continue');
  assert.equal(result.submissionPath, 'wallet_shortcut');
  assert.equal(intentionLabel('pay'), 'Pay');
  assert.equal(displayUnlockHeadline({ intentionCode: 'pay' }), 'Pay');
});

test('put phone down without an intention leaves intention null', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: false,
    contextExpanded: false,
    intention: null,
    trigger: null,
    feeling: null,
    note: null,
    action: 'put_down',
    status: 'answered',
    path: 'direct_action',
    putDownExecution: 'overlay_dismissed',
  });
  assert.equal(result.action, 'put_down');
  assert.equal(result.intentionCode, null);
  assert.equal(result.putDownExecution, 'overlay_dismissed');
});

test('skip stores a skipped outcome and discards unsubmitted context', () => {
  const result = fieldsForUnlockChoice({
    skip: true,
    keepContext: false,
    contextExpanded: true,
    intention: 'automatic_check',
    trigger: 'boredom_waiting',
    feeling: 'restless',
    note: 'private thought',
    action: 'skip',
    status: 'skipped',
    path: 'direct_action',
    putDownExecution: null,
  });
  assert.equal(result.status, 'skipped');
  assert.equal(result.action, 'skip');
  assert.equal(result.intentionCode, null);
  assert.equal(result.triggerCode, null);
  assert.equal(result.feelingCode, null);
  assert.equal(result.note, null);
});

test('expanded continue can save blank fields', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: true,
    contextExpanded: true,
    intention: null,
    trigger: null,
    feeling: null,
    note: '   ',
    action: 'continue',
    status: 'answered',
    path: 'context_form',
    putDownExecution: null,
  });
  assert.equal(result.status, 'answered');
  assert.equal(result.action, 'continue');
  assert.equal(result.intentionCode, null);
  assert.equal(result.triggerCode, null);
  assert.equal(result.feelingCode, null);
  assert.equal(result.note, null);
  assert.equal(result.contextExpanded, true);
});

test('trigger and feeling stay independent from intention', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: true,
    contextExpanded: true,
    intention: 'connection',
    trigger: 'notification',
    feeling: 'lonely',
    note: null,
    action: 'continue',
    status: 'answered',
    path: 'context_form',
    putDownExecution: null,
  });
  assert.equal(result.intentionCode, 'connection');
  assert.equal(result.triggerCode, 'notification');
  assert.equal(result.feelingCode, 'lonely');
});

test('notes are capped at 200 characters', () => {
  const note = 'x'.repeat(PHONE_UNLOCK_NOTE_MAX_LENGTH + 40);
  assert.equal(sanitizeUnlockNote(note)?.length, PHONE_UNLOCK_NOTE_MAX_LENGTH);
});

test('note copy changes with intention and does not require text for other', () => {
  assert.equal(noteCopyForIntention('specific_task').placeholder.includes('electricity'), true);
  assert.equal(noteCopyForIntention('other').placeholder, 'Optional');
  assert.equal(noteCopyForIntention(null).label, 'Anything you want to remember?');
});

test('changing intention copy leaves existing note text untouched', () => {
  const entered = 'Pay the electricity bill';
  noteCopyForIntention('connection');
  noteCopyForIntention('other');
  assert.equal(entered, 'Pay the electricity bill');
});

test('system dismissal discards unsubmitted context and is not skip', () => {
  const result = fieldsForUnlockChoice({
    skip: false,
    keepContext: true,
    contextExpanded: true,
    intention: 'specific_task',
    trigger: 'notification',
    feeling: 'calm',
    note: 'unsubmitted',
    action: null,
    status: 'dismissed',
    path: null,
    putDownExecution: null,
  });
  assert.equal(result.status, 'dismissed');
  assert.equal(result.action, null);
  assert.equal(result.intentionCode, null);
  assert.equal(result.note, null);
});

test('skipped and interrupted outcomes stay distinct from automatic check', () => {
  assert.equal(
    displayUnlockHeadline({ status: 'skipped', action: 'skip' }),
    'Skipped for now',
  );
  assert.equal(
    displayUnlockHeadline({ status: 'interrupted' }),
    'Interrupted',
  );
  assert.equal(
    displayUnlockHeadline({ status: 'dismissed' }),
    'Dismissed',
  );
  assert.equal(displayUnlockHeadline({}), 'No intention reported');
});

test('social check and automatic check need a three-second pause', () => {
  assert.equal(needsUnlockPause('social_check'), true);
  assert.equal(needsUnlockPause('automatic_check'), true);
  assert.equal(needsUnlockPause('specific_task'), false);
  assert.equal(needsUnlockPause('pay'), false);
});

test('current block line keeps title and time and hides empty blocks', () => {
  assert.deepEqual(formatCurrentBlockLine({ title: 'Deep work', startTime: '09:00', endTime: '11:00' }), {
    title: 'Deep work',
    time: '09:00 – 11:00',
    items: [],
  });
  assert.equal(formatCurrentBlockLine({ title: '   ' }), null);
});

test('current block line prefers checklist items then routine activities', () => {
  assert.deepEqual(
    formatCurrentBlockLine({
      title: 'Morning routine',
      startTime: '07:00',
      endTime: '08:00',
      checklistItems: [
        { title: 'Drink water', completed: true, order: 1 },
        { title: 'Brush teeth', completed: false, order: 2 },
      ],
      routineActivities: ['Ignored'],
    })?.items,
    [
      { title: 'Drink water', completed: true },
      { title: 'Brush teeth', completed: false },
    ],
  );
  assert.deepEqual(
    formatCurrentBlockLine({
      title: 'Evening',
      routineActivities: ['Read a book', 'Brush teeth'],
    })?.items.map((item) => item.title),
    ['Read a book', 'Brush teeth'],
  );
});

test('unlock duration formats compactly and summary uses the most common intention', () => {
  assert.equal(formatUnlockedDuration(12_000), '12s');
  assert.equal(formatUnlockedDuration(4 * 60 * 1000), '4m');
  assert.equal(formatUnlockedDuration(75 * 60 * 1000), '1h 15m');
  const summary = summarizeUnlockEntries(
    [
      { unlockedAt: '2026-11-04T08:00:00.000Z', unlockedDurationMs: 60_000, intentionCode: 'spotify' },
      { unlockedAt: '2026-11-04T09:00:00.000Z', unlockedDurationMs: 180_000, intentionCode: 'spotify' },
      { unlockedAt: '2026-11-04T10:00:00.000Z', unlockedDurationMs: 120_000, intentionCode: 'social_check' },
    ],
    new Date('2026-11-04T12:00:00.000Z'),
  );
  assert.equal(summary.todayCount, 3);
  assert.equal(summary.mostCommonIntention, 'spotify');
  assert.equal(summary.averageDurationMs, 120_000);
});
