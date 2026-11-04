import {
  UNLOCK_COPY,
  formatUnlockedDuration,
  intentionLabel,
} from './phoneUnlockMapping';
import type { PhoneUnlockEntry } from '../types';

export type UnlockPeriod = 'day' | 'week';

export type UnlockCategoryId =
  | 'specific_task'
  | 'connection'
  | 'intentional_break'
  | 'social_check'
  | 'automatic_check'
  | 'spotify'
  | 'pay'
  | 'other'
  | 'put_down'
  | 'skipped'
  | 'unspecified';

export const UNLOCK_CATEGORY_ORDER: UnlockCategoryId[] = [
  'specific_task',
  'connection',
  'intentional_break',
  'social_check',
  'automatic_check',
  'spotify',
  'pay',
  'other',
  'put_down',
  'skipped',
  'unspecified',
];

export const UNLOCK_CATEGORY_COLORS: Record<UnlockCategoryId, string> = {
  specific_task: '#00D9FF',
  connection: '#F472B6',
  intentional_break: '#FFB84D',
  social_check: '#A78BFA',
  automatic_check: '#8B95A6',
  spotify: '#C7E5CD',
  pay: '#E7C47B',
  other: '#6EE7B7',
  put_down: '#316F5F',
  skipped: '#5B6B7C',
  unspecified: '#3A4451',
};

export interface UnlockCategoryStats {
  id: UnlockCategoryId;
  label: string;
  color: string;
  count: number;
  durationMs: number;
  share: number;
}

export interface UnlockDayBucket {
  key: string;
  label: string;
  weekday: string;
  count: number;
  durationMs: number;
  byCategory: Record<UnlockCategoryId, { count: number; durationMs: number }>;
}

export interface UnlockInsights {
  period: UnlockPeriod;
  totalCount: number;
  totalDurationMs: number;
  averageDurationMs: number | null;
  categories: UnlockCategoryStats[];
  days: UnlockDayBucket[];
}

export function unlockLocalDayKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return localKeyFromDate(date);
}

function localKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function unlockCategoryOf(entry: {
  intentionCode?: string | null;
  status?: string | null;
  action?: string | null;
}): UnlockCategoryId {
  if (entry.action === 'put_down') {
    return 'put_down';
  }
  if (entry.status === 'skipped' || entry.action === 'skip') {
    return 'skipped';
  }
  const code = entry.intentionCode;
  if (code && (UNLOCK_CATEGORY_ORDER as string[]).includes(code)) {
    return code as UnlockCategoryId;
  }
  return 'unspecified';
}

export function unlockCategoryLabel(id: UnlockCategoryId): string {
  if (id === 'put_down') {
    return UNLOCK_COPY.putPhoneDown;
  }
  if (id === 'skipped') {
    return UNLOCK_COPY.skipped;
  }
  if (id === 'unspecified') {
    return UNLOCK_COPY.noIntention;
  }
  return intentionLabel(id) ?? id;
}

function emptyByCategory(): Record<UnlockCategoryId, { count: number; durationMs: number }> {
  return UNLOCK_CATEGORY_ORDER.reduce(
    (acc, id) => {
      acc[id] = { count: 0, durationMs: 0 };
      return acc;
    },
    {} as Record<UnlockCategoryId, { count: number; durationMs: number }>,
  );
}

function weekdayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}

function dayLabel(date: Date, today: Date): string {
  if (localKeyFromDate(date) === localKeyFromDate(today)) {
    return 'Today';
  }
  return weekdayLabel(date);
}

export function buildUnlockInsights(
  entries: PhoneUnlockEntry[],
  period: UnlockPeriod,
  now: Date = new Date(),
): UnlockInsights {
  const today = startOfLocalDay(now);
  const start = period === 'day' ? today : addDays(today, -6);
  const startKey = localKeyFromDate(start);
  const endKey = localKeyFromDate(today);

  const days: UnlockDayBucket[] = [];
  const dayCount = period === 'day' ? 1 : 7;
  for (let i = 0; i < dayCount; i += 1) {
    const date = addDays(start, i);
    days.push({
      key: localKeyFromDate(date),
      label: dayLabel(date, today),
      weekday: weekdayLabel(date),
      count: 0,
      durationMs: 0,
      byCategory: emptyByCategory(),
    });
  }
  const byKey = new Map(days.map((day) => [day.key, day]));
  const totals = emptyByCategory();
  let totalCount = 0;
  let totalDurationMs = 0;
  const durations: number[] = [];

  for (const entry of entries) {
    const key = localKeyFromDate(new Date(entry.unlockedAt));
    if (key < startKey || key > endKey) {
      continue;
    }
    const day = byKey.get(key);
    if (!day) {
      continue;
    }
    const category = unlockCategoryOf(entry);
    const duration = typeof entry.unlockedDurationMs === 'number' && entry.unlockedDurationMs > 0
      ? entry.unlockedDurationMs
      : 0;
    day.count += 1;
    day.durationMs += duration;
    day.byCategory[category].count += 1;
    day.byCategory[category].durationMs += duration;
    totals[category].count += 1;
    totals[category].durationMs += duration;
    totalCount += 1;
    totalDurationMs += duration;
    if (duration > 0) {
      durations.push(duration);
    }
  }

  const categories = UNLOCK_CATEGORY_ORDER.map((id) => ({
    id,
    label: unlockCategoryLabel(id),
    color: UNLOCK_CATEGORY_COLORS[id],
    count: totals[id].count,
    durationMs: totals[id].durationMs,
    share: totalCount === 0 ? 0 : totals[id].count / totalCount,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    period,
    totalCount,
    totalDurationMs,
    averageDurationMs:
      durations.length === 0
        ? null
        : Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    categories,
    days,
  };
}

export function formatUnlockShare(share: number): string {
  if (share <= 0) {
    return '0%';
  }
  const pct = Math.round(share * 100);
  return `${Math.max(pct, share > 0 ? 1 : 0)}%`;
}

export function formatUnlockCount(count: number): string {
  return count === 1 ? '1 unlock' : `${count} unlocks`;
}

export function formatUnlockTime(ms: number | null | undefined): string {
  return formatUnlockedDuration(ms) ?? '—';
}
