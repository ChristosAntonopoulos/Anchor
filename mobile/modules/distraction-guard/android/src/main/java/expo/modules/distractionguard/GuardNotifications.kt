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
  private const val CHANNEL_ALERT = "distraction_guard_alert"
  const val MONITOR_ID = 6201
  const val WARNING_ID = 6202
  const val COOLDOWN_ID = 6203

  fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < 26) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_MONITOR, "Distraction Guard monitoring", NotificationManager.IMPORTANCE_LOW)
    )
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_ALERT, "Distraction Guard alerts", NotificationManager.IMPORTANCE_DEFAULT)
    )
  }

  fun ongoing(context: Context): android.app.Notification {
    ensureChannels(context)
    return NotificationCompat.Builder(context, CHANNEL_MONITOR)
      .setContentTitle("Distraction Guard")
      .setContentText("Monitoring selected apps")
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setOngoing(true)
      .setSilent(true)
      .build()
  }

  fun warnOneMinute(context: Context) {
    ensureChannels(context)
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notification = NotificationCompat.Builder(context, CHANNEL_ALERT)
      .setContentTitle("Distraction Guard")
      .setContentText("1 λεπτό απομένει στα επιλεγμένα apps.")
      .setSmallIcon(android.R.drawable.ic_dialog_info)
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
      .setContentTitle("Ώρα για ένα διάλειμμα")
      .setContentText(replacement)
      .setSmallIcon(android.R.drawable.ic_lock_lock)
      .setContentIntent(pi)
      .setAutoCancel(true)
      .build()
    nm.notify(COOLDOWN_ID, notification)
  }
}
