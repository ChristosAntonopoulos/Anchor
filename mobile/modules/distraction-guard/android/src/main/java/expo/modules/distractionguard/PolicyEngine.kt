package expo.modules.distractionguard

import android.content.Context
import org.json.JSONObject
import java.util.Calendar
import java.util.TimeZone

/**
 * Deterministic cycle / schedule / cooldown / bypass policy.
 * AI never mutates this path. Native is authoritative for live timers.
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

  const val EXCEPTION_NONE = "NONE"
  const val EXCEPTION_TEMPORARY = "TEMPORARY_ACCESS"
  const val EXCEPTION_ENDED_BY_USER = "COOLDOWN_ENDED_BY_USER"

  fun isWithinSchedule(settings: JSONObject, nowMs: Long, timeZoneId: String = TimeZone.getDefault().id): Boolean {
    val pausedUntil = settings.optLong("pausedUntilMs", 0L)
    if (pausedUntil > nowMs) return false

    val cal = Calendar.getInstance(TimeZone.getTimeZone(timeZoneId))
    cal.timeInMillis = nowMs
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
      minuteOfDay >= start || minuteOfDay < end
    }
  }

  fun protectionState(
    settings: JSONObject,
    usageAccess: Boolean,
    nowMs: Long
  ): String {
    if (!settings.optBoolean("enabled", false) || !settings.optBoolean("setupComplete", false)) {
      return PROTECTION_DISABLED
    }
    val pausedUntil = settings.optLong("pausedUntilMs", 0L)
    if (pausedUntil > nowMs) return PROTECTION_PAUSED
    if (!isWithinSchedule(settings, nowMs)) return PROTECTION_OUTSIDE
    if (!usageAccess) return PROTECTION_DEGRADED
    return PROTECTION_ACTIVE
  }

  /**
   * Reconcile boot identity: after reboot, elapsedRealtime resets.
   * Prefer wall-clock for cross-boot decisions; rewrite elapsed anchors for the new boot.
   */
  fun reconcileBoot(context: Context, cycle: JSONObject, nowMs: Long, elapsedRealtime: Long): JSONObject {
    val currentBoot = GuardPrefs.bootId(context)
    val cycleBoot = cycle.optString("bootId", "")
    if (cycleBoot.isNotBlank() && cycleBoot == currentBoot) {
      return cycle
    }
    cycle.put("bootId", currentBoot)
    cycle.put("bootReconciledAtMs", nowMs)

    val status = cycle.optString("cycleStatus")
    if (status == CYCLE_COOLDOWN) {
      val endsAt = cycle.optLong("cooldownEndsAtMs", 0L)
      if (endsAt > 0) {
        val remaining = (endsAt - nowMs).coerceAtLeast(0L)
        cycle.put("cooldownEndsElapsedRealtime", elapsedRealtime + remaining)
        cycle.put("cooldownStartedElapsedRealtime", elapsedRealtime)
      } else {
        // Ambiguous after reboot without wall expiry → fail open (end cooldown).
        cycle.put("cycleStatus", CYCLE_COMPLETE)
        cycle.put("endedAtMs", nowMs)
        cycle.put("endedReason", "boot_ambiguous_cooldown")
      }
    }

    if (cycle.optString("exceptionType") == EXCEPTION_TEMPORARY) {
      val bypassEnds = cycle.optLong("bypassExpiresAtMs", 0L)
      if (bypassEnds > 0) {
        val remaining = (bypassEnds - nowMs).coerceAtLeast(0L)
        cycle.put("bypassExpiresElapsedRealtime", elapsedRealtime + remaining)
      } else {
        cycle.put("exceptionType", EXCEPTION_NONE)
        cycle.remove("bypassExpiresAtMs")
        cycle.remove("bypassExpiresElapsedRealtime")
      }
    }

    GuardPrefs.saveCycle(context, cycle, commit = true)
    return cycle
  }

  fun isBypassActive(cycle: JSONObject, nowMs: Long, elapsedRealtime: Long): Boolean {
    if (cycle.optString("exceptionType") != EXCEPTION_TEMPORARY) return false
    val endsElapsed = cycle.optLong("bypassExpiresElapsedRealtime", 0L)
    if (endsElapsed > 0) return elapsedRealtime < endsElapsed
    val endsAt = cycle.optLong("bypassExpiresAtMs", 0L)
    return endsAt > 0 && nowMs < endsAt
  }

  fun ensureCycle(context: Context, settings: JSONObject, nowMs: Long, elapsedRealtime: Long): JSONObject {
    var existing = GuardPrefs.cycle(context)
    if (existing == null) {
      return if (isWithinSchedule(settings, nowMs) && settings.optBoolean("enabled", false)) {
        startFreshAllowance(context, settings, nowMs, elapsedRealtime)
      } else {
        JSONObject()
          .put("id", "")
          .put("cycleStatus", CYCLE_COMPLETE)
          .put("observedUsageMs", 0L)
          .put("allowanceMs", settings.optInt("allowanceSeconds", 300) * 1000L)
      }
    }

    existing = reconcileBoot(context, existing, nowMs, elapsedRealtime)
    existing = resolveBypassExpiry(context, existing, settings, nowMs, elapsedRealtime)

    val status = existing.optString("cycleStatus")

    if (status == CYCLE_COOLDOWN && !isBypassActive(existing, nowMs, elapsedRealtime)) {
      if (isCooldownExpired(existing, nowMs, elapsedRealtime)) {
        return if (isWithinSchedule(settings, nowMs) && settings.optBoolean("enabled", false)) {
          startFreshAllowance(context, settings, nowMs, elapsedRealtime)
        } else {
          existing.put("cycleStatus", CYCLE_COMPLETE)
          existing.put("endedAtMs", nowMs)
          existing.put("endedReason", "cooldown_expired_outside_schedule")
          GuardPrefs.saveCycle(context, existing, commit = true)
          existing
        }
      }
      return existing
    }

    if (status == CYCLE_COMPLETE || status == CYCLE_EXHAUSTED || status.isBlank()) {
      return if (isWithinSchedule(settings, nowMs) && settings.optBoolean("enabled", false)) {
        startFreshAllowance(context, settings, nowMs, elapsedRealtime)
      } else {
        existing
      }
    }

    // Mid-cycle settings: keep observed usage, refresh allowance cap from settings when in ALLOWANCE.
    if (status == CYCLE_ALLOWANCE) {
      val configured = settings.optInt("allowanceSeconds", 300) * 1000L
      if (configured != existing.optLong("allowanceMs")) {
        existing.put("allowanceMs", configured)
        // If already over new smaller cap, trigger cooldown once.
        if (existing.optLong("observedUsageMs") >= configured && !existing.optBoolean("thresholdCrossed", false)) {
          return beginCooldown(context, existing, settings, nowMs, elapsedRealtime).first
        }
        GuardPrefs.saveCycle(context, existing, commit = true)
      }
    }

    return existing
  }

  private fun resolveBypassExpiry(
    context: Context,
    cycle: JSONObject,
    settings: JSONObject,
    nowMs: Long,
    elapsedRealtime: Long
  ): JSONObject {
    if (cycle.optString("exceptionType") != EXCEPTION_TEMPORARY) return cycle
    if (isBypassActive(cycle, nowMs, elapsedRealtime)) return cycle

    // Bypass ended: resume remaining cooldown if wall/elapsed still has time left.
    cycle.put("exceptionType", EXCEPTION_NONE)
    cycle.remove("bypassExpiresAtMs")
    cycle.remove("bypassExpiresElapsedRealtime")
    cycle.put("bypassEndedAtMs", nowMs)

    if (cycle.optString("cycleStatus") == CYCLE_COOLDOWN && !isCooldownExpired(cycle, nowMs, elapsedRealtime)) {
      GuardPrefs.saveCycle(context, cycle, commit = true)
      return cycle
    }

    // Cooldown finished during bypass → next allowance if schedule active.
    return if (isWithinSchedule(settings, nowMs) && settings.optBoolean("enabled", false)) {
      startFreshAllowance(context, settings, nowMs, elapsedRealtime)
    } else {
      cycle.put("cycleStatus", CYCLE_COMPLETE)
      cycle.put("endedAtMs", nowMs)
      cycle.put("endedReason", "bypass_ended_cooldown_done")
      GuardPrefs.saveCycle(context, cycle, commit = true)
      cycle
    }
  }

  fun isCooldownExpired(cycle: JSONObject, nowMs: Long, elapsedRealtime: Long): Boolean {
    val endsAt = cycle.optLong("cooldownEndsAtMs", 0L)
    val endsElapsed = cycle.optLong("cooldownEndsElapsedRealtime", 0L)
    // Prefer elapsed within same boot; wall clock is authoritative across boots (after reconcileBoot).
    val expiredElapsed = endsElapsed > 0 && elapsedRealtime >= endsElapsed
    val expiredWall = endsAt > 0 && nowMs >= endsAt
    return expiredElapsed || expiredWall
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
      .put("exceptionType", EXCEPTION_NONE)
      .put("oneMinuteWarned", false)
    GuardPrefs.saveCycle(context, cycle, commit = true)
    GuardPrefs.clearWarnedFlag(context)
    return cycle
  }

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
    if (isBypassActive(cycle, nowMs, elapsedRealtime)) {
      return cycle to false
    }
    if (addMs <= 0) return cycle to false

    val allowance = cycle.optLong("allowanceMs", 300_000L)
    val observed = cycle.optLong("observedUsageMs", 0L)
    val next = (observed + addMs).coerceAtMost(allowance)
    cycle.put("observedUsageMs", next)

    if (next >= allowance && !cycle.optBoolean("thresholdCrossed", false)) {
      return beginCooldown(context, cycle, settings, nowMs, elapsedRealtime)
    }
    GuardPrefs.saveCycle(context, cycle, commit = true)
    return cycle to false
  }

  private fun beginCooldown(
    context: Context,
    cycle: JSONObject,
    settings: JSONObject,
    nowMs: Long,
    elapsedRealtime: Long
  ): Pair<JSONObject, Boolean> {
    cycle.put("thresholdCrossed", true)
    cycle.put("cycleStatus", CYCLE_COOLDOWN)
    val cooldownSec = settings.optInt("cooldownSeconds", 900)
    cycle.put("cooldownSeconds", cooldownSec)
    cycle.put("cooldownStartedAtMs", nowMs)
    cycle.put("cooldownEndsAtMs", nowMs + cooldownSec * 1000L)
    cycle.put("cooldownStartedElapsedRealtime", elapsedRealtime)
    cycle.put("cooldownEndsElapsedRealtime", elapsedRealtime + cooldownSec * 1000L)
    cycle.put("cooldownReason", "allowance_exhausted")
    cycle.put("exceptionType", EXCEPTION_NONE)
    GuardPrefs.saveCycle(context, cycle, commit = true)
    return cycle to true
  }

  fun remainingAllowanceMs(cycle: JSONObject): Long {
    if (cycle.optString("cycleStatus") != CYCLE_ALLOWANCE) return 0L
    val allowance = cycle.optLong("allowanceMs", 300_000L)
    val observed = cycle.optLong("observedUsageMs", 0L)
    return (allowance - observed).coerceAtLeast(0L)
  }

  fun remainingCooldownMs(cycle: JSONObject, nowMs: Long, elapsedRealtime: Long): Long {
    if (cycle.optString("cycleStatus") != CYCLE_COOLDOWN) return 0L
    if (isBypassActive(cycle, nowMs, elapsedRealtime)) {
      // During bypass, show underlying cooldown remaining (not extended).
    }
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
      cycle.put("exceptionType", EXCEPTION_ENDED_BY_USER)
      cycle.remove("bypassExpiresAtMs")
      cycle.remove("bypassExpiresElapsedRealtime")
      GuardPrefs.saveCycle(context, cycle, commit = true)
      GuardPrefs.appendBypassEvent(
        context,
        JSONObject()
          .put("cycleId", cycle.optString("id"))
          .put("type", EXCEPTION_ENDED_BY_USER)
          .put("atMs", nowMs)
      )
      return cycle
    }

    val seconds = durationSeconds.coerceAtLeast(1)
    cycle.put("exceptionType", EXCEPTION_TEMPORARY)
    cycle.put("bypassExpiresAtMs", nowMs + seconds * 1000L)
    cycle.put("bypassExpiresElapsedRealtime", elapsedRealtime + seconds * 1000L)
    // Do not extend cooldownEnds* — resume remaining cooldown after bypass.
    GuardPrefs.saveCycle(context, cycle, commit = true)
    GuardPrefs.appendBypassEvent(
      context,
      JSONObject()
        .put("cycleId", cycle.optString("id"))
        .put("type", EXCEPTION_TEMPORARY)
        .put("durationSeconds", seconds)
        .put("atMs", nowMs)
        .put("expiresAtMs", nowMs + seconds * 1000L)
    )
    return cycle
  }

  fun endScheduleWindow(context: Context, cycle: JSONObject?, nowMs: Long) {
    if (cycle == null) return
    val status = cycle.optString("cycleStatus")
    if (status == CYCLE_COMPLETE) return
    cycle.put("cycleStatus", CYCLE_COMPLETE)
    cycle.put("endedAtMs", nowMs)
    cycle.put("endedReason", "schedule_ended")
    cycle.put("exceptionType", EXCEPTION_NONE)
    GuardPrefs.saveCycle(context, cycle, commit = true)
  }
}
