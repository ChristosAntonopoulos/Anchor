package expo.modules.distractionguard

import android.content.Context
import org.json.JSONObject
import java.util.Calendar
import java.util.TimeZone

/**
 * Deterministic cycle / schedule / cooldown policy.
 * AI never mutates this path.
 */
internal object PolicyEngine {

  const val PROTECTION_DISABLED = "DISABLED"
  const val PROTECTION_OUTSIDE = "OUTSIDE_SCHEDULE"
  const val PROTECTION_ACTIVE = "ACTIVE"
  const val PROTECTION_DEGRADED = "DEGRADED"
  const val PROTECTION_PAUSED = "PAUSED"

  const val CYCLE_ALLOWANCE = "ALLOWANCE_AVAILABLE"
  const val CYCLE_EXHAUSTED = "ALLOWANCE_EXHAUSTED"
  const val CYCLE_COOLDOWN = "COOLDOWN_ACTIVE"
  const val CYCLE_COMPLETE = "CYCLE_COMPLETE"

  fun isWithinSchedule(settings: JSONObject, nowMs: Long, timeZoneId: String = TimeZone.getDefault().id): Boolean {
    val pausedUntil = settings.optLong("pausedUntilMs", 0L)
    if (pausedUntil > nowMs) return false

    val cal = Calendar.getInstance(TimeZone.getTimeZone(timeZoneId))
    cal.timeInMillis = nowMs
    // Calendar.SUNDAY=1 → map to 0..6 with Sunday=0
    val sundayBased = cal.get(Calendar.DAY_OF_WEEK) - 1
    val days = settings.optJSONArray("activeDays")
    var dayOk = true
    if (days != null && days.length() > 0) {
      dayOk = false
      for (i in 0 until days.length()) {
        if (days.optInt(i) == sundayBased) {
          dayOk = true
          break
        }
      }
    }
    if (!dayOk) return false

    val minuteOfDay = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
    val start = settings.optInt("scheduleStartMinutes", 7 * 60)
    val end = settings.optInt("scheduleEndMinutes", 23 * 60)
    return if (start == end) {
      true
    } else if (start < end) {
      minuteOfDay in start until end
    } else {
      // crosses midnight
      minuteOfDay >= start || minuteOfDay < end
    }
  }

  fun protectionState(
    settings: JSONObject,
    usageAccess: Boolean,
    nowMs: Long
  ): String {
    if (!settings.optBoolean("enabled", false)) return PROTECTION_DISABLED
    val pausedUntil = settings.optLong("pausedUntilMs", 0L)
    if (pausedUntil > nowMs) return PROTECTION_PAUSED
    if (!isWithinSchedule(settings, nowMs)) return PROTECTION_OUTSIDE
    if (!usageAccess) return PROTECTION_DEGRADED
    return PROTECTION_ACTIVE
  }

  fun ensureCycle(context: Context, settings: JSONObject, nowMs: Long, elapsedRealtime: Long): JSONObject {
    val existing = GuardPrefs.cycle(context)
    if (existing != null) {
      // Expire cooldown if needed
      val status = existing.optString("cycleStatus")
      if (status == CYCLE_COOLDOWN) {
        val endsAt = existing.optLong("cooldownEndsAtMs", 0L)
        val endsElapsed = existing.optLong("cooldownEndsElapsedRealtime", 0L)
        val expiredByWall = endsAt > 0 && nowMs >= endsAt
        val expiredByElapsed = endsElapsed > 0 && elapsedRealtime >= endsElapsed
        if (expiredByWall || expiredByElapsed) {
          if (isWithinSchedule(settings, nowMs)) {
            return startFreshAllowance(context, settings, nowMs, elapsedRealtime)
          }
          existing.put("cycleStatus", CYCLE_COMPLETE)
          existing.put("endedAtMs", nowMs)
          GuardPrefs.saveCycle(context, existing)
          return existing
        }
      }
      return existing
    }
    return startFreshAllowance(context, settings, nowMs, elapsedRealtime)
  }

