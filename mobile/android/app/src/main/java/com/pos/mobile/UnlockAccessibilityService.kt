package com.pos.mobile

import android.accessibilityservice.AccessibilityService
import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

class UnlockAccessibilityService : AccessibilityService() {
    private var unlockReceiver: BroadcastReceiver? = null
    private var keyguardWasLocked = true

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        keyguardWasLocked = isKeyguardLocked()
        unlockReceiver = PhoneUnlockReceiver.register(this)
        android.util.Log.d(TAG, "Unlock accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) {
            return
        }
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED
        ) {
            return
        }
        val locked = isKeyguardLocked()
        if (keyguardWasLocked && !locked) {
            android.util.Log.d(TAG, "Keyguard dismissed")
            PhoneUnlockPresenter.onPhoneUnlocked(this, System.currentTimeMillis())
        }
        keyguardWasLocked = locked
    }

    override fun onInterrupt() = Unit

    override fun onDestroy() {
        PhoneUnlockReceiver.unregister(this, unlockReceiver)
        unlockReceiver = null
        if (instance === this) {
            instance = null
        }
        super.onDestroy()
        android.util.Log.d(TAG, "Unlock accessibility service destroyed")
    }

    private fun isKeyguardLocked(): Boolean {
        val keyguard = getSystemService(KeyguardManager::class.java)
        return keyguard?.isKeyguardLocked == true
    }

    companion object {
        private const val TAG = "UnlockAccessibility"

        @Volatile
        var instance: UnlockAccessibilityService? = null
            private set

        fun isEnabled(context: Context): Boolean {
            val enabled = Settings.Secure.getInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED,
                0
            )
            if (enabled != 1) {
                return false
            }
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val expected = ComponentName(context, UnlockAccessibilityService::class.java)
                .flattenToString()
            return enabledServices.split(':').any { service ->
                service.equals(expected, ignoreCase = true) ||
                    service.contains("UnlockAccessibilityService", ignoreCase = true)
            }
        }
    }
}
