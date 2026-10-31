package com.pos.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class PhoneUnlockReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_USER_PRESENT) {
            return
        }

        val unlockTime = System.currentTimeMillis()
        android.util.Log.d(TAG, "Phone unlock detected")
        PhoneUnlockModule.setPendingUnlockTime(unlockTime)
        PhoneUnlockModule.emitUnlock(unlockTime)

        try {
            val openApp = Intent(context, MainActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
                )
                putExtra("unlockTime", unlockTime)
                putExtra("showUnlockModal", true)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(Intent(context, POSForegroundService::class.java))
            }
            context.startActivity(openApp)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not open the unlock prompt", error)
        }
    }

    companion object {
        private const val TAG = "PhoneUnlockReceiver"
    }
}