  fun startFreshAllowance(
    context: Context,
    settings: JSONObject,
    nowMs: Long,
    elapsedRealtime: Long
  ): JSONObject {
    val cycle = JSONObject()
      .put("id", GuardPrefs.newCycleId())
      .put("startedAtMs", nowMs)
      .put("startedElapsedRealtime", elapsedRealtime)
      .put("observedUsageMs", 0L)
      .put("allowanceMs", settings.optInt("allowanceSeconds", 300) * 1000L)
      .put("cooldownSeconds", settings.optInt("cooldownSeconds", 900))
      .put("cycleStatus", CYCLE_ALLOWANCE)
      .put("bootId", GuardPrefs.bootId(context))
      .put("monitoringQuality", "unknown")
      .put("thresholdCrossed", false)
    GuardPrefs.saveCycle(context, cycle)
    return cycle
  }

  /**
   * Adds verified usage. Caps at allowance. Triggers cooldown at most once per cycle.
   * Returns updated cycle and whether cooldown just started.
   */
  fun applyVerifiedUsage(
    context: Context,
    cycle: JSONObject,
    settings: JSONObject,
    addMs: Long,
    nowMs: Long,
    elapsedRealtime: Long
  ): Pair<JSONObject, Boolean> {
    if (cycle.optString("cycleStatus") != CYCLE_ALLOWANCE) {
      return cycle to false
    }
    if (addMs <= 0) return cycle to false

    val allowance = cycle.optLong("allowanceMs", 300_000L)
    val observed = cycle.optLong("observedUsageMs", 0L)
    val next = (observed + addMs).coerceAtMost(allowance)
    cycle.put("observedUsageMs", next)

    var startedCooldown = false
    if (next >= allowance && !cycle.optBoolean("thresholdCrossed", false)) {
      cycle.put("thresholdCrossed", true)
      cycle.put("cycleStatus", CYCLE_COOLDOWN)
      val cooldownSec = settings.optInt("cooldownSeconds", 900)
      cycle.put("cooldownStartedAtMs", nowMs)
      cycle.put("cooldownEndsAtMs", nowMs + cooldownSec * 1000L)
      cycle.put("cooldownStartedElapsedRealtime", elapsedRealtime)
      cycle.put("cooldownEndsElapsedRealtime", elapsedRealtime + cooldownSec * 1000L)
      cycle.put("cooldownReason", "allowance_exhausted")
      startedCooldown = true
    }
    GuardPrefs.saveCycle(context, cycle)
    return cycle to startedCooldown
  }

  fun remainingAllowanceMs(cycle: JSONObject): Long {
    val allowance = cycle.optLong("allowanceMs", 300_000L)
    val observed = cycle.optLong("observedUsageMs", 0L)
    return (allowance - observed).coerceAtLeast(0L)
  }

  fun remainingCooldownMs(cycle: JSONObject, nowMs: Long, elapsedRealtime: Long): Long {
    if (cycle.optString("cycleStatus") != CYCLE_COOLDOWN) return 0L
    val endsElapsed = cycle.optLong("cooldownEndsElapsedRealtime", 0L)
    if (endsElapsed > 0) {
      return (endsElapsed - elapsedRealtime).coerceAtLeast(0L)
    }
    val endsAt = cycle.optLong("cooldownEndsAtMs", 0L)
    return (endsAt - nowMs).coerceAtLeast(0L)
  }

  fun startBypass(
    context: Context,
    cycle: JSONObject,
    durationSeconds: Int,
    nowMs: Long,
    elapsedRealtime: Long,
    endRestriction: Boolean
  ): JSONObject {
    if (endRestriction) {
      cycle.put("cycleStatus", CYCLE_COMPLETE)
      cycle.put("endedAtMs", nowMs)
      cycle.put("exceptionType", "COOLDOWN_ENDED_BY_USER")
      GuardPrefs.saveCycle(context, cycle)
      return cycle
    }
    cycle.put("exceptionType", "TEMPORARY_ACCESS")
    cycle.put("bypassExpiresAtMs", nowMs + durationSeconds * 1000L)
    cycle.put("bypassExpiresElapsedRealtime", elapsedRealtime + durationSeconds * 1000L)
    GuardPrefs.saveCycle(context, cycle)
    return cycle
  }

  fun endScheduleWindow(context: Context, cycle: JSONObject?, nowMs: Long) {
    if (cycle == null) return
    // Default: end ordinary guard cycle at schedule boundary; do not carry cooldown.
    cycle.put("cycleStatus", CYCLE_COMPLETE)
    cycle.put("endedAtMs", nowMs)
    cycle.put("endedReason", "schedule_ended")
    GuardPrefs.saveCycle(context, cycle)
  }
}
