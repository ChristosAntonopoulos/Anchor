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
  private const val BOOT_ID = "boot_id"
  private const val SEGMENTS = "segments_json"
  private const val DAILY = "daily_json"
  private const val LAST_FRICTION_AT = "last_friction_at"
  private const val FRICTION_HOUR_COUNT = "friction_hour_count"
  private const val FRICTION_HOUR_BUCKET = "friction_hour_bucket"

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
      .put("enabled", true)
      .put("setupComplete", false)
      .put("allowanceSeconds", 300)
      .put("cooldownSeconds", 900)
      .put("scheduleStartMinutes", 7 * 60)
      .put("scheduleEndMinutes", 23 * 60)
      .put("activeDays", JSONArray(listOf(0, 1, 2, 3, 4, 5, 6)))
      .put("targetPackages", packages)
      .put("targetHosts", hosts)
      .put("openingFrictionEnabled", true)
      .put("openingPauseSeconds", 5)
      .put("maxFrictionPerHour", 4)
      .put("sessionDebounceSeconds", 30)
      .put("countdownWarningSeconds", 60)
      .put("unlockToDistractionWindowSeconds", 60)
      .put("treatWholeBrowserAsDistracting", false)
      .put("intentionalUsesSharedAllowance", true)
      .put("pausedUntilMs", 0)
      .put("version", 1)
  }

  fun settings(context: Context): JSONObject {
    val raw = store(context).getString(SETTINGS, null)
    return if (raw.isNullOrBlank()) defaultSettingsJson() else JSONObject(raw)
  }

  fun saveSettings(context: Context, json: JSONObject) {
    store(context).edit().putString(SETTINGS, json.toString()).apply()
  }

  fun cycle(context: Context): JSONObject? {
    val raw = store(context).getString(CYCLE, null) ?: return null
    return JSONObject(raw)
  }

  fun saveCycle(context: Context, json: JSONObject?) {
    val edit = store(context).edit()
    if (json == null) edit.remove(CYCLE) else edit.putString(CYCLE, json.toString())
    edit.apply()
  }

  fun usageCheckpointMs(context: Context): Long =
    store(context).getLong(CHECKPOINT, 0L)

  fun setUsageCheckpointMs(context: Context, ms: Long) {
    store(context).edit().putLong(CHECKPOINT, ms).apply()
  }

  fun bootId(context: Context): String {
    val existing = store(context).getString(BOOT_ID, null)
    if (!existing.isNullOrBlank()) return existing
    val id = UUID.randomUUID().toString()
    store(context).edit().putString(BOOT_ID, id).apply()
    return id
  }

  fun resetBootId(context: Context) {
    store(context).edit().putString(BOOT_ID, UUID.randomUUID().toString()).apply()
  }

  fun appendSegment(context: Context, segment: JSONObject) {
    val arr = JSONArray(store(context).getString(SEGMENTS, "[]"))
    arr.put(segment)
    // Keep last ~500 segments
    val trimmed = JSONArray()
    val start = maxOf(0, arr.length() - 500)
    for (i in start until arr.length()) trimmed.put(arr.getJSONObject(i))
    store(context).edit().putString(SEGMENTS, trimmed.toString()).apply()
  }

  fun segments(context: Context): JSONArray =
    JSONArray(store(context).getString(SEGMENTS, "[]"))

  fun clearHistory(context: Context) {
    store(context).edit()
      .remove(SEGMENTS)
      .remove(DAILY)
      .apply()
  }

  fun dailyAggregates(context: Context): JSONArray =
    JSONArray(store(context).getString(DAILY, "[]"))

  fun saveDailyAggregates(context: Context, arr: JSONArray) {
    store(context).edit().putString(DAILY, arr.toString()).apply()
  }

  fun lastFrictionAt(context: Context): Long =
    store(context).getLong(LAST_FRICTION_AT, 0L)

  fun recordFrictionPrompt(context: Context, nowMs: Long) {
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

  fun elapsedRealtime(): Long = SystemClock.elapsedRealtime()

  fun newCycleId(): String = UUID.randomUUID().toString()
}
