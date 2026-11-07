package com.pos.mobile

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

class PhoneLockReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        PhoneLock.lockIfPending(context)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        PhoneLock.clearPending(context)
    }
}
