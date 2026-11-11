package expo.modules.distractionguard

import android.content.Context
import android.content.Intent
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONObject

/**
 * Orchestrates reconcile: usage query → dedupe → cycle update → interventions.
 */
internal object GuardController {
  private var warnedThisCycle = false

  fun capabilities(context: Context): Map<String, Any?> {
    val usageAccess = UsageAssembler.hasUsageAccess(context)
    val settings = GuardPrefs.settings(context)
    val now = System.currentTimeMillis()
    val protection = PolicyEngine.protectionState(settings, usageAccess, now)
    val cycle = GuardPrefs.cycle(context)
    val lastObs = GuardPrefs.usageCheckpointMs(context)
    return mapOf(
      "usageAccessGranted" to usageAccess,
      "canObserveNativeApps" to usageAccess,
      "canObserveAppOpeningsLive" to usageAccess,
      "canIdentifyBrowserDomains" to false,
      "canPresentImmediateIntervention" to Settings.canDrawOverlays(context),
      "canRestrictNativeApps" to false,
      "canRestrictSelectedDomains" to false,
      "notificationsAllowed" to true,
      "monitoringHealth" to if (usageAccess) "ok" else "needs_usage_access",
      "lastSuccessfulObservationAt" to if (lastObs > 0) lastObs else null,
      "knownLimitations" to listOf(
        "Hard package suspension unavailable without device-owner",
        "Browser domain detection not verified on this build",
        "Usage accounting reconstructed from UsageEvents (not second-perfect live)"
      ),
      "protectionState" to protection,
      "browserDetectionStatus" to "Site cannot be verified.",
      "cycleStatus" to (cycle?.optString("cycleStatus") ?: "NONE")
    )
  }

