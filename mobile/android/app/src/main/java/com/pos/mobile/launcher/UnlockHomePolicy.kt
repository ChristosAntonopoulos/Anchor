package com.pos.mobile.launcher

/**
 * Stock Android resumes the last app after unlock. Personal AI Home is brought
 * forward on a real unlock instead, except Morning Mode takeover and lock-screen Wallet.
 */
object UnlockHomePolicy {
    fun shouldRevealHome(
        fromUserPresent: Boolean,
        morningTakeover: Boolean,
        walletLaunch: Boolean,
    ): Boolean = fromUserPresent && !morningTakeover && !walletLaunch
}
