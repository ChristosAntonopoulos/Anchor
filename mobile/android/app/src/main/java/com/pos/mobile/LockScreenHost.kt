package com.pos.mobile

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper

/**
 * Brings up [LockScreenActivity] while the keyguard is locked, and tears it down
 * before Answer / Home / Morning take over on unlock.
 */
object LockScreenHost {
    private const val TAG = "LockScreenHost"
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var lastShowAt = 0L

    fun show(context: Context) {
        val now = System.currentTimeMillis()
        if (now - lastShowAt < 400L) {
            return
        }
        lastShowAt = now
        val app = context.applicationContext
        val launch = Runnable {
            try {
                app.startActivity(LockScreenActivity.intent(app))
            } catch (error: Exception) {
                android.util.Log.w(TAG, "Could not show lock face", error)
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            launch.run()
        } else {
            mainHandler.post(launch)
        }
    }

    fun dismiss() {
        val finish = Runnable {
            LockScreenActivity.finishIfShowing()
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            finish.run()
        } else {
            mainHandler.post(finish)
        }
    }

    fun intentFlags(): Int =
        Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_NO_USER_ACTION or
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
}
