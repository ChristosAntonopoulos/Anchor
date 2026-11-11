package expo.modules.phoneunlock

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal object UnlockChoices {
  const val NO_REASON = "no_reason"
  const val TASK = "task"
  const val MESSAGE = "message"
}

internal object Prefs {
  private const val NAME = "phone_unlock"
  private const val ENABLED = "enabled"
  private const val LAST_CHOICE = "last_choice"
  private const val LAST_PROMPT_AT = "last_prompt_at"
  private const val UNLOCK_EVENTS = "unlock_events"
  private const val MAX_EVENTS = 200

  private fun store(context: Context) = context.getSharedPreferences(NAME, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = store(context).getBoolean(ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    store(context).edit().putBoolean(ENABLED, enabled).apply()
  }

  fun lastChoice(context: Context): String = store(context).getString(LAST_CHOICE, "") ?: ""

  fun setLastChoice(context: Context, choice: String) {
    store(context).edit().putString(LAST_CHOICE, choice).apply()
  }

  fun lastPromptAt(context: Context): Long = store(context).getLong(LAST_PROMPT_AT, 0L)

  fun setLastPromptAt(context: Context, at: Long) {
    store(context).edit().putLong(LAST_PROMPT_AT, at).apply()
  }

  /**
   * Records an unlock observation for Distraction Guard associations.
   * Does not create a second unlock detector — called from the existing USER_PRESENT path.
   */
  fun recordUnlockEvent(context: Context, timestampMs: Long = System.currentTimeMillis()): JSONObject {
    val event = JSONObject()
      .put("id", UUID.randomUUID().toString())
      .put("timestampMs", timestampMs)
    val existing = JSONArray(store(context).getString(UNLOCK_EVENTS, "[]"))
    val next = JSONArray()
    next.put(event)
    val start = maxOf(0, existing.length() - (MAX_EVENTS - 1))
    for (i in start until existing.length()) {
      next.put(existing.getJSONObject(i))
    }
    store(context).edit().putString(UNLOCK_EVENTS, next.toString()).apply()
    return event
  }

  fun recentUnlockEvents(context: Context, limit: Int = 50): List<Map<String, Any?>> {
    val existing = JSONArray(store(context).getString(UNLOCK_EVENTS, "[]"))
    val out = mutableListOf<Map<String, Any?>>()
    val count = minOf(limit, existing.length())
    for (i in 0 until count) {
      val obj = existing.getJSONObject(i)
      out.add(
        mapOf(
          "id" to obj.optString("id"),
          "timestampMs" to obj.optLong("timestampMs")
        )
      )
    }
    return out
  }
}
