package com.pos.mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object MorningModeLauncher {
    const val URL = "pos://os/morning"
    const val EXTRA = "morningMode"
    const val CHANNEL_ID = "os-morning"
    const val NOTIFICATION_ID = 71

    fun consumeUnlock(context: Context, unlockTimeMs: Long, fromUserPresent: Boolean): Boolean {
        val app = context.applicationContext
        val decision = MorningModeLogic.onUnlock(
            MorningModeStore.gate(app),
            unlockTimeMs,
            fromUserPresent,
        )
        MorningModeStore.saveGate(app, decision.gate)
        if (!decision.takeover) {
            return false
        }
        MorningModeStore.markPending(app, true)
        open(app)
        return true
    }

    fun open(context: Context) {
        val app = context.applicationContext
        val launched = overlayGranted(app) && launchActivity(app)
        if (!launched) {
            notify(app)
        }
    }

    fun launchActivity(context: Context): Boolean {
        val intent = activityIntent(context)
        return try {
            context.startActivity(intent)
            true
        } catch (error: Exception) {
            android.util.Log.w("MorningModeLauncher", "Could not start Morning Mode activity", error)
            false
        }
    }

    fun activityIntent(context: Context): Intent {
        return Intent(Intent.ACTION_VIEW, Uri.parse(URL), context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            putExtra(EXTRA, true)
        }
    }

    fun notify(context: Context) {
        ensureChannel(context)
        val pending = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            activityIntent(context),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_day)
            .setContentTitle(context.getString(R.string.morning_notification_title))
            .setContentText(context.getString(R.string.morning_notification_body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .setFullScreenIntent(pending, true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
        } catch (error: Exception) {
            android.util.Log.w("MorningModeLauncher", "Could not post Morning Mode notification", error)
        }
    }

    fun cancelNotification(context: Context) {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }

    fun overlayGranted(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.morning_channel_name),
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = context.getString(R.string.morning_channel_description)
            setSound(null, null)
            enableVibration(false)
        }
        manager.createNotificationChannel(channel)
    }
}
