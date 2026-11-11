package expo.modules.distractionguard

import android.content.Context
import android.os.SystemClock
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal object GuardPrefs {
  private const val NAME = "distraction_guard"
  private const val SETTINGS = "settings_json"
  private const val CYCLE = "cycle_json"
  private const val CHECKPOINT = "usage_checkpoint_ms"
  private const val OPEN_CURSOR = "open_cursor_json"
  private const val BOOT_ID = "boot_id"
  private const val LAST_ELAPSED = "last_elapsed_realtime"
  private const val LAST_BOOT_COUNT = "last_boot_count"
  private const val SEGMENTS = "segments_json"
  private const val DAILY = "daily_json"
  private const val INTENTIONAL = "intentional_json"
  private const val BYPASS_EVENTS = "bypass_events_json"
  private const val FRICTION_EVENTS = "friction_events_json"
  private const val UNLOCK_EVENTS = "unlock_events_json"
  private const val LAST_FRICTION_AT = "last_friction_at"
  private const val FRICTION_HOUR_COUNT = "friction_hour_count"
  private const val FRICTION_HOUR_BUCKET = "friction_hour_bucket"
  private const val WARNED_CYCLE_ID = "warned_cycle_id"

  private fun store(context: Context) =
    context.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  fun defaultSettingsJson(): JSONObject {
    val packages = JSONArray()
      .put("com.instagram.android")
      .put("com.google.android.youtube")
    val hosts = JSONArray()
      .put("instagram.com")
      .put("youtube.com")
      .put("m.youtube.com")
      .put("youtu.be")
    return JSONObject()
      .put("enabled", false)
      .put("setupComplete", false)
      .put("allowanceSeconds", 300)
      .put("cooldownSeconds", 900)
      .put("scheduleStartMinutes", 7 * 60)
      .put("scheduleEndMinutes", 23 * 60)
      .put("activeDays", JSONArray(listOf(0, 1, 2, 3, 4, 5, 6)))
      .put("targetPackages", packages)
      .put("targetHosts", hosts)
      .put("browserPackages", JSONArray().put("com.android.chrome").put("com.chrome.beta"))
      .put("openingFrictionEnabled", true)
      .put("openingPauseSeconds", 5)
      .put("maxFrictionPerHour", 4)
      .put("sessionDebounceSeconds", 30)
      .put("countdownWarningSeconds", 60)
      .put("unlockToDistractionWindowSeconds", 60)
      .put("treatWholeBrowserAsDistracting", false)
      .put("intentionalUsesSharedAllowance", true)
      .put("showNextAction", true)
      .put("quietNotifications", false)
      .put("rememberInterventions", true)
      .put("analyzeUnlockPatterns", true)
      .put("trackIntentionalSessions", true)
      .put("suggestWeeklyImprovement", true)
      .put("pausedUntilMs", 0)
      .put("version", 2)
  }

  fun settings(context: Context): JSONObject {
    val raw = store(context).getString(SETTINGS, null) ?: return defaultSettingsJson()
    return try {
      val parsed = JSONObject(raw)
      // Merge defaults for newly added keys without wiping user values.
      val defaults = defaultSettingsJson()
      val keys = defaults.keys()
      while (keys.hasNext()) {
        val k = keys.next()
        if (!parsed.has(k)) parsed.put(k, defaults.get(k))
      }
      parsed
    } catch (_: Exception) {
      defaultSettingsJson()
    }
  }

  fun saveSettings(context: Context, json: JSONObject) {
    store(context).edit().putString(SETTINGS, json.toString()).commit()
  }

  fun resetSettingsKeepHistory(context: Context) {
    saveSettings(context, defaultSettingsJson())
    saveCycle(context, null, commit = true)
  }

  fun cycle(context: Context): JSONObject? {
    val raw = store(context).getString(CYCLE, null) ?: return null
    return try {
      JSONObject(raw)
    } catch (_: Exception) {
      null
    }
  }

  fun saveCycle(context: Context, json: JSONObject?, commit: Boolean = false) {
    val edit = store(context).edit()
    if (json == null) edit.remove(CYCLE) else edit.putString(CYCLE, json.toString())
    if (commit) edit.commit() else edit.apply()
  }

  fun usageCheckpointMs(context: Context): Long =
    store(context).getLong(CHECKPOINT, 0L)

  fun setUsageCheckpointMs(context: Context, ms: Long) {
    store(context).edit().putLong(CHECKPOINT, ms).apply()
  }

  fun openCursor(context: Context): JSONObject? {
    val raw = store(context).getString(OPEN_CURSOR, null) ?: return null
    return try {
      JSONObject(raw)
    } catch (_: Exception) {
      null
    }
  }

  fun saveOpenCursor(context: Context, json: JSONObject?) {
    val edit = store(context).edit()
    if (json == null) edit.remove(OPEN_CURSOR) else edit.putString(OPEN_CURSOR, json.toString())
    edit.commit()
  }

  /**
   * Stable per-boot identity. Rotates on BOOT_COMPLETED and also if we detect a reboot
   * via Settings boot count or elapsedRealtime regression (OEM receivers can be delayed).
   */
  fun bootId(context: Context): String {
    ensureBootIdentity(context)
    val existing = store(context).getString(BOOT_ID, null)
    if (!existing.isNullOrBlank()) return existing
    val id = UUID.randomUUID().toString()
    store(context).edit().putString(BOOT_ID, id).commit()
    return id
  }

  fun resetBootId(context: Context) {
    val id = UUID.randomUUID().toString()
    store(context).edit()
      .putString(BOOT_ID, id)
      .putLong(LAST_ELAPSED, SystemClock.elapsedRealtime())
      .putInt(LAST_BOOT_COUNT, readSystemBootCount(context))
      .commit()
  }

  private fun ensureBootIdentity(context: Context) {
    val prefs = store(context)
    val elapsed = SystemClock.elapsedRealtime()
    val lastElapsed = prefs.getLong(LAST_ELAPSED, -1L)
    val bootCount = readSystemBootCount(context)
    val lastBootCount = prefs.getInt(LAST_BOOT_COUNT, -1)
    val rebootDetected =
      (bootCount >= 0 && lastBootCount >= 0 && bootCount != lastBootCount) ||
        (lastElapsed >= 0 && elapsed + 5_000L < lastElapsed)
    if (rebootDetected || prefs.getString(BOOT_ID, null).isNullOrBlank()) {
      resetBootId(context)
      return
    }
    prefs.edit().putLong(LAST_ELAPSED, elapsed).apply()
  }

  private fun readSystemBootCount(context: Context): Int {
    return try {
      android.provider.Settings.Global.getInt(
        context.contentResolver,
        android.provider.Settings.Global.BOOT_COUNT,
        -1
      )
    } catch (_: Exception) {
      -1
    }
  }

  fun appendSegment(context: Context, segment: JSONObject) {
    val arr = safeArray(store(context).getString(SEGMENTS, "[]"))
    arr.put(segment)
    val trimmed = JSONArray()
    val start = maxOf(0, arr.length() - 800)
    for (i in start until arr.length()) trimmed.put(arr.getJSONObject(i))
    store(context).edit().putString(SEGMENTS, trimmed.toString()).apply()
  }

  fun segments(context: Context): JSONArray =
    safeArray(store(context).getString(SEGMENTS, "[]"))

  fun clearHistory(context: Context) {
    store(context).edit()
      .remove(SEGMENTS)
      .remove(DAILY)
      .remove(INTENTIONAL)
      .remove(BYPASS_EVENTS)
      .remove(FRICTION_EVENTS)
      .remove(UNLOCK_EVENTS)
      .remove(OPEN_CURSOR)
      .commit()
  }

  fun appendIntentional(context: Context, session: JSONObject) {
    val arr = safeArray(store(context).getString(INTENTIONAL, "[]"))
    arr.put(session)
    store(context).edit().putString(INTENTIONAL, trimArray(arr, 200).toString()).apply()
  }

  fun intentionalSessions(context: Context): JSONArray =
    safeArray(store(context).getString(INTENTIONAL, "[]"))

  fun appendBypassEvent(context: Context, event: JSONObject) {
    val arr = safeArray(store(context).getString(BYPASS_EVENTS, "[]"))
    arr.put(event)
    store(context).edit().putString(BYPASS_EVENTS, trimArray(arr, 100).toString()).apply()
  }

  fun appendFrictionEvent(context: Context, event: JSONObject) {
    val arr = safeArray(store(context).getString(FRICTION_EVENTS, "[]"))
    arr.put(event)
    store(context).edit().putString(FRICTION_EVENTS, trimArray(arr, 200).toString()).apply()
  }

  fun frictionEvents(context: Context): JSONArray =
    safeArray(store(context).getString(FRICTION_EVENTS, "[]"))

  fun recordUnlockEvent(context: Context, timestampMs: Long = System.currentTimeMillis()): JSONObject {
    val event = JSONObject()
      .put("id", UUID.randomUUID().toString())
      .put("timestampMs", timestampMs)
    val arr = safeArray(store(context).getString(UNLOCK_EVENTS, "[]"))
    val next = JSONArray()
    next.put(event)
    val start = maxOf(0, arr.length() - 199)
    for (i in start until arr.length()) next.put(arr.getJSONObject(i))
    store(context).edit().putString(UNLOCK_EVENTS, next.toString()).apply()
    return event
  }

  fun unlockEvents(context: Context, limit: Int = 50): List<Map<String, Any?>> {
    val arr = safeArray(store(context).getString(UNLOCK_EVENTS, "[]"))
    val out = mutableListOf<Map<String, Any?>>()
    val count = minOf(limit, arr.length())
    for (i in 0 until count) {
      val obj = arr.getJSONObject(i)
      out.add(
        mapOf(
          "id" to obj.optString("id"),
          "timestampMs" to obj.optLong("timestampMs")
        )
      )
    }
    return out
  }

  fun lastFrictionAt(context: Context): Long =
    store(context).getLong(LAST_FRICTION_AT, 0L)

  fun recordFrictionPrompt(context: Context, nowMs: Long, presented: Boolean) {
    if (!presented) return
    val hourBucket = nowMs / 3_600_000L
    val prefs = store(context)
    val currentBucket = prefs.getLong(FRICTION_HOUR_BUCKET, -1L)
    val count = if (currentBucket == hourBucket) prefs.getInt(FRICTION_HOUR_COUNT, 0) + 1 else 1
    prefs.edit()
      .putLong(LAST_FRICTION_AT, nowMs)
      .putLong(FRICTION_HOUR_BUCKET, hourBucket)
      .putInt(FRICTION_HOUR_COUNT, count)
      .apply()
  }

  fun frictionCountThisHour(context: Context, nowMs: Long): Int {
    val hourBucket = nowMs / 3_600_000L
    val prefs = store(context)
    return if (prefs.getLong(FRICTION_HOUR_BUCKET, -1L) == hourBucket) {
      prefs.getInt(FRICTION_HOUR_COUNT, 0)
    } else 0
  }

  fun hasWarnedForCycle(context: Context, cycleId: String): Boolean =
    store(context).getString(WARNED_CYCLE_ID, "") == cycleId

  fun markWarnedForCycle(context: Context, cycleId: String) {
    store(context).edit().putString(WARNED_CYCLE_ID, cycleId).apply()
  }

  fun clearWarnedFlag(context: Context) {
    store(context).edit().remove(WARNED_CYCLE_ID).apply()
  }

  fun elapsedRealtime(): Long = SystemClock.elapsedRealtime()

  fun newCycleId(): String = UUID.randomUUID().toString()

  private fun safeArray(raw: String?): JSONArray {
    return try {
      JSONArray(raw ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }
  }

  private fun trimArray(arr: JSONArray, max: Int): JSONArray {
    if (arr.length() <= max) return arr
    val trimmed = JSONArray()
    val start = arr.length() - max
    for (i in start until arr.length()) trimmed.put(arr.get(i))
    return trimmed
  }
}
