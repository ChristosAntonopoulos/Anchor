/**
 * Pure deterministic policy helpers (mirrors native PolicyEngine for tests & UI).
 * Native Android remains authoritative for live timers.
 */

export type CycleStatus =
  | 'ALLOWANCE_AVAILABLE'
  | 'ALLOWANCE_EXHAUSTED'
  | 'COOLDOWN_ACTIVE'
  | 'CYCLE_COMPLETE';

export type ExceptionType = 'NONE' | 'TEMPORARY_ACCESS' | 'COOLDOWN_ENDED_BY_USER';

export type FocusCycleState = {
  id: string;
  observedUsageMs: number;
  allowanceMs: number;
  cycleStatus: CycleStatus;
  thresholdCrossed: boolean;
  cooldownEndsAtMs?: number;
  cooldownEndsElapsedRealtime?: number;
  bootId?: string;
  exceptionType?: ExceptionType;
  bypassExpiresAtMs?: number;
  bypassExpiresElapsedRealtime?: number;
};

export function isWithinSchedule(params: {
  nowMs: number;
  startMinutes: number;
  endMinutes: number;
  activeDays: number[];
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
  if (cycle.cycleStatus !== 'ALLOWANCE_AVAILABLE') return 0;
  return Math.max(0, cycle.allowanceMs - cycle.observedUsageMs);
}

export function isBypassActive(
  cycle: FocusCycleState,
  nowMs: number,
  elapsedRealtime: number
): boolean {
  if (cycle.exceptionType !== 'TEMPORARY_ACCESS') return false;
  if (cycle.bypassExpiresElapsedRealtime != null) {
    return elapsedRealtime < cycle.bypassExpiresElapsedRealtime;
  }
  if (cycle.bypassExpiresAtMs != null) {
    return nowMs < cycle.bypassExpiresAtMs;
  }
  return false;
}

export function reconcileBootCooldown(
  cycle: FocusCycleState,
  currentBootId: string,
  nowMs: number,
  elapsedRealtime: number
): FocusCycleState {
  if (cycle.bootId && cycle.bootId === currentBootId) return cycle;
  const next = { ...cycle, bootId: currentBootId };
  if (next.cycleStatus === 'COOLDOWN_ACTIVE') {
    if (next.cooldownEndsAtMs != null) {
      const remaining = Math.max(0, next.cooldownEndsAtMs - nowMs);
      next.cooldownEndsElapsedRealtime = elapsedRealtime + remaining;
    } else {
      next.cycleStatus = 'CYCLE_COMPLETE';
    }
  }
  return next;
}

export function ensureCycleStatus(params: {
  cycle: FocusCycleState | null;
  withinSchedule: boolean;
  enabled: boolean;
  nowMs: number;
  elapsedRealtime: number;
  allowanceMs: number;
  newId: string;
  bootId: string;
}): FocusCycleState {
  const { withinSchedule, enabled, nowMs, elapsedRealtime, allowanceMs, newId, bootId } = params;
  let cycle = params.cycle;

  if (!cycle) {
    if (withinSchedule && enabled) {
      return {
        id: newId,
        observedUsageMs: 0,
        allowanceMs,
        cycleStatus: 'ALLOWANCE_AVAILABLE',
        thresholdCrossed: false,
        bootId,
        exceptionType: 'NONE',
      };
    }
    return {
      id: '',
      observedUsageMs: 0,
      allowanceMs,
      cycleStatus: 'CYCLE_COMPLETE',
      thresholdCrossed: false,
      bootId,
      exceptionType: 'NONE',
    };
  }

  cycle = reconcileBootCooldown(cycle, bootId, nowMs, elapsedRealtime);

  if (cycle.cycleStatus === 'COOLDOWN_ACTIVE' && !isBypassActive(cycle, nowMs, elapsedRealtime)) {
    const expired =
      (cycle.cooldownEndsElapsedRealtime != null &&
        elapsedRealtime >= cycle.cooldownEndsElapsedRealtime) ||
      (cycle.cooldownEndsAtMs != null && nowMs >= cycle.cooldownEndsAtMs);
    if (expired) {
      if (withinSchedule && enabled) {
        return {
          id: newId,
          observedUsageMs: 0,
          allowanceMs,
          cycleStatus: 'ALLOWANCE_AVAILABLE',
          thresholdCrossed: false,
          bootId,
          exceptionType: 'NONE',
        };
      }
      return { ...cycle, cycleStatus: 'CYCLE_COMPLETE' };
    }
  }

  if (
    (cycle.cycleStatus === 'CYCLE_COMPLETE' || cycle.cycleStatus === 'ALLOWANCE_EXHAUSTED') &&
    withinSchedule &&
    enabled
  ) {
    return {
      id: newId,
      observedUsageMs: 0,
      allowanceMs,
      cycleStatus: 'ALLOWANCE_AVAILABLE',
      thresholdCrossed: false,
      bootId,
      exceptionType: 'NONE',
    };
  }

  return cycle;
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
  if (isBypassActive(cycle, nowMs, elapsedRealtime)) {
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
    next.exceptionType = 'NONE';
    return { cycle: next, cooldownStarted: true };
  }
  return { cycle: next, cooldownStarted: false };
}

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

export function applyBypassExpiry(params: {
  cycle: FocusCycleState;
  nowMs: number;
  elapsedRealtime: number;
  withinSchedule: boolean;
  enabled: boolean;
  allowanceMs: number;
  newId: string;
  bootId: string;
}): FocusCycleState {
  const { cycle, nowMs, elapsedRealtime, withinSchedule, enabled, allowanceMs, newId, bootId } =
    params;
  if (cycle.exceptionType !== 'TEMPORARY_ACCESS') return cycle;
  if (isBypassActive(cycle, nowMs, elapsedRealtime)) return cycle;

  const cleared: FocusCycleState = {
    ...cycle,
    exceptionType: 'NONE',
    bypassExpiresAtMs: undefined,
    bypassExpiresElapsedRealtime: undefined,
  };

  if (cleared.cycleStatus === 'COOLDOWN_ACTIVE') {
    const cooldownLeft =
      (cleared.cooldownEndsElapsedRealtime != null &&
        elapsedRealtime < cleared.cooldownEndsElapsedRealtime) ||
      (cleared.cooldownEndsAtMs != null && nowMs < cleared.cooldownEndsAtMs);
    if (cooldownLeft) return cleared;
  }

  if (withinSchedule && enabled) {
    return {
      id: newId,
      observedUsageMs: 0,
      allowanceMs,
      cycleStatus: 'ALLOWANCE_AVAILABLE',
      thresholdCrossed: false,
      bootId,
      exceptionType: 'NONE',
    };
  }
  return { ...cleared, cycleStatus: 'CYCLE_COMPLETE' };
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
    title: 'Start at your desk',
    instruction: 'Go to your desk and open the laptop.',
    estimatedSeconds: 30,
    easierAlternative: 'Just go to your desk.',
    category: 'physical',
  },
  {
    title: 'Put the phone down',
    instruction: 'Put the phone aside for one minute.',
    estimatedSeconds: 15,
    easierAlternative: 'Turn the screen face down.',
    category: 'physical',
  },
  {
    title: 'A glass of water',
    instruction: 'Stand up and drink a glass of water.',
    estimatedSeconds: 20,
    easierAlternative: 'Get up from the chair.',
    category: 'physical',
  },
] as const;

export function pickReplacementAction(seed = Date.now()) {
  return DEFAULT_REPLACEMENT_ACTIONS[seed % DEFAULT_REPLACEMENT_ACTIONS.length];
}
