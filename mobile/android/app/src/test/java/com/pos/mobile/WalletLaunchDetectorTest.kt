package com.pos.mobile

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WalletLaunchDetectorTest {
    @Test
    fun lockScreenCardsAndGoogleWalletCountAsPay() {
        assertTrue(
            WalletLaunchDetector.isWallet(
                "com.android.systemui",
                "com.android.systemui.wallet.ui.WalletActivity",
            ),
        )
        assertTrue(
            WalletLaunchDetector.isWallet(
                "com.google.android.apps.walletnfcrel",
                "com.google.android.apps.walletnfcrel.home.HomeActivity",
            ),
        )
        assertTrue(
            WalletLaunchDetector.isWallet(
                "com.google.android.gms",
                "com.google.android.gms.tapandpay.quickaccesswallet.QuickAccessWalletActivity",
            ),
        )
    }

    @Test
    fun ordinaryUnlocksAreNotWallet() {
        assertFalse(
            WalletLaunchDetector.isWallet(
                "com.android.systemui",
                "com.android.systemui.statusbar.phone.StatusBar",
            ),
        )
        assertFalse(
            WalletLaunchDetector.isWallet(
                "com.google.android.gms",
                "com.google.android.gms.common.api.GoogleApiActivity",
            ),
        )
        assertFalse(WalletLaunchDetector.isWallet("com.nothing.launcher", "com.nothing.launcher.Home"))
    }

    @Test
    fun ignoredPackagesSkipLaunchersAndSystemUi() {
        assertTrue(WalletLaunchDetector.isIgnoredForegroundPackage("com.android.systemui"))
        assertTrue(WalletLaunchDetector.isIgnoredForegroundPackage("com.nothing.launcher"))
        assertTrue(WalletLaunchDetector.isIgnoredForegroundPackage("com.sec.android.app.launcher"))
        assertFalse(WalletLaunchDetector.isIgnoredForegroundPackage("ai.x.grok"))
        assertFalse(WalletLaunchDetector.isIgnoredForegroundPackage("com.spotify.music"))
    }
}
