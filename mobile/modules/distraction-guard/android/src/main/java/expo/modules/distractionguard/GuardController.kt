package expo.modules.distractionguard

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

/**
 * Orchestrates read-only status and reconcile: usage query → dedupe → cycle update → interventions.
 */
internal object GuardController {

  fun notificationsGranted(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 33) return true
    return ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.POST_NOTIFICATIONS
    ) == PackageManager.PERMISSION_GRANTED
  }

  fun capabilities(context: Context): Map<String, Any?> {
    val usageAccess = UsageAssembler.hasUsageAccess(context)
    val settings = GuardPrefs.settings(context)
    val now = System.currentTimeMillis()
    val protection = PolicyEngine.protectionState(settings, usageAccess, now)
    val cycle = GuardPrefs.cycle(context)
    val lastObs = GuardPrefs.usageCheckpointMs(context)
    val overlay = Settings.canDrawOverlays(context)
    return mapOf(
      "usageAccessGranted" to usageAccess,
      "canObserveNativeApps" to usageAccess,
      "canObserveAppOpeningsLive" to false,
      "canObserveAppOpeningsReconciled" to usageAccess,
      "canIdentifyBrowserDomains" to false,
      "canPresentImmediateIntervention" to overlay,
      "canRestrictNativeApps" to false,
      "canRestrictSelectedDomains" to false,
      "notificationsAllowed" to notificationsGranted(context),
      "overlayGranted" to overlay,
      "monitoringHealth" to when {
        !settings.optBoolean("enabled", false) -> "disabled"
        !usageAccess -> "needs_usage_access"
        else -> "ok_reconciled"
      },
      "lastSuccessfulObservationAt" to if (lastObs > 0) lastObs else null,
      "knownLimitations" to listOf(
        "Hard package suspension unavailable without device-owner",
        "Browser domain detection not verified on this build",
        "Usage accounting reconstructed from UsageEvents (~20s reconcile, not second-perfect)",
        "Opening friction / cooldown activities may be blocked by Android background launch limits; notifications remain"
      ),
      "protectionState" to protection,
      "browserDetectionStatus" to if (settings.optBoolean("treatWholeBrowserAsDistracting", false)) {
        "Whole-browser counting enabled (not site-level)."
      } else {
        "Site cannot be verified."
      },
      "cycleStatus" to (cycle?.optString("cycleStatus") ?: "NONE"),
      "bypassActive" to (
        cycle != null && PolicyEngine.isBypassActive(
          cycle,
          now,
          GuardPrefs.elapsedRealtime()
        )
        )
    )
  }

  /** Read-only snapshot; does not mutate timers or query usage. */
  fun status(context: Context): Map<String, Any?> {
    val settings = GuardPrefs.settings(context)
    val now = System.currentTimeMillis()
    val elapsed = GuardPrefs.elapsedRealtime()
    val usageAccess = UsageAssembler.hasUsageAccess(context)
    val protection = PolicyEngine.protectionState(settings, usageAccess, now)
    val cycle = GuardPrefs.cycle(context)
    val open = GuardPrefs.openCursor(context)
    return statusMap(
      context,
      settings,
      cycle,
      protection,
      addedMs = 0,
      provisionalMs = open?.optLong("durationMs", 0L) ?: 0L,
      querySucceeded = null
    ).toMutableMap().apply {
      put("remainingCooldownMs", cycle?.let {
        PolicyEngine.remainingCooldownMs(it, now, elapsed)
      } ?: 0L)
      put("bypassActive", cycle != null && PolicyEngine.isBypassActive(cycle, now, elapsed))
    }
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
      return statusMap(context, settings, GuardPrefs.cycle(context), protection, 0, 0, false)
    }

    if (protection == PolicyEngine.PROTECTION_OUTSIDE) {
      PolicyEngine.endScheduleWindow(context, GuardPrefs.cycle(context), now)
      return statusMap(context, settings, GuardPrefs.cycle(context), protection, 0, 0, false)
    }

    var cycle = PolicyEngine.ensureCycle(context, settings, now, elapsed)
    var addedMs = 0L
    var provisionalMs = 0L
    var cooldownStarted = false
    var querySucceeded = false

    if (usageAccess) {
      val packages = targetPackageSet(settings)
      val checkpoint = GuardPrefs.usageCheckpointMs(context).let { if (it <= 0) now - 60_000L else it }
      val queryStart = (checkpoint - 30_000L).coerceAtLeast(now - 6 * 60 * 60 * 1000L)
      val result = UsageAssembler.querySegments(context, packages, queryStart, now)
      querySucceeded = true

      val seen = mutableSetOf<String>()
      val existing = GuardPrefs.segments(context)
      for (i in 0 until existing.length()) {
        seen.add(existing.getJSONObject(i).optString("dedupeKey"))
      }

      if (cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE &&
        !PolicyEngine.isBypassActive(cycle, now, elapsed)
      ) {
        for (seg in result.closedSegments) {
          if (seg.dedupeKey in seen) continue
          if (seg.confidence != "verified") continue
          seen.add(seg.dedupeKey)
          val json = UsageAssembler.toJson(seg)
            .put("id", GuardPrefs.newCycleId())
            .put("cycleId", cycle.optString("id"))
            .put("observationSource", "UsageEvents")
          GuardPrefs.appendSegment(context, json)
          addedMs += seg.durationMs
        }
        val applied = PolicyEngine.applyVerifiedUsage(context, cycle, settings, addedMs, now, elapsed)
        cycle = applied.first
        cooldownStarted = applied.second
      }

      // Persist open cursor for UI provisional display; do not count toward allowance.
      val open = result.openProvisional
      if (open != null) {
        provisionalMs = open.durationMs
        GuardPrefs.saveOpenCursor(context, UsageAssembler.toJson(open))
      } else {
        GuardPrefs.saveOpenCursor(context, null)
      }

      // Don't advance checkpoint past an unresolved open start.
      val openStart = open?.startedAtMs
      if (openStart != null) {
        GuardPrefs.setUsageCheckpointMs(context, openStart.coerceAtMost(now))
      } else {
        GuardPrefs.setUsageCheckpointMs(context, now)
      }
      cycle.put("monitoringQuality", "verified")
      GuardPrefs.saveCycle(context, cycle, commit = true)

      val remaining = PolicyEngine.remainingAllowanceMs(cycle)
      val warnAt = settings.optInt("countdownWarningSeconds", 60) * 1000L
      val cycleId = cycle.optString("id")
      if (cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE &&
        remaining in 1 until warnAt &&
        !GuardPrefs.hasWarnedForCycle(context, cycleId)
      ) {
        if (notificationsGranted(context) && !settings.optBoolean("quietNotifications", false)) {
          GuardNotifications.warnOneMinute(context)
        }
        GuardPrefs.markWarnedForCycle(context, cycleId)
      }
    }

    if (cooldownStarted) {
      val replacement = "Put the phone down and go to your desk."
      if (notificationsGranted(context)) {
        GuardNotifications.cooldownStarted(context, replacement)
      }
      var presented = false
      try {
        context.startActivity(
          Intent(context, CooldownActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        presented = true
      } catch (_: Exception) {
      }
      GuardPrefs.appendFrictionEvent(
        context,
        JSONObject()
          .put("type", "cooldown_presentation")
          .put("presented", presented)
          .put("atMs", now)
          .put("cycleId", cycle.optString("id"))
      )
    }

    if (cycle.optString("cycleStatus") == PolicyEngine.CYCLE_ALLOWANCE &&
      !PolicyEngine.isBypassActive(cycle, now, elapsed)
    ) {
      maybeOpeningFriction(context, settings, now)
    }

    return statusMap(
      context,
      settings,
      cycle,
      protection,
      addedMs,
      provisionalMs,
      querySucceeded
    ).toMutableMap().apply {
      put("cooldownJustStarted", cooldownStarted)
      put("bypassActive", PolicyEngine.isBypassActive(cycle, now, elapsed))
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
    val latest = recent.closedSegments.maxByOrNull { it.startedAtMs }
      ?: recent.openProvisional
      ?: return
    if (nowMs - latest.startedAtMs > 6_000L) return

    var presented = false
    try {
      val intent = Intent(context, OpeningFrictionActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        .putExtra("packageName", latest.packageName)
        .putExtra("pauseSeconds", settings.optInt("openingPauseSeconds", 5))
      context.startActivity(intent)
      presented = true
    } catch (_: Exception) {
    }
    GuardPrefs.recordFrictionPrompt(context, nowMs, presented)
    GuardPrefs.appendFrictionEvent(
      context,
      JSONObject()
        .put("type", "opening_friction")
        .put("presented", presented)
        .put("packageName", latest.packageName)
        .put("atMs", nowMs)
    )
  }

  fun targetPackageSet(settings: JSONObject): Set<String> {
    val set = mutableSetOf<String>()
    val arr = settings.optJSONArray("targetPackages") ?: JSONArray()
    for (i in 0 until arr.length()) set.add(arr.optString(i))
    if (settings.optBoolean("treatWholeBrowserAsDistracting", false)) {
      val browsers = settings.optJSONArray("browserPackages") ?: JSONArray()
      for (i in 0 until browsers.length()) set.add(browsers.optString(i))
    }
    return set.filter { it.isNotBlank() }.toSet()
  }

  private fun statusMap(
    context: Context,
    settings: JSONObject,
    cycle: JSONObject?,
    protection: String,
    addedMs: Long,
    provisionalMs: Long,
    querySucceeded: Boolean?
  ): Map<String, Any?> {
    val now = System.currentTimeMillis()
    val elapsed = GuardPrefs.elapsedRealtime()
    val remainingAllowance = cycle?.let { PolicyEngine.remainingAllowanceMs(it) } ?: 0L
    val remainingCooldown = cycle?.let { PolicyEngine.remainingCooldownMs(it, now, elapsed) } ?: 0L
    return mapOf(
      "protectionState" to protection,
      "cycle" to cycle?.let { jsonToMap(it) },
      "remainingAllowanceMs" to remainingAllowance,
      "remainingCooldownMs" to remainingCooldown,
      "provisionalUsageMs" to provisionalMs,
      "settings" to jsonToMap(settings),
      "capabilities" to capabilities(context),
      "lastUpdatedAtMs" to now,
      "lastReconcileSucceeded" to querySucceeded,
      "addedUsageMs" to addedMs
    )
  }

  fun jsonToMap(json: JSONObject): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    val keys = json.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = json.get(key)
      map[key] = when (value) {
        is JSONObject -> jsonToMap(value)
        is JSONArray -> {
          val list = mutableListOf<Any?>()
          for (i in 0 until value.length()) {
            val item = value.get(i)
            list.add(if (item is JSONObject) jsonToMap(item) else if (item == JSONObject.NULL) null else item)
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
