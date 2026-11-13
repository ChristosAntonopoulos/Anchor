package expo.modules.distractionguard

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

internal object GuardNotifications {
  private const val CHANNEL_MONITOR = "distraction_guard_monitor"
  private const val CHANNEL_ALERT = "distraction_guard_alert_priority"
  const val MONITOR_ID = 6201
  const val WARNING_ID = 6202
  const val COOLDOWN_ID = 6203

  private fun smallIcon(context: Context): Int {
    val anchor = context.resources.getIdentifier("ic_stat_anchor", "drawable", context.packageName)
    return if (anchor != 0) anchor else android.R.drawable.ic_dialog_info
  }

  fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_MONITOR, "Distraction Guard monitoring", NotificationManager.IMPORTANCE_LOW)
    )
    nm.deleteNotificationChannel("distraction_guard_alert")
    if (nm.getNotificationChannel(CHANNEL_ALERT) == null) {
      nm.createNotificationChannel(
        NotificationChannel(CHANNEL_ALERT, "Distraction Guard alerts", NotificationManager.IMPORTANCE_HIGH).apply {
          setBypassDnd(true)
          lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
        }
      )
    }
  }

  fun ongoing(context: Context): android.app.Notification {
    ensureChannels(context)
    return NotificationCompat.Builder(context, CHANNEL_MONITOR)
      .setContentTitle("Distraction Guard")
      .setContentText("Monitoring selected apps")
      .setSmallIcon(smallIcon(context))
      .setOngoing(true)
      .setSilent(true)
      .build()
  }

  fun warnOneMinute(context: Context) {
    ensureChannels(context)
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notification = NotificationCompat.Builder(context, CHANNEL_ALERT)
      .setContentTitle("Distraction Guard")
      .setContentText("1 minute left on selected apps.")
      .setSmallIcon(smallIcon(context))
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setAutoCancel(true)
      .build()
    nm.notify(WARNING_ID, notification)
  }

  fun cooldownStarted(context: Context, replacement: String) {
    ensureChannels(context)
    val open = Intent(context, CooldownActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    val pi = PendingIntent.getActivity(
      context,
      0,
      open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notification = NotificationCompat.Builder(context, CHANNEL_ALERT)
      .setContentTitle("Time for a break")
      .setContentText(replacement)
      .setSmallIcon(smallIcon(context))
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setContentIntent(pi)
      .setAutoCancel(true)
      .build()
    nm.notify(COOLDOWN_ID, notification)
  }
}