  fun reconcile(context: Context): Map<String, Any?> {
    val settings = GuardPrefs.settings(context)
    val now = System.currentTimeMillis()
    val elapsed = GuardPrefs.elapsedRealtime()
    val usageAccess = UsageAssembler.hasUsageAccess(context)
    val protection = PolicyEngine.protectionState(settings, usageAccess, now)

    if (protection == PolicyEngine.PROTECTION_DISABLED ||
      protection == PolicyEngine.PROTECTION_PAUSED
    ) {
      return statusMap(context, settings, null, protection, 0)
    }

    if (protection == PolicyEngine.PROTECTION_OUTSIDE) {
      PolicyEngine.endScheduleWindow(context, GuardPrefs.cycle(context), now)
      return statusMap(context, settings, GuardPrefs.cycle(context), protection, 0)
    }

    var cycle = PolicyEngine.ensureCycle(context, settings, now, elapsed)
    var addedMs = 0L
    var cooldownStarted = false

    if (usageAccess && cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE) {
      val packages = targetPackageSet(settings)
      val checkpoint = GuardPrefs.usageCheckpointMs(context).let { if (it <= 0) now - 60_000L else it }
      // Overlap-safe window: re-query last 15s before checkpoint
      val queryStart = (checkpoint - 15_000L).coerceAtLeast(now - 6 * 60 * 60 * 1000L)
      val segments = UsageAssembler.querySegments(context, packages, queryStart, now)
      val seen = mutableSetOf<String>()
      val existing = GuardPrefs.segments(context)
      for (i in 0 until existing.length()) {
        seen.add(existing.getJSONObject(i).optString("dedupeKey"))
      }
      for (seg in segments) {
        if (seg.dedupeKey in seen) continue
        if (seg.confidence != "verified") continue
        seen.add(seg.dedupeKey)
        val json = JSONObject()
          .put("id", GuardPrefs.newCycleId())
          .put("cycleId", cycle.optString("id"))
          .put("packageName", seg.packageName)
          .put("startedAtMs", seg.startedAtMs)
          .put("endedAtMs", seg.endedAtMs)
          .put("durationMs", seg.durationMs)
          .put("confidence", seg.confidence)
          .put("dedupeKey", seg.dedupeKey)
          .put("observationSource", "UsageEvents")
        GuardPrefs.appendSegment(context, json)
        addedMs += seg.durationMs
      }
      GuardPrefs.setUsageCheckpointMs(context, now)
      cycle.put("monitoringQuality", "verified")
      val result = PolicyEngine.applyVerifiedUsage(context, cycle, settings, addedMs, now, elapsed)
      cycle = result.first
      cooldownStarted = result.second

      val remaining = PolicyEngine.remainingAllowanceMs(cycle)
      val warnAt = settings.optInt("countdownWarningSeconds", 60) * 1000L
      if (!warnedThisCycle && remaining in 1 until warnAt && cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE) {
        GuardNotifications.warnOneMinute(context)
        warnedThisCycle = true
      }
      if (cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE && remaining > warnAt) {
        warnedThisCycle = false
      }
    }

    if (cooldownStarted) {
      val replacement = "Άσε το κινητό και πήγαινε στο γραφείο."
      GuardNotifications.cooldownStarted(context, replacement)
      try {
        context.startActivity(
          Intent(context, CooldownActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      } catch (_: Exception) {
        // Presentation may be blocked by Android background activity limits.
      }
    }

    // Opening friction: if current foreground is a target and caps allow
    maybeOpeningFriction(context, settings, now)

    return statusMap(context, settings, cycle, protection, addedMs).toMutableMap().apply {
      put("cooldownJustStarted", cooldownStarted)
      put("addedUsageMs", addedMs)
    }
  }

  private fun maybeOpeningFriction(context: Context, settings: JSONObject, nowMs: Long) {
    if (!settings.optBoolean("openingFrictionEnabled", true)) return
    if (!Settings.canDrawOverlays(context)) return
    if (!UsageAssembler.hasUsageAccess(context)) return
    val maxPerHour = settings.optInt("maxFrictionPerHour", 4)
    if (GuardPrefs.frictionCountThisHour(context, nowMs) >= maxPerHour) return
    val debounce = settings.optInt("sessionDebounceSeconds", 30) * 1000L
    if (nowMs - GuardPrefs.lastFrictionAt(context) < debounce) return

    val packages = targetPackageSet(settings)
    val recent = UsageAssembler.querySegments(context, packages, nowMs - 8_000L, nowMs)
    if (recent.isEmpty()) return
    // Only prompt for a newly started segment near now
    val latest = recent.maxByOrNull { it.startedAtMs } ?: return
    if (nowMs - latest.startedAtMs > 6_000L) return

    GuardPrefs.recordFrictionPrompt(context, nowMs)
    try {
      val intent = Intent(context, OpeningFrictionActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        .putExtra("packageName", latest.packageName)
        .putExtra("pauseSeconds", settings.optInt("openingPauseSeconds", 5))
      context.startActivity(intent)
    } catch (_: Exception) {
    }
  }

  private fun targetPackageSet(settings: JSONObject): Set<String> {
    val arr = settings.optJSONArray("targetPackages") ?: JSONArray()
    val set = mutableSetOf<String>()
    for (i in 0 until arr.length()) set.add(arr.optString(i))
    return set
  }

  private fun statusMap(
    context: Context,
    settings: JSONObject,
    cycle: JSONObject?,
    protection: String,
    addedMs: Long
  ): Map<String, Any?> {
    val now = System.currentTimeMillis()
    val elapsed = GuardPrefs.elapsedRealtime()
    val remainingAllowance = cycle?.let { PolicyEngine.remainingAllowanceMs(it) } ?: 0L
    val remainingCooldown = cycle?.let { PolicyEngine.remainingCooldownMs(it, now, elapsed) } ?: 0L
    return mapOf(
      "protectionState" to protection,
      "cycle" to cycle?.toMap(),
      "remainingAllowanceMs" to remainingAllowance,
      "remainingCooldownMs" to remainingCooldown,
      "settings" to settings.toMap(),
      "capabilities" to capabilities(context),
      "lastUpdatedAtMs" to now,
      "addedUsageMs" to addedMs
    )
  }

  private fun JSONObject.toMap(): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    val keys = keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = get(key)
      map[key] = when (value) {
        is JSONObject -> value.toMap()
        is JSONArray -> {
          val list = mutableListOf<Any?>()
          for (i in 0 until value.length()) {
            val item = value.get(i)
            list.add(if (item is JSONObject) item.toMap() else item)
          }
          list
        }
        JSONObject.NULL -> null
        else -> value
      }
    }
    return map
  }
}
