package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class MorningModeLogicTest {
    private val athens = TimeZone.getTimeZone("Europe/Athens")

    private fun at(hour: Int, minute: Int, day: Int = 12): Long {
        val calendar = Calendar.getInstance(athens)
        calendar.set(2026, Calendar.NOVEMBER, day, hour, minute, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    @Test
    fun unlockBeforeSevenDoesNotActivate() {
        val decision = MorningModeLogic.onUnlock(null, at(6, 59), true, athens)
        assertEquals("wait", decision.action)
        assertEquals(MorningModeLogic.NOT_DUE, decision.gate.status)
        assertFalse(decision.takeover)
    }

    @Test
    fun firstUnlockAtSevenActivates() {
        val decision = MorningModeLogic.onUnlock(null, at(7, 0), true, athens)
        assertEquals("activate", decision.action)
        assertEquals(MorningModeLogic.ACTIVE, decision.gate.status)
        assertTrue(decision.takeover)
    }

    @Test
    fun lateUnlockStillActivatesOnce() {
        val first = MorningModeLogic.onUnlock(null, at(7, 35), true, athens)
        val second = MorningModeLogic.onUnlock(first.gate, at(8, 10), true, athens)
        assertEquals("activate", first.action)
        assertEquals("resume", second.action)
        assertEquals(first.gate.localDate, second.gate.localDate)
    }

    @Test
    fun screenOnWithoutUserPresentDoesNotHijack() {
        val decision = MorningModeLogic.onUnlock(null, at(7, 30), false, athens)
        assertEquals("ignore", decision.action)
        assertEquals(MorningModeLogic.WAITING, decision.gate.status)
    }

    @Test
    fun completedDayDoesNotActivateAgain() {
        val done = MorningModeLogic.Gate(
            localDate = MorningModeLogic.localDate(at(9, 0), athens),
            timezone = athens.id,
            status = MorningModeLogic.COMPLETED,
            firstEligibleUnlockAtMs = at(7, 0),
            activationAtMs = at(7, 0),
            pinEnabled = false,
        )
        val decision = MorningModeLogic.onUnlock(done, at(9, 15), true, athens)
        assertEquals("skip_done", decision.action)
    }

    @Test
    fun nextLocalDateResets() {
        val done = MorningModeLogic.Gate(
            localDate = MorningModeLogic.localDate(at(9, 0, 12), athens),
            timezone = athens.id,
            status = MorningModeLogic.ENDED_EARLY,
            firstEligibleUnlockAtMs = at(7, 0, 12),
            activationAtMs = at(7, 0, 12),
            pinEnabled = true,
        )
        val next = MorningModeLogic.onCivilDate(done, at(8, 0, 13), athens)
        assertEquals("2026-11-13", next.localDate)
        assertEquals(MorningModeLogic.WAITING, next.status)
        assertTrue(next.pinEnabled)
    }
}
