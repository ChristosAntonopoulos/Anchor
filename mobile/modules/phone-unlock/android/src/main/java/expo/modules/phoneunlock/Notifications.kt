package expo.modules.phoneunlock

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

internal object Notifications {
  const val ONGOING_ID = 4101
  const val PROMPT_ID = 4102
  private const val ONGOING_CHANNEL = "unlock_watch"
  private const val PROMPT_CHANNEL = "unlock_prompt"

  fun ensureChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    val ongoing = NotificationChannel(
      ONGOING_CHANNEL,
      "Unlock prompt",
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Keeps the unlock question available"
      setSound(null, null)
      enableVibration(false)
    }
    val prompt = NotificationChannel(
      PROMPT_CHANNEL,
      "Unlock question",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Asks why the phone was unlocked"
      setSound(null, null)
      enableVibration(false)
    }
    manager.createNotificationChannel(ongoing)
    manager.createNotificationChannel(prompt)
  }

  fun ongoing(context: Context): Notification {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val content = launch?.let {
      PendingIntent.getActivity(
        context,
        0,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }
    return NotificationCompat.Builder(context, ONGOING_CHANNEL)
      .setSmallIcon(R.drawable.ic_unlock_prompt)
      .setContentTitle("Unlock prompt is on")
      .setContentText("A short question appears when you unlock the phone.")
      .setOngoing(true)
      .setSilent(true)
      .setContentIntent(content)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }

  fun showPrompt(context: Context, activityIntent: Intent) {
    if (!canNotify(context)) {
      return
    }
    ensureChannels(context)
    val fullScreen = PendingIntent.getActivity(
      context,
      11,
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val notification = NotificationCompat.Builder(context, PROMPT_CHANNEL)
      .setSmallIcon(R.drawable.ic_unlock_prompt)
      .setContentTitle("Why did you unlock?")
      .setContentText("No reason, a task, or a message.")
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setAutoCancel(true)
      .setSilent(true)
      .setFullScreenIntent(fullScreen, true)
      .setContentIntent(fullScreen)
      .addAction(R.drawable.ic_unlock_prompt, "No reason", choiceIntent(context, UnlockChoices.NO_REASON))
      .addAction(R.drawable.ic_unlock_prompt, "A task", choiceIntent(context, UnlockChoices.TASK))
      .addAction(R.drawable.ic_unlock_prompt, "A message", choiceIntent(context, UnlockChoices.MESSAGE))
      .build()
    try {
      NotificationManagerCompat.from(context).notify(PROMPT_ID, notification)
    } catch (_: SecurityException) {
      // Notification permission was denied. The overlay path is the popup.
    }
  }

  fun cancelPrompt(context: Context) {
    NotificationManagerCompat.from(context).cancel(PROMPT_ID)
  }

  private fun choiceIntent(context: Context, choice: String): PendingIntent {
    val intent = Intent(context, PromptActionReceiver::class.java).apply {
      action = PromptActionReceiver.ACTION
      putExtra(PromptActionReceiver.EXTRA_CHOICE, choice)
    }
    return PendingIntent.getBroadcast(
      context,
      choice.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun canNotify(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 33) {
      return true
    }
    return ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.POST_NOTIFICATIONS
    ) == PackageManager.PERMISSION_GRANTED
  }
}
