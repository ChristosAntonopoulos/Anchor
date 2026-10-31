package expo.modules.phoneunlock

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

internal object UnlockPrompter {
  private const val DEBOUNCE_MS = 15_000L

  fun show(context: Context) {
    if (!Prefs.isEnabled(context)) {
      return
    }
    val now = System.currentTimeMillis()
    val last = Prefs.lastPromptAt(context)
    if (last > 0 && now >= last && now - last < DEBOUNCE_MS) {
      return
    }
    Prefs.setLastPromptAt(context, now)

    val activityIntent = Intent(context, UnlockPopupActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }

    if (Settings.canDrawOverlays(context)) {
      try {
        context.startActivity(activityIntent)
        return
      } catch (_: Exception) {
        // Fall through to the notification, which still has the three buttons.
      }
    }

    Notifications.showPrompt(context, activityIntent)
  }

  fun record(context: Context, choice: String) {
    Prefs.setLastChoice(context, choice)
    Notifications.cancelPrompt(context)
    if (choice == UnlockChoices.TASK) {
      openTasks(context)
    }
  }

  private fun openTasks(context: Context) {
    val view = Intent(Intent.ACTION_VIEW, Uri.parse("pos://tasks")).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
    if (view.resolveActivity(context.packageManager) != null) {
      context.startActivity(view)
      return
    }
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(launch)
  }
}
