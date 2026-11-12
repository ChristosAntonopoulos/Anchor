package com.pos.mobile.launcher

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class UnlockHomePolicyTest {
    @Test
    fun realUnlockBringsHome() {
        assertTrue(UnlockHomePolicy.shouldRevealHome(fromUserPresent = true, morningTakeover = false, walletLaunch = false))
    }

    @Test
    fun screenOnWithoutUnlockDoesNotSteal() {
        assertFalse(UnlockHomePolicy.shouldRevealHome(fromUserPresent = false, morningTakeover = false, walletLaunch = false))
    }

    @Test
    fun morningModeWins() {
        assertFalse(UnlockHomePolicy.shouldRevealHome(fromUserPresent = true, morningTakeover = true, walletLaunch = false))
    }

    @Test
    fun lockScreenWalletIsLeftAlone() {
        assertFalse(UnlockHomePolicy.shouldRevealHome(fromUserPresent = true, morningTakeover = false, walletLaunch = true))
    }
}
