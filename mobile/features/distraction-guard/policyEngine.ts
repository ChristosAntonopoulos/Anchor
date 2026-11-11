/**
 * Pure deterministic policy helpers (mirrors native PolicyEngine for tests & UI).
 * Native Android remains authoritative for live timers.
 */

export type CycleStatus =
  | 'ALLOWANCE_AVAILABLE'
  | 'ALLOWANCE_EXHAUSTED'
  | 'COOLDOWN_ACTIVE'
  | 'CYCLE_COMPLETE';

export type FocusCycleState = {
  id: string;
  observedUsageMs: number;
  allowanceMs: number;
  cycleStatus: CycleStatus;
  thresholdCrossed: boolean;
  cooldownEndsAtMs?: number;
  cooldownEndsElapsedRealtime?: number;
};

export function isWithinSchedule(params: {
  nowMs: number;
  startMinutes: number;
  endMinutes: number;
  activeDays: number[]; // Sunday=0
  timeZoneOffsetMinutes?: number;
  pausedUntilMs?: number;
}): boolean {
  const { nowMs, startMinutes, endMinutes, activeDays, pausedUntilMs = 0 } = params;
  if (pausedUntilMs > nowMs) return false;

  const date = new Date(nowMs);
  const day = date.getDay();
  if (activeDays.length > 0 && !activeDays.includes(day)) return false;

  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  if (startMinutes === endMinutes) return true;
  if (startMinutes < endMinutes) {
    return minuteOfDay >= startMinutes && minuteOfDay < endMinutes;
  }
  return minuteOfDay >= startMinutes || minuteOfDay < endMinutes;
}

export function remainingAllowanceMs(cycle: FocusCycleState): number {
  return Math.max(0, cycle.allowanceMs - cycle.observedUsageMs);
}

export function applyVerifiedUsage(
  cycle: FocusCycleState,
  addMs: number,
  nowMs: number,
  cooldownSeconds: number,
  elapsedRealtime: number
): { cycle: FocusCycleState; cooldownStarted: boolean } {
  if (cycle.cycleStatus !== 'ALLOWANCE_AVAILABLE' || addMs <= 0) {
    return { cycle, cooldownStarted: false };
  }
  const nextObserved = Math.min(cycle.allowanceMs, cycle.observedUsageMs + addMs);
  const next: FocusCycleState = {
    ...cycle,
    observedUsageMs: nextObserved,
  };
  if (nextObserved >= cycle.allowanceMs && !cycle.thresholdCrossed) {
    next.thresholdCrossed = true;
    next.cycleStatus = 'COOLDOWN_ACTIVE';
    next.cooldownEndsAtMs = nowMs + cooldownSeconds * 1000;
    next.cooldownEndsElapsedRealtime = elapsedRealtime + cooldownSeconds * 1000;
    return { cycle: next, cooldownStarted: true };
  }
  return { cycle: next, cooldownStarted: false };
}

/** One threshold crossing → one cooldown. Duplicate adds after cap do not re-trigger. */
export function applyVerifiedUsageIdempotent(
  cycle: FocusCycleState,
  segmentsMs: number[],
  nowMs: number,
  cooldownSeconds: number,
  elapsedRealtime: number
): { cycle: FocusCycleState; cooldownStartedCount: number } {
  let current = { ...cycle };
  let started = 0;
  for (const ms of segmentsMs) {
    const result = applyVerifiedUsage(current, ms, nowMs, cooldownSeconds, elapsedRealtime);
    if (result.cooldownStarted) started += 1;
    current = result.cycle;
  }
  return { cycle: current, cooldownStartedCount: started };
}

export function remainingCooldownMs(
  cycle: FocusCycleState,
  nowMs: number,
  elapsedRealtime: number
): number {
  if (cycle.cycleStatus !== 'COOLDOWN_ACTIVE') return 0;
  if (cycle.cooldownEndsElapsedRealtime != null) {
    return Math.max(0, cycle.cooldownEndsElapsedRealtime - elapsedRealtime);
  }
  if (cycle.cooldownEndsAtMs != null) {
    return Math.max(0, cycle.cooldownEndsAtMs - nowMs);
  }
  return 0;
}

export function unlockToDistractionRate(params: {
  eligibleUnlocks: number;
  unlocksFollowedByDistraction: number;
}): number | null {
  if (params.eligibleUnlocks <= 0) return null;
  return params.unlocksFollowedByDistraction / params.eligibleUnlocks;
}

export function associateUnlockToDistraction(params: {
  unlockTimestampMs: number;
  firstDistractionStartMs: number | null;
  windowSeconds: number;
}): boolean {
  if (params.firstDistractionStartMs == null) return false;
  const delay = params.firstDistractionStartMs - params.unlockTimestampMs;
  return delay >= 0 && delay <= params.windowSeconds * 1000;
}

export function formatMmSs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const DEFAULT_REPLACEMENT_ACTIONS = [
  {
    title: 'Ξεκίνα από το γραφείο',
    instruction: 'Πήγαινε στο γραφείο και άνοιξε το laptop.',
    estimatedSeconds: 30,
    easierAlternative: 'Πήγαινε απλώς στο γραφείο.',
    category: 'physical',
  },
  {
    title: 'Βάλε το κινητό κάτω',
    instruction: 'Άφησε το κινητό στην άκρη για ένα λεπτό.',
    estimatedSeconds: 15,
    easierAlternative: 'Γύρισε την οθόνη προς τα κάτω.',
    category: 'physical',
  },
  {
    title: 'Ένα ποτήρι νερό',
    instruction: 'Σήκω και πιες ένα ποτήρι νερό.',
    estimatedSeconds: 20,
    easierAlternative: 'Σήκω από την καρέκλα.',
    category: 'physical',
  },
] as const;

export function pickReplacementAction(seed = Date.now()) {
  return DEFAULT_REPLACEMENT_ACTIONS[seed % DEFAULT_REPLACEMENT_ACTIONS.length];
}
