import assert from 'node:assert/strict';
import {
  applyBypassExpiry,
  applyVerifiedUsage,
  applyVerifiedUsageIdempotent,
  associateUnlockToDistraction,
  ensureCycleStatus,
  isBypassActive,
  isWithinSchedule,
  reconcileBootCooldown,
  remainingAllowanceMs,
  remainingCooldownMs,
  unlockToDistractionRate,
  type FocusCycleState,
} from '../policyEngine';

function baseCycle(overrides: Partial<FocusCycleState> = {}): FocusCycleState {
  return {
    id: 'c1',
    observedUsageMs: 0,
    allowanceMs: 300_000,
    cycleStatus: 'ALLOWANCE_AVAILABLE',
    thresholdCrossed: false,
    bootId: 'boot-a',
    exceptionType: 'NONE',
    ...overrides,
  };
}

// Cumulative allowance across apps
{
  let cycle = baseCycle();
  cycle = applyVerifiedUsage(cycle, 90_000, 1_000, 900, 0).cycle;
  cycle = applyVerifiedUsage(cycle, 120_000, 2_000, 900, 0).cycle;
  const result = applyVerifiedUsage(cycle, 90_000, 3_000, 900, 5_000);
  assert.equal(result.cooldownStarted, true);
  assert.equal(result.cycle.cycleStatus, 'COOLDOWN_ACTIVE');
  assert.equal(result.cycle.observedUsageMs, 300_000);
}

// One threshold → one cooldown
{
  const { cooldownStartedCount } = applyVerifiedUsageIdempotent(
    baseCycle(),
    [200_000, 100_000, 50_000],
    10_000,
    900,
    0
  );
  assert.equal(cooldownStartedCount, 1);
}

// CYCLE_COMPLETE recovers inside schedule
{
  const next = ensureCycleStatus({
    cycle: baseCycle({ cycleStatus: 'CYCLE_COMPLETE', thresholdCrossed: true, observedUsageMs: 300_000 }),
    withinSchedule: true,
    enabled: true,
    nowMs: 1000,
    elapsedRealtime: 1000,
    allowanceMs: 300_000,
    newId: 'fresh',
    bootId: 'boot-a',
  });
  assert.equal(next.cycleStatus, 'ALLOWANCE_AVAILABLE');
  assert.equal(next.id, 'fresh');
  assert.equal(next.observedUsageMs, 0);
}

// Boot reconcile uses wall clock for remaining cooldown
{
  const cycle = baseCycle({
    cycleStatus: 'COOLDOWN_ACTIVE',
    thresholdCrossed: true,
    observedUsageMs: 300_000,
    cooldownEndsAtMs: 10_000,
    cooldownEndsElapsedRealtime: 999_999,
    bootId: 'old-boot',
  });
  const reconciled = reconcileBootCooldown(cycle, 'new-boot', 5_000, 100);
  assert.equal(reconciled.bootId, 'new-boot');
  assert.equal(reconciled.cooldownEndsElapsedRealtime, 5_100);
  assert.equal(remainingCooldownMs(reconciled, 5_000, 100), 5_000);
}

// Bypass active suppresses further allowance counting
{
  const cycle = baseCycle({
    exceptionType: 'TEMPORARY_ACCESS',
    bypassExpiresAtMs: 50_000,
  });
  assert.equal(isBypassActive(cycle, 10_000, 0), true);
  const result = applyVerifiedUsage(cycle, 100_000, 10_000, 900, 0);
  assert.equal(result.cooldownStarted, false);
  assert.equal(result.cycle.observedUsageMs, 0);
}

// Bypass expiry resumes remaining cooldown
{
  const cycle = baseCycle({
    cycleStatus: 'COOLDOWN_ACTIVE',
    thresholdCrossed: true,
    observedUsageMs: 300_000,
    exceptionType: 'TEMPORARY_ACCESS',
    bypassExpiresAtMs: 1_000,
    bypassExpiresElapsedRealtime: 1_000,
    cooldownEndsAtMs: 20_000,
    cooldownEndsElapsedRealtime: 20_000,
  });
  const after = applyBypassExpiry({
    cycle,
    nowMs: 2_000,
    elapsedRealtime: 2_000,
    withinSchedule: true,
    enabled: true,
    allowanceMs: 300_000,
    newId: 'x',
    bootId: 'boot-a',
  });
  assert.equal(after.exceptionType, 'NONE');
  assert.equal(after.cycleStatus, 'COOLDOWN_ACTIVE');
}

// Bypass expiry after cooldown ended → fresh allowance
{
  const cycle = baseCycle({
    cycleStatus: 'COOLDOWN_ACTIVE',
    thresholdCrossed: true,
    observedUsageMs: 300_000,
    exceptionType: 'TEMPORARY_ACCESS',
    bypassExpiresAtMs: 1_000,
    bypassExpiresElapsedRealtime: 1_000,
    cooldownEndsAtMs: 1_500,
    cooldownEndsElapsedRealtime: 1_500,
  });
  const after = applyBypassExpiry({
    cycle,
    nowMs: 2_000,
    elapsedRealtime: 2_000,
    withinSchedule: true,
    enabled: true,
    allowanceMs: 300_000,
    newId: 'next',
    bootId: 'boot-a',
  });
  assert.equal(after.cycleStatus, 'ALLOWANCE_AVAILABLE');
  assert.equal(after.id, 'next');
}

// Schedule / unlock association
{
  const midMorning = new Date(2024, 5, 5, 10, 0, 0).getTime();
  assert.equal(
    isWithinSchedule({
      nowMs: midMorning,
      startMinutes: 7 * 60,
      endMinutes: 23 * 60,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
    }),
    true
  );
  assert.equal(
    associateUnlockToDistraction({
      unlockTimestampMs: 1000,
      firstDistractionStartMs: 30_000,
      windowSeconds: 60,
    }),
    true
  );
  assert.equal(unlockToDistractionRate({ eligibleUnlocks: 10, unlocksFollowedByDistraction: 4 }), 0.4);
  assert.equal(remainingAllowanceMs(baseCycle({ observedUsageMs: 120_000 })), 180_000);
}

console.log('distraction-guard policyEngine tests: ok');
