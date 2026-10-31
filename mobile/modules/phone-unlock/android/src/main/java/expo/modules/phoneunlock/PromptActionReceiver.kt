package expo.modules.phoneunlock

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class PromptActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != ACTION) {
      return
    }
    val choice = intent.getStringExtra(EXTRA_CHOICE) ?: return
    UnlockPrompter.record(context, choice)
  }

  companion object {
    const val ACTION = "expo.modules.phoneunlock.PROMPT_CHOICE"
    const val EXTRA_CHOICE = "choice"
  }
}
