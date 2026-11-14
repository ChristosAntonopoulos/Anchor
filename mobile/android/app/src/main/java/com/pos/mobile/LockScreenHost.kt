package com.pos.mobile

import android.app.ActivityOptions
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper

/**
 * Keeps [LockScreenActivity] armed while the keyguard is locked so wake does not
 * flash the system lock screen or the app-icon task animation.
 *
 * Arm on [Intent.ACTION_SCREEN_OFF]; refresh on [Intent.ACTION_SCREEN_ON] while
 * locked; dismiss only on unlock ([Intent.ACTION_USER_PRESENT]).
 */
object LockScreenHost {
    private const val TAG = "LockScreenHost"
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var lastLaunchAt = 0L

    /** Start (or keep) the lock face while the screen is turning off. */
    fun arm(context: Context) {
        launch(context, reason = "arm")
    }

    /** Ensure the lock face is up when the screen turns on while locked. */
    fun show(context: Context) {
        launch(context, reason = "show")
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

    private fun launch(context: Context, reason: String) {
        if (LockScreenActivity.isShowing()) {
            android.util.Log.d(TAG, "Lock face already up ($reason)")
            return
        }
        val now = System.currentTimeMillis()
        if (now - lastLaunchAt < 250L) {
            return
        }
        lastLaunchAt = now
        val app = context.applicationContext
        val launch = Runnable {
            try {
                val intent = LockScreenActivity.intent(app)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    val options = ActivityOptions.makeCustomAnimation(app, 0, 0)
                    app.startActivity(intent, options.toBundle())
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                    @Suppress("DEPRECATION")
                    val options = ActivityOptions.makeCustomAnimation(app, 0, 0)
                    app.startActivity(intent, options.toBundle())
                } else {
                    app.startActivity(intent)
                }
                android.util.Log.d(TAG, "Lock face launched ($reason)")
            } catch (error: Exception) {
                android.util.Log.w(TAG, "Could not show lock face ($reason)", error)
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            launch.run()
        } else {
            mainHandler.post(launch)
        }
    }

    fun intentFlags(): Int =
        Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_SINGLE_TOP or
            Intent.FLAG_ACTIVITY_CLEAR_TOP or
            Intent.FLAG_ACTIVITY_NO_ANIMATION or
            Intent.FLAG_ACTIVITY_NO_USER_ACTION or
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
}
