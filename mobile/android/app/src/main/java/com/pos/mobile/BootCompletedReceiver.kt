package com.pos.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED && action != Intent.ACTION_MY_PACKAGE_REPLACED) {
            return
        }
        try {
            val serviceIntent = Intent(context, POSForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
            android.util.Log.d(TAG, "Foreground service started after $action")
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not start foreground service after boot", error)
        }
    }

    companion object {
        private const val TAG = "BootCompletedReceiver"
    }
}
