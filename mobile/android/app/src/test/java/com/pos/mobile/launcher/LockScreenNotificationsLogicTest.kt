package com.pos.mobile.launcher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LockScreenNotificationsLogicTest {
    @Test
    fun badgeHidesWhenEmptyAndCapsAtNinePlus() {
        assertNull(LockScreenNotificationsLogic.badgeLabel(0))
        assertEquals("1", LockScreenNotificationsLogic.badgeLabel(1))
        assertEquals("9", LockScreenNotificationsLogic.badgeLabel(9))
        assertEquals("9+", LockScreenNotificationsLogic.badgeLabel(10))
        assertEquals("9+", LockScreenNotificationsLogic.badgeLabel(42))
    }

    @Test
    fun muteMeansNoneOrAlarmsOnly() {
        assertFalse(LockScreenNotificationsLogic.isMuted(0)) // UNKNOWN
        assertFalse(LockScreenNotificationsLogic.isMuted(1)) // ALL
        assertFalse(LockScreenNotificationsLogic.isMuted(2)) // PRIORITY / Focus
        assertTrue(LockScreenNotificationsLogic.isMuted(3)) // NONE
        assertTrue(LockScreenNotificationsLogic.isMuted(4)) // ALARMS
    }

    @Test
    fun toggleTargetsHardMuteAndFullUnmute() {
        assertEquals(3, LockScreenNotificationsLogic.nextInterruptionFilter(currentlyMuted = false))
        assertEquals(1, LockScreenNotificationsLogic.nextInterruptionFilter(currentlyMuted = true))
    }

    @Test
    fun badgeIgnoresOwnPackageSummariesAndNonClearable() {
        assertFalse(
            LockScreenNotificationsLogic.countsTowardBadge(
                packageName = "com.pos.mobile",
                ownPackage = "com.pos.mobile",
                isGroupSummary = false,
                isClearable = true,
            ),
        )
        assertFalse(
            LockScreenNotificationsLogic.countsTowardBadge(
                packageName = "com.whatsapp",
                ownPackage = "com.pos.mobile",
                isGroupSummary = true,
                isClearable = true,
            ),
        )
        assertFalse(
            LockScreenNotificationsLogic.countsTowardBadge(
                packageName = "com.spotify.music",
                ownPackage = "com.pos.mobile",
                isGroupSummary = false,
                isClearable = false,
            ),
        )
        assertTrue(
            LockScreenNotificationsLogic.countsTowardBadge(
                packageName = "com.whatsapp",
                ownPackage = "com.pos.mobile",
                isGroupSummary = false,
                isClearable = true,
            ),
        )
    }
}
