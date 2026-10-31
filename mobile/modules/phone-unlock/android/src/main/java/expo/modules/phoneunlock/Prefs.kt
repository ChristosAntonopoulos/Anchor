package expo.modules.phoneunlock

import android.content.Context

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
}
