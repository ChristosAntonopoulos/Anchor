package com.pos.mobile

import android.content.Context
import android.os.Handler
import android.os.Looper

object PhoneUnlockPresenter {
    private const val TAG = "PhoneUnlockPresenter"
    private const val DEBOUNCE_MS = 1500L
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var lastUnlockAt = 0L

    @Volatile
    private var screenWasOff = true

    fun onScreenOff(context: Context) {
        screenWasOff = true
        UnlockReasonOverlay.hideForInterruption()
        PhoneUnlockStore.closeSession(context.applicationContext)
    }

    fun onScreenOnWhileUnlocked(context: Context) {
        if (!screenWasOff) {
            return
        }
        val appContext = context.applicationContext
        mainHandler.postDelayed({
            onPhoneUnlocked(appContext, System.currentTimeMillis())
        }, 250)
    }

    fun onPhoneUnlocked(context: Context, unlockTime: Long) {
        val now = System.currentTimeMillis()
        if (now - lastUnlockAt < DEBOUNCE_MS) {
            return
        }
        if (UnlockReasonOverlay.isShowing) {
            return
        }
        lastUnlockAt = now
        screenWasOff = false
        android.util.Log.d(TAG, "Phone unlock detected: $unlockTime")
        PhoneUnlockStore.openSession(context.applicationContext, unlockTime)
        PhoneUnlockModule.setPendingUnlockTime(unlockTime)

        val shown = UnlockReasonOverlay.show(context.applicationContext, unlockTime)
        if (shown) {
            PhoneUnlockModule.resetPendingUnlockTime()
            return
        }

        PhoneUnlockModule.emitUnlock(unlockTime)
        android.util.Log.w(TAG, "Overlay was not shown; React Native fallback was used")
    }
}
