package expo.modules.distractionguard

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class GuardBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return
    GuardPrefs.resetBootId(context)
    val settings = GuardPrefs.settings(context)
    if (settings.optBoolean("enabled", false) && settings.optBoolean("setupComplete", false)) {
      GuardMonitorService.start(context)
    }
  }
}
