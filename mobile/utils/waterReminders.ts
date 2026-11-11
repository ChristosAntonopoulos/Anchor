import type { DisciplineEntry } from '../types';

/** 250 ml is one glass. Ten glasses is 2.5 L of drinks. */
export const WATER_GLASS_ML = 250;
export const WATER_TARGET_GLASSES = 10;
export const WATER_ITEM_ID = 'WaterGlasses';
export const WATER_LEGACY_ITEM_ID = 'GallonWater';

/** Sip through waking hours; last ping 20:00 so sleep is not wrecked. */
export const WATER_REMINDER_HOURS: Array<[number, number]> = [
  [8, 0],
  [9, 30],
  [11, 0],
  [12, 30],
  [14, 0],
  [15, 30],
  [17, 0],
  [18, 30],
  [20, 0],
];

export function waterLitres(glasses: number): string {
  return `${((Math.max(0, glasses) * WATER_GLASS_ML) / 1000).toFixed(1)} L`;
}

export function findWaterGlasses(discipline: DisciplineEntry | null | undefined): number {
  if (!discipline) return 0;
  for (const block of discipline.blocks) {
    for (const item of block.items) {
      if (item.itemId === WATER_ITEM_ID || item.itemId === WATER_LEGACY_ITEM_ID) {
        if (item.type === 'counter') return item.counterValue ?? 0;
        return item.toggleValue ? WATER_TARGET_GLASSES : 0;
      }
    }
  }
  return 0;
}

export function findWaterItem(
  discipline: DisciplineEntry | null | undefined
): { blockId: string; itemId: string; glasses: number } | null {
  if (!discipline) return null;
  for (const block of discipline.blocks) {
    for (const item of block.items) {
      if (item.itemId === WATER_ITEM_ID || item.itemId === WATER_LEGACY_ITEM_ID) {
        const glasses = item.type === 'counter' ? item.counterValue ?? 0 : item.toggleValue ? WATER_TARGET_GLASSES : 0;
        return { blockId: block.blockId, itemId: item.itemId, glasses };
      }
    }
  }
  return null;
}

export interface WaterReminder {
  at: Date;
  glassNumber: number;
  remaining: number;
}

export function buildWaterReminders(glasses: number, now: Date): WaterReminder[] {
  const remaining = WATER_TARGET_GLASSES - Math.max(0, glasses);
  if (remaining <= 0) return [];

  const slots: Date[] = [];
  for (const [hour, minute] of WATER_REMINDER_HOURS) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    if (at.getTime() > now.getTime() + 15_000) {
      slots.push(at);
    }
  }

  return slots.slice(0, remaining).map((at, index) => ({
    at,
    glassNumber: glasses + index + 1,
    remaining: remaining - index,
  }));
}
