package com.pos.mobile

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

/**
 * Brings the unlock-reason UI forward after ACTION_USER_PRESENT.
 *
 * Direct startActivity from a background service is blocked on Android 14+
 * unless the app can draw over other apps. A high-priority full-screen
 * notification is the fallback when that launch is denied.
 */
object PhoneUnlockPresenter {
    private const val TAG = "PhoneUnlockPresenter"
    private const val CHANNEL_ID = "phone_unlock_channel"
    private const val NOTIFICATION_ID = 1001

    fun onPhoneUnlocked(context: Context, unlockTime: Long) {
        val appContext = context.applicationContext
        android.util.Log.d(TAG, "Phone unlock detected: $unlockTime")
        PhoneUnlockModule.setPendingUnlockTime(unlockTime)
        PhoneUnlockModule.emitUnlock(unlockTime)

        val launch = launchIntent(appContext, unlockTime)
        // Android 14+ often swallows background startActivity without throwing.
        // Always post the heads-up/full-screen notification; MainActivity cancels it
        // if the activity actually comes to the foreground.
        tryStartActivity(appContext, launch)
        showUnlockNotification(appContext, launch)
    }

    fun launchIntent(context: Context, unlockTime: Long): Intent {
        return Intent(context, MainActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
            putExtra("unlockTime", unlockTime)
            putExtra("showUnlockModal", true)
        }
    }

    fun cancelNotification(context: Context) {
        try {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.cancel(NOTIFICATION_ID)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not cancel unlock notification", error)
        }
    }

    private fun tryStartActivity(context: Context, launch: Intent) {
        try {
            context.startActivity(launch)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not start unlock activity", error)
        }
    }

    private fun showUnlockNotification(context: Context, launch: Intent) {
        try {
            createChannel(context)
            val pending = PendingIntent.getActivity(
                context,
                NOTIFICATION_ID,
                launch,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle("Why did you unlock your phone?")
                .setContentText("Tap to record your reason")
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .setContentIntent(pending)
                .setFullScreenIntent(pending, true)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .build()
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NOTIFICATION_ID, notification)
            android.util.Log.d(TAG, "Unlock notification shown")
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not show unlock notification", error)
        }
    }

    private fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Phone Unlock",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Asks why you unlocked the phone"
            setShowBadge(true)
            lockscreenVisibility = Notification.VISIBILITY_PUBLIC
        }
        context.getSystemService(NotificationManager::class.java)
            .createNotificationChannel(channel)
    }
}
