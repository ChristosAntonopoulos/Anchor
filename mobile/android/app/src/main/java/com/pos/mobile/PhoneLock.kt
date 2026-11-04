package com.pos.mobile

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings

object PhoneLock {
    private val mainHandler = Handler(Looper.getMainLooper())
    private const val PREFS = "pos_unlock"
    private const val KEY_PENDING = "pendingLockAfterEnable"
    private const val REQUEST_ADD_ADMIN = 1901

    fun component(context: Context): ComponentName {
        return ComponentName(context.applicationContext, PhoneLockReceiver::class.java)
    }

    fun isAdminActive(context: Context): Boolean {
        val manager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return manager.isAdminActive(component(context))
    }

    fun prepare(context: Context): String {
        setPending(context, !isAdminActive(context))
        return PhoneUnlockPrompt.PUT_DOWN_LOCK
    }

    fun complete(context: Context): String {
        return try {
            val appContext = context.applicationContext
            val manager = appContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (manager.isAdminActive(component(appContext))) {
                setPending(appContext, false)
                goHomeAndLock(appContext, manager)
                PhoneUnlockPrompt.PUT_DOWN_LOCK
            } else {
                setPending(appContext, true)
                requestAdmin(appContext)
                PhoneUnlockPrompt.PUT_DOWN_LOCK
            }
        } catch (error: Exception) {
            setPending(context, false)
            android.util.Log.e("PhoneLock", "Could not lock the screen", error)
            PhoneUnlockPrompt.PUT_DOWN_FAILED
        }
    }

    fun lockIfPending(context: Context) {
        val appContext = context.applicationContext
        if (!isPending(appContext)) {
            return
        }
        try {
            val manager = appContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            if (manager.isAdminActive(component(appContext))) {
                setPending(appContext, false)
                goHomeAndLock(appContext, manager)
            }
        } catch (error: Exception) {
            setPending(appContext, false)
            android.util.Log.e("PhoneLock", "Could not lock after admin enable", error)
        }
    }

    fun requestAdmin(context: Context) {
        val start = {
            if (isAdminActive(context)) {
                android.util.Log.d("PhoneLock", "Device admin already active")
            } else {
                val addAdmin = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                    putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component(context))
                    putExtra(
                        DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                        context.getString(R.string.unlock_lock_admin_body),
                    )
                }
                val security = Intent(Settings.ACTION_SECURITY_SETTINGS)
                val settings = Intent(Settings.ACTION_SETTINGS)
                val activity = context as? Activity
                val launched = if (activity != null && !activity.isFinishing && !activity.isDestroyed) {
                    // Device-admin UI is a dialog. NEW_TASK from the application
                    // context is ignored on Nothing OS, and a React Native Modal
                    // will cover it unless this starts from the resumed activity.
                    startOnActivity(activity, addAdmin, forResult = true)
                        || startOnActivity(activity, addAdmin, forResult = false)
                        || startOnActivity(activity, security, forResult = false)
                        || startOnActivity(activity, settings, forResult = false)
                } else {
                    startOnContext(context.applicationContext, addAdmin)
                        || startOnContext(context.applicationContext, security)
                        || startOnContext(context.applicationContext, settings)
                }
                if (!launched) {
                    android.util.Log.e("PhoneLock", "Could not open device admin or security settings")
                }
            }
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            start()
        } else {
            mainHandler.post(start)
        }
    }

    fun clearPending(context: Context) {
        setPending(context, false)
    }

    private fun startOnActivity(activity: Activity, source: Intent, forResult: Boolean): Boolean {
        return try {
            val intent = Intent(source)
            if (forResult) {
                @Suppress("DEPRECATION")
                activity.startActivityForResult(intent, REQUEST_ADD_ADMIN)
            } else {
                activity.startActivity(intent)
            }
            true
        } catch (error: Exception) {
            android.util.Log.e("PhoneLock", "Activity could not start ${source.action}", error)
            false
        }
    }

    private fun startOnContext(context: Context, source: Intent): Boolean {
        return try {
            context.startActivity(Intent(source).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            true
        } catch (error: Exception) {
            android.util.Log.e("PhoneLock", "Context could not start ${source.action}", error)
            false
        }
    }

    private fun isPending(context: Context): Boolean {
        return prefs(context).getBoolean(KEY_PENDING, false)
    }

    private fun setPending(context: Context, pending: Boolean) {
        prefs(context).edit().putBoolean(KEY_PENDING, pending).apply()
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun goHomeAndLock(context: Context, manager: DevicePolicyManager) {
        goHome(context)
        mainHandler.postDelayed({
            try {
                if (manager.isAdminActive(component(context))) {
                    manager.lockNow()
                }
            } catch (error: Exception) {
                android.util.Log.e("PhoneLock", "Could not lock after sending the app home", error)
            }
        }, 180)
    }

    private fun goHome(context: Context) {
        try {
            val home = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_HOME)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(home)
        } catch (error: Exception) {
            android.util.Log.w("PhoneLock", "Could not send the app to the home screen before lock", error)
        }
    }
}
