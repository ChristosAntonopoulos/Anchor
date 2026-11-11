import assert from 'node:assert/strict';
import {
  applyVerifiedUsage,
  applyVerifiedUsageIdempotent,
  associateUnlockToDistraction,
  isWithinSchedule,
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
    ...overrides,
  };
}

// 1–3 cumulative allowance across apps
{
  let cycle = baseCycle();
  cycle = applyVerifiedUsage(cycle, 90_000, 1_000, 900, 0).cycle; // IG 1.5m
  cycle = applyVerifiedUsage(cycle, 120_000, 2_000, 900, 0).cycle; // YT 2m
  const result = applyVerifiedUsage(cycle, 90_000, 3_000, 900, 5_000); // IG 1.5m
  assert.equal(result.cooldownStarted, true);
  assert.equal(result.cycle.cycleStatus, 'COOLDOWN_ACTIVE');
  assert.equal(result.cycle.observedUsageMs, 300_000);
}

// Screen-off / no double count: adding 0 does nothing
{
  const cycle = baseCycle({ observedUsageMs: 180_000 });
  const result = applyVerifiedUsage(cycle, 0, 1_000, 900, 0);
  assert.equal(result.cooldownStarted, false);
  assert.equal(result.cycle.observedUsageMs, 180_000);
}

// One threshold → one cooldown even with more segments
{
  const { cooldownStartedCount, cycle } = applyVerifiedUsageIdempotent(
    baseCycle(),
    [200_000, 100_000, 50_000],
    10_000,
    900,
    0
  );
  assert.equal(cooldownStartedCount, 1);
  assert.equal(cycle.thresholdCrossed, true);
  assert.equal(cycle.cycleStatus, 'COOLDOWN_ACTIVE');
}

// Cooldown remaining uses elapsed realtime preferentially
{
  const cycle = baseCycle({
    cycleStatus: 'COOLDOWN_ACTIVE',
    thresholdCrossed: true,
    observedUsageMs: 300_000,
    cooldownEndsAtMs: 1_000_000,
    cooldownEndsElapsedRealtime: 50_000,
  });
  assert.equal(remainingCooldownMs(cycle, 999_999, 40_000), 10_000);
}

// Schedule within / outside / midnight cross
{
  // Wednesday 2024-06-05 10:00 local — construct via Date
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
  const night = new Date(2024, 5, 5, 23, 30, 0).getTime();
  assert.equal(
    isWithinSchedule({
      nowMs: night,
      startMinutes: 7 * 60,
      endMinutes: 23 * 60,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
    }),
    false
  );
  const late = new Date(2024, 5, 5, 1, 0, 0).getTime();
  assert.equal(
    isWithinSchedule({
      nowMs: late,
      startMinutes: 22 * 60,
      endMinutes: 6 * 60,
      activeDays: [0, 1, 2, 3, 4, 5, 6],
    }),
    true
  );
}

// Unlock-to-distraction association
{
  assert.equal(
    associateUnlockToDistraction({
      unlockTimestampMs: 1000,
      firstDistractionStartMs: 30_000,
      windowSeconds: 60,
    }),
    true
  );
  assert.equal(
    associateUnlockToDistraction({
      unlockTimestampMs: 1000,
      firstDistractionStartMs: 90_000,
      windowSeconds: 60,
    }),
    false
  );
  assert.equal(unlockToDistractionRate({ eligibleUnlocks: 10, unlocksFollowedByDistraction: 4 }), 0.4);
  assert.equal(unlockToDistractionRate({ eligibleUnlocks: 0, unlocksFollowedByDistraction: 0 }), null);
}

// Remaining allowance
{
  assert.equal(remainingAllowanceMs(baseCycle({ observedUsageMs: 120_000 })), 180_000);
}

console.log('distraction-guard policyEngine tests: ok');
