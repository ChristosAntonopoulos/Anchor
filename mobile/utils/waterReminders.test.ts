import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WATER_TARGET_GLASSES,
  buildWaterReminders,
  findWaterGlasses,
  waterLitres,
} from './waterReminders.ts';
import type { DisciplineEntry } from '../types';

test('2.5 L is ten 250 ml glasses', () => {
  assert.equal(waterLitres(0), '0.0 L');
  assert.equal(waterLitres(WATER_TARGET_GLASSES), '2.5 L');
  assert.equal(waterLitres(4), '1.0 L');
});

test('no reminders once the daily drinks target is met', () => {
  const now = new Date(2026, 10, 11, 8, 0, 0, 0);
  assert.equal(buildWaterReminders(10, now).length, 0);
});

test('only future slots are scheduled, capped by glasses still needed', () => {
  const now = new Date(2026, 10, 11, 16, 0, 0, 0);
  const cues = buildWaterReminders(0, now);
  assert.deepEqual(
    cues.map((c) => `${c.at.getHours()}:${String(c.at.getMinutes()).padStart(2, '0')}`),
    ['17:00', '18:30', '20:00']
  );
  assert.equal(cues[0].glassNumber, 1);
});

test('already-logged glasses reduce how many pings remain', () => {
  const now = new Date(2026, 10, 11, 7, 0, 0, 0);
  const cues = buildWaterReminders(8, now);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].glassNumber, 9);
  assert.equal(cues[1].glassNumber, 10);
});

test('reads glasses from the water counter', () => {
  const discipline = {
    date: '2026-11-11',
    blocks: [
      {
        blockId: '75Hard',
        blockName: '75 Hard',
        items: [{ itemId: 'WaterGlasses', itemName: 'Water', type: 'counter', counterValue: 3 }],
      },
    ],
  } as DisciplineEntry;
  assert.equal(findWaterGlasses(discipline), 3);
});
