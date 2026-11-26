package com.pos.mobile

import android.app.Notification
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import com.pos.mobile.launcher.LockScreenNotificationsLogic

data class LockNotifSnapshot(
    val count: Int,
    val badge: String?,
    val muted: Boolean,
    val policyAccessGranted: Boolean,
    /** Latest own assistant push title for a calm lock-face cue (may be null). */
    val assistantCue: String? = null,
)

/**
 * Lock-face notification badge (shade clearable count) + one-tap mute/DND toggle.
 * Count needs Notification access; mute needs Notification policy (DND) access.
 */
object LockScreenNotifications {
    private const val TAG = "LockScreenNotifications"
    /** Event-driven via listener + interruption filter; rare catch-up only. */
    private const val SAFETY_NET_MS = 60_000L
    private val mainHandler = Handler(Looper.getMainLooper())

    /** Channel ids that carry assistant pushes (current + stale upgrades). */
    private val ASSISTANT_CHANNELS = setOf(
        "os-assistant-alert",
        "os-assistant",
        "os-assistant-priority",
    )

    fun snapshot(context: Context): LockNotifSnapshot {
        val nm = context.getSystemService(NotificationManager::class.java)
        val policyGranted = nm?.isNotificationPolicyAccessGranted == true
        val filter = nm?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_ALL
        val muted = LockScreenNotificationsLogic.isMuted(filter)
        val count = countActive(context)
        return LockNotifSnapshot(
            count = count,
            badge = LockScreenNotificationsLogic.badgeLabel(count),
            muted = muted,
            policyAccessGranted = policyGranted,
            assistantCue = latestAssistantTitle(context),
        )
    }

    /**
     * Latest active Anchor assistant notification title (own package via [NotificationManager]).
     * Used for a calm lock-face status line while [LockScreenActivity] covers the system shade.
     */
    fun latestAssistantTitle(context: Context): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return null
        val nm = context.getSystemService(NotificationManager::class.java) ?: return null
        return try {
            nm.activeNotifications
                .asSequence()
                .filter { sbn ->
                    val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        sbn.notification.channelId
                    } else {
                        null
                    }
                    channelId != null && channelId in ASSISTANT_CHANNELS
                }
                .maxByOrNull { it.postTime }
                ?.notification
                ?.extras
                ?.getCharSequence(Notification.EXTRA_TITLE)
                ?.toString()
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not read assistant notification title", error)
            null
        }
    }

    fun countActive(context: Context): Int {
        val service = POSNotificationListenerService.getInstance() ?: return 0
        return try {
            val own = context.packageName
            service.activeNotifications.orEmpty().count { sbn ->
                val flags = sbn.notification?.flags ?: 0
                val summary = (flags and Notification.FLAG_GROUP_SUMMARY) != 0
                LockScreenNotificationsLogic.countsTowardBadge(
                    packageName = sbn.packageName,
                    ownPackage = own,
                    isGroupSummary = summary,
                    isClearable = sbn.isClearable,
                )
            }
        } catch (error: SecurityException) {
            android.util.Log.d(TAG, "Notification listener not enabled for badge")
            0
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not count notifications", error)
            0
        }
    }

    /**
     * Observe shade + interruption-filter changes. Unsubscribe on the main thread.
     */
    fun observe(context: Context, onChange: (LockNotifSnapshot) -> Unit): () -> Unit {
        val app = context.applicationContext
        val listener = object : POSNotificationListenerService.CallObserver {
            override fun onCallNotificationsChanged() = publish(app, onChange)
        }
        POSNotificationListenerService.addCallObserver(listener)

        val filterReceiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context?, intent: Intent?) {
                publish(app, onChange)
            }
        }
        val filter = IntentFilter(NotificationManager.ACTION_INTERRUPTION_FILTER_CHANGED)
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                app.registerReceiver(filterReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                @Suppress("UnspecifiedRegisterReceiverFlag")
                app.registerReceiver(filterReceiver, filter)
            }
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not register interruption filter receiver", error)
        }

        publish(app, onChange)
        val poll = object : Runnable {
            override fun run() {
                publish(app, onChange)
                mainHandler.postDelayed(this, SAFETY_NET_MS)
            }
        }
        mainHandler.postDelayed(poll, SAFETY_NET_MS)

        return {
            POSNotificationListenerService.removeCallObserver(listener)
            mainHandler.removeCallbacks(poll)
            try {
                app.unregisterReceiver(filterReceiver)
            } catch (_: Exception) {
            }
        }
    }

    /**
     * Toggle hard mute (NONE ↔ ALL). Returns true when the filter changed.
     * When policy access is missing, returns false — caller should open settings.
     */
    fun toggleMute(context: Context): Boolean {
        val nm = context.getSystemService(NotificationManager::class.java) ?: return false
        if (!nm.isNotificationPolicyAccessGranted) {
            return false
        }
        val muted = LockScreenNotificationsLogic.isMuted(nm.currentInterruptionFilter)
        val next = LockScreenNotificationsLogic.nextInterruptionFilter(muted)
        return try {
            nm.setInterruptionFilter(next)
            true
        } catch (error: SecurityException) {
            android.util.Log.w(TAG, "No policy access to toggle mute", error)
            false
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not toggle interruption filter", error)
            false
        }
    }

    fun openPolicyAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            context.startActivity(intent)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not open notification policy settings", error)
        }
    }

    private fun publish(context: Context, onChange: (LockNotifSnapshot) -> Unit) {
        mainHandler.post {
            try {
                onChange(snapshot(context))
            } catch (error: Exception) {
                android.util.Log.w(TAG, "Notif snapshot publish failed", error)
            }
        }
    }
}
