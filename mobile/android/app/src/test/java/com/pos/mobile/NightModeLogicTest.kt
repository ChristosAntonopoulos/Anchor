package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class NightModeLogicTest {
    private val athens = TimeZone.getTimeZone("Europe/Athens")

    private fun at(hour: Int, minute: Int, day: Int = 12): Long {
        val calendar = Calendar.getInstance(athens)
        calendar.set(2026, Calendar.NOVEMBER, day, hour, minute, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    @Test
    fun unlockBeforeTenDoesNotActivate() {
        val decision = NightModeLogic.onUnlock(null, at(21, 59), true, athens)
        assertEquals("wait", decision.action)
        assertEquals(NightModeLogic.NOT_DUE, decision.gate.status)
        assertFalse(decision.takeover)
    }

    @Test
    fun firstUnlockAtTenActivates() {
        val decision = NightModeLogic.onUnlock(null, at(22, 0), true, athens)
        assertEquals("activate", decision.action)
        assertEquals(NightModeLogic.ACTIVE, decision.gate.status)
        assertTrue(decision.takeover)
    }

    @Test
    fun lateUnlockStillActivatesOnce() {
        val first = NightModeLogic.onUnlock(null, at(22, 35), true, athens)
        val second = NightModeLogic.onUnlock(first.gate, at(22, 50), true, athens)
        assertEquals("activate", first.action)
        assertEquals("resume", second.action)
        assertEquals(first.gate.localDate, second.gate.localDate)
    }

    @Test
    fun screenOnWithoutUserPresentDoesNotHijack() {
        val decision = NightModeLogic.onUnlock(null, at(22, 30), false, athens)
        assertEquals("ignore", decision.action)
        assertEquals(NightModeLogic.WAITING, decision.gate.status)
    }

    @Test
    fun completedDayDoesNotActivateAgain() {
        val done = NightModeLogic.Gate(
            localDate = NightModeLogic.localDate(at(23, 0), athens),
            timezone = athens.id,
            status = NightModeLogic.COMPLETED,
            firstEligibleUnlockAtMs = at(22, 0),
            activationAtMs = at(22, 0),
            pinEnabled = false,
        )
        val decision = NightModeLogic.onUnlock(done, at(23, 15), true, athens)
        assertEquals("skip_done", decision.action)
    }

    @Test
    fun nextLocalDateResets() {
        val done = NightModeLogic.Gate(
            localDate = NightModeLogic.localDate(at(23, 0, 12), athens),
            timezone = athens.id,
            status = NightModeLogic.ENDED_EARLY,
            firstEligibleUnlockAtMs = at(22, 0, 12),
            activationAtMs = at(22, 0, 12),
            pinEnabled = true,
        )
        val next = NightModeLogic.onCivilDate(done, at(22, 0, 13), athens)
        assertEquals("2026-11-13", next.localDate)
        assertEquals(NightModeLogic.WAITING, next.status)
        assertTrue(next.pinEnabled)
    }
}
