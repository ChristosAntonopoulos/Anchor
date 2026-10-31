import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LEGACY_MESSAGE,
  LEGACY_NO_REASON,
  LEGACY_TASK,
  PHONE_UNLOCK_NOTE_MAX_LENGTH,
  analysisIntentionCode,
  displayUnlockHeadline,
  fieldsForUnlockChoice,
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

test('all six intention codes stay distinct', () => {
  const codes = [
    'specific_task',
    'connection',
    'intentional_break',
    'automatic_check',
    'unsure',
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
      intention: 'unsure',
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

test('legacy No reason is not an automatic check', () => {
  assert.equal(analysisIntentionCode(LEGACY_TASK, null, 1), 'specific_task');
  assert.equal(analysisIntentionCode(LEGACY_MESSAGE, null, 1), 'connection');
  assert.equal(analysisIntentionCode(LEGACY_NO_REASON, null, 1), null);
  assert.equal(analysisIntentionCode(LEGACY_NO_REASON, null, 2), null);
  assert.equal(displayUnlockHeadline({ reason: LEGACY_NO_REASON, schemaVersion: 1 }), LEGACY_NO_REASON);
  assert.notEqual(
    displayUnlockHeadline({ reason: LEGACY_NO_REASON, schemaVersion: 1 }),
    'Automatic check',
  );
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
    displayUnlockHeadline({ schemaVersion: 2, status: 'skipped', action: 'skip' }),
    'Skipped for now',
  );
  assert.equal(
    displayUnlockHeadline({ schemaVersion: 2, status: 'interrupted' }),
    'Interrupted',
  );
  assert.equal(
    displayUnlockHeadline({ schemaVersion: 2, status: 'dismissed' }),
    'Dismissed',
  );
  assert.equal(analysisIntentionCode(null, null, 2), null);
});
