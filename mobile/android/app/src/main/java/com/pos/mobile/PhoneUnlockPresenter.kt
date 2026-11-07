package com.pos.mobile

import android.content.Context
import android.os.Handler
import android.os.Looper

object PhoneUnlockPresenter {
    private const val TAG = "PhoneUnlockPresenter"
    private const val DEBOUNCE_MS = 1500L
    private const val WALLET_CHECK_MS = 220L
    private const val WALLET_RETRY_MS = 380L
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
        val appContext = context.applicationContext
        PhoneUnlockStore.openSession(appContext, unlockTime)
        PhoneUnlockModule.setPendingUnlockTime(unlockTime)

        if (!WalletLaunchDetector.isUsageAccessGranted(appContext)) {
            showPrompt(appContext, unlockTime)
            return
        }

        mainHandler.postDelayed({
            if (tryRecordWallet(appContext, unlockTime)) {
                return@postDelayed
            }
            mainHandler.postDelayed({
                if (!tryRecordWallet(appContext, unlockTime)) {
                    showPrompt(appContext, unlockTime)
                }
            }, WALLET_RETRY_MS)
        }, WALLET_CHECK_MS)
    }

    private fun tryRecordWallet(context: Context, unlockTime: Long): Boolean {
        if (!WalletLaunchDetector.isWalletLaunch(context, unlockTime)) {
            return false
        }
        if (UnlockReasonOverlay.isShowing) {
            return false
        }
        val saved = PhoneUnlockStore.recordWalletUnlock(context, unlockTime)
        PhoneUnlockModule.resetPendingUnlockTime()
        android.util.Log.d(TAG, "Logged lock-screen Cards/Wallet as pay saved=$saved")
        return true
    }

    private fun showPrompt(context: Context, unlockTime: Long) {
        if (UnlockReasonOverlay.isShowing) {
            return
        }
        val shown = UnlockReasonOverlay.show(context, unlockTime)
        if (shown) {
            PhoneUnlockModule.resetPendingUnlockTime()
            return
        }
        PhoneUnlockModule.emitUnlock(unlockTime)
        android.util.Log.w(TAG, "Overlay was not shown; React Native fallback was used")
    }
}
