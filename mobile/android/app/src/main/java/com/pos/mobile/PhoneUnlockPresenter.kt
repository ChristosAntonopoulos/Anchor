package com.pos.mobile

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.pos.mobile.launcher.LauncherIntents
import com.pos.mobile.launcher.UnlockHomePolicy
import java.util.concurrent.Executors

object PhoneUnlockPresenter {
    private const val TAG = "PhoneUnlockPresenter"
    private const val DEBOUNCE_MS = 1500L
    private const val WALLET_CHECK_MS = 220L
    private const val WALLET_RETRY_MS = 380L
    private val mainHandler = Handler(Looper.getMainLooper())
    /** UsageEvents queries stay off the main looper so unlock / gesture frames stay responsive. */
    private val walletExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "PhoneUnlockWalletCheck").apply { isDaemon = true }
    }

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
            onPhoneUnlocked(appContext, System.currentTimeMillis(), fromUserPresent = false)
        }, 250)
    }

    fun onPhoneUnlocked(context: Context, unlockTime: Long, fromUserPresent: Boolean = true) {
        val now = System.currentTimeMillis()
        if (now - lastUnlockAt < DEBOUNCE_MS) {
            return
        }
        if (UnlockReasonOverlay.isShowing) {
            return
        }
        lastUnlockAt = now
        screenWasOff = false
        android.util.Log.d(TAG, "Phone unlock detected: $unlockTime present=$fromUserPresent")
        val appContext = context.applicationContext
        // After 22:00 prefer Night Mode so an unfinished morning waiting state cannot steal wind-down.
        if (NightModeLogic.isAtOrAfterTrigger(unlockTime) &&
            NightModeLauncher.consumeUnlock(appContext, unlockTime, fromUserPresent)
        ) {
            PhoneUnlockModule.resetPendingUnlockTime()
            NightModeModule.emitOpened()
            android.util.Log.d(TAG, "Night Mode consumed this unlock")
            return
        }
        if (MorningModeLauncher.consumeUnlock(appContext, unlockTime, fromUserPresent)) {
            PhoneUnlockModule.resetPendingUnlockTime()
            MorningModeModule.emitOpened()
            android.util.Log.d(TAG, "Morning Mode consumed this unlock")
            return
        }
        PhoneUnlockStore.openSession(appContext, unlockTime)
        PhoneUnlockModule.setPendingUnlockTime(unlockTime)

        if (!WalletLaunchDetector.isUsageAccessGranted(appContext)) {
            revealHome(appContext, fromUserPresent, walletLaunch = false)
            showPrompt(appContext, unlockTime)
            return
        }

        scheduleWalletCheck(appContext, unlockTime, fromUserPresent, attempt = 0)
    }

    private fun scheduleWalletCheck(
        context: Context,
        unlockTime: Long,
        fromUserPresent: Boolean,
        attempt: Int,
    ) {
        val delay = if (attempt == 0) WALLET_CHECK_MS else WALLET_RETRY_MS
        mainHandler.postDelayed({
            walletExecutor.execute {
                val isWallet = try {
                    WalletLaunchDetector.isWalletLaunch(context, unlockTime)
                } catch (error: Exception) {
                    android.util.Log.e(TAG, "Wallet usage check failed", error)
                    false
                }
                mainHandler.post {
                    if (isWallet && recordWalletUnlock(context, unlockTime)) {
                        return@post
                    }
                    if (attempt == 0) {
                        scheduleWalletCheck(context, unlockTime, fromUserPresent, attempt = 1)
                    } else {
                        revealHome(context, fromUserPresent, walletLaunch = false)
                        showPrompt(context, unlockTime)
                    }
                }
            }
        }, delay)
    }

    private fun revealHome(context: Context, fromUserPresent: Boolean, walletLaunch: Boolean) {
        if (!UnlockHomePolicy.shouldRevealHome(fromUserPresent, morningTakeover = false, walletLaunch = walletLaunch)) {
            return
        }
        try {
            LauncherIntents.revealHome(context)
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not bring Home forward after unlock", error)
        }
    }

    private fun recordWalletUnlock(context: Context, unlockTime: Long): Boolean {
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
