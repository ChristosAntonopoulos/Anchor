package com.pos.mobile

import android.app.ActivityOptions
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.notification.StatusBarNotification
import com.pos.mobile.launcher.LockScreenCallLogic

data class CallLockSnapshot(
    val key: String,
    val caller: String,
    val phase: LockScreenCallLogic.Phase,
    val packageName: String,
    val answer: PendingIntent?,
    val declineOrHangUp: PendingIntent?,
    val contentIntent: PendingIntent?,
)

/**
 * Surfaces ringing / active call notifications on the lock face via the
 * existing [POSNotificationListenerService] (Notification access).
 * Fires dialer Answer / Decline / Hang up PendingIntents — no dialer-role takeover.
 */
object LockScreenCall {
    private const val TAG = "LockScreenCall"
    /** Event-driven via notification listener; rare catch-up only. */
    private const val SAFETY_NET_MS = 60_000L
    private val mainHandler = Handler(Looper.getMainLooper())

    fun snapshot(context: Context): CallLockSnapshot? {
        val service = POSNotificationListenerService.getInstance() ?: return null
        return try {
            val active = service.activeNotifications ?: return null
            pickCall(active)
        } catch (error: SecurityException) {
            android.util.Log.d(TAG, "Notification listener not enabled for calls")
            null
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not read call notifications", error)
            null
        }
    }

    /**
     * Observe call notification changes. Returns an unsubscribe that must run on the main thread.
     */
    fun observe(context: Context, onChange: (CallLockSnapshot?) -> Unit): () -> Unit {
        val app = context.applicationContext
        val listener = object : POSNotificationListenerService.CallObserver {
            override fun onCallNotificationsChanged() = publish(app, onChange)
        }
        POSNotificationListenerService.addCallObserver(listener)
        publish(app, onChange)
        // Rare safety net only — primary path is the notification listener (no 2.5s wakeups).
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
        }
    }

    fun answer(context: Context, snap: CallLockSnapshot?): Boolean = send(context, snap?.answer)

    fun declineOrHangUp(context: Context, snap: CallLockSnapshot?): Boolean =
        send(context, snap?.declineOrHangUp)

    fun openCallUi(context: Context, snap: CallLockSnapshot?): Boolean =
        send(context, snap?.contentIntent)

    private fun send(context: Context, intent: PendingIntent?): Boolean {
        if (intent == null) return false
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                val options = ActivityOptions.makeBasic().apply {
                    setPendingIntentBackgroundActivityStartMode(
                        ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED,
                    )
                }
                intent.send(context, 0, null, null, null, null, options.toBundle())
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                intent.send(context, 0, null, null, null, null, null)
            } else {
                intent.send()
            }
            true
        } catch (error: PendingIntent.CanceledException) {
            android.util.Log.w(TAG, "Call PendingIntent canceled", error)
            false
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not fire call PendingIntent", error)
            false
        }
    }

    private fun publish(context: Context, onChange: (CallLockSnapshot?) -> Unit) {
        val snap = snapshot(context)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            onChange(snap)
        } else {
            mainHandler.post { onChange(snap) }
        }
    }

    private fun pickCall(notifications: Array<StatusBarNotification>): CallLockSnapshot? {
        return notifications
            .asSequence()
            .mapNotNull { toSnapshot(it) }
            .sortedWith(
                compareByDescending<CallLockSnapshot> {
                    it.phase == LockScreenCallLogic.Phase.Incoming
                }.thenByDescending { it.key },
            )
            .firstOrNull()
    }

    private fun toSnapshot(sbn: StatusBarNotification): CallLockSnapshot? {
        val notification = sbn.notification ?: return null
        val extras = notification.extras
        val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val text = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString()
        val subText = extras?.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString()
        val actions = notification.actions.orEmpty().map { action ->
            LockScreenCallLogic.ActionHint(
                title = action.title?.toString().orEmpty(),
                semanticAction = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    action.semanticAction
                } else {
                    null
                },
            )
        }
        val ongoing = notification.flags and Notification.FLAG_ONGOING_EVENT != 0
        if (!LockScreenCallLogic.isLikelyCallNotification(
                category = notification.category,
                packageName = sbn.packageName,
                actions = actions,
                isOngoing = ongoing,
            )
        ) {
            return null
        }
        val phase = LockScreenCallLogic.phase(actions, ongoing)
        val answerHint = LockScreenCallLogic.findAnswer(actions)
        val endHint = when (phase) {
            LockScreenCallLogic.Phase.Incoming -> LockScreenCallLogic.findDeclineOrHangUp(actions)
            LockScreenCallLogic.Phase.Active -> LockScreenCallLogic.findHangUp(actions)
                ?: LockScreenCallLogic.findDecline(actions)
        }
        return CallLockSnapshot(
            key = "${sbn.packageName}:${sbn.id}:${sbn.tag}",
            caller = LockScreenCallLogic.callerLine(title, text, subText),
            phase = phase,
            packageName = sbn.packageName.orEmpty(),
            answer = intentFor(notification.actions, answerHint),
            declineOrHangUp = intentFor(notification.actions, endHint),
            contentIntent = notification.contentIntent,
        )
    }

    private fun intentFor(
        actions: Array<Notification.Action>?,
        hint: LockScreenCallLogic.ActionHint?,
    ): PendingIntent? {
        if (actions == null || hint == null) return null
        val match = actions.firstOrNull { action ->
            val title = action.title?.toString().orEmpty()
            val semantic = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                action.semanticAction
            } else {
                null
            }
            title == hint.title && semantic == hint.semanticAction
        } ?: actions.firstOrNull { action ->
            action.title?.toString().orEmpty() == hint.title
        }
        return match?.actionIntent
    }
}
