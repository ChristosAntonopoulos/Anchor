package com.pos.mobile

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build

class PhoneUnlockReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_SCREEN_OFF -> {
                PhoneUnlockPresenter.onScreenOff(context)
            }
            Intent.ACTION_USER_PRESENT -> {
                PhoneUnlockPresenter.onPhoneUnlocked(context, System.currentTimeMillis(), fromUserPresent = true)
            }
            Intent.ACTION_SCREEN_ON -> {
                val keyguard = context.getSystemService(KeyguardManager::class.java)
                if (keyguard?.isKeyguardLocked != true) {
                    PhoneUnlockPresenter.onScreenOnWhileUnlocked(context)
                }
            }
            Intent.ACTION_TIMEZONE_CHANGED, Intent.ACTION_DATE_CHANGED -> {
                val now = System.currentTimeMillis()
                MorningModeStore.saveGate(
                    context.applicationContext,
                    MorningModeLogic.onCivilDate(
                        MorningModeStore.gate(context.applicationContext),
                        now,
                    ),
                )
                NightModeStore.saveGate(
                    context.applicationContext,
                    NightModeLogic.onCivilDate(
                        NightModeStore.gate(context.applicationContext),
                        now,
                    ),
                )
            }
        }
    }

    companion object {
        fun register(context: Context): PhoneUnlockReceiver {
            val receiver = PhoneUnlockReceiver()
            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_USER_PRESENT)
                addAction(Intent.ACTION_SCREEN_ON)
                addAction(Intent.ACTION_SCREEN_OFF)
                addAction(Intent.ACTION_TIMEZONE_CHANGED)
                addAction(Intent.ACTION_DATE_CHANGED)
                priority = IntentFilter.SYSTEM_HIGH_PRIORITY
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                @Suppress("DEPRECATION")
                context.registerReceiver(receiver, filter)
            }
            return receiver
        }

        fun unregister(context: Context, receiver: BroadcastReceiver?) {
            if (receiver == null) {
                return
            }
            try {
                context.unregisterReceiver(receiver)
            } catch (_: Exception) {
            }
        }
    }
}
