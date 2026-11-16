package com.pos.mobile.launcher

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LockScreenCallLogicTest {
    @Test
    fun categoryCallIsEnough() {
        assertTrue(
            LockScreenCallLogic.isLikelyCallNotification(
                category = "call",
                packageName = "com.example.other",
                actions = emptyList(),
                isOngoing = false,
            ),
        )
    }

    @Test
    fun dialerWithAnswerActionCounts() {
        val actions = listOf(
            LockScreenCallLogic.ActionHint("Answer", LockScreenCallLogic.SEMANTIC_ANSWER),
            LockScreenCallLogic.ActionHint("Decline", null),
        )
        assertTrue(
            LockScreenCallLogic.isLikelyCallNotification(
                category = null,
                packageName = "com.google.android.dialer",
                actions = actions,
                isOngoing = false,
            ),
        )
        assertEquals(LockScreenCallLogic.Phase.Incoming, LockScreenCallLogic.phase(actions, false))
        assertNotNull(LockScreenCallLogic.findAnswer(actions))
        assertNotNull(LockScreenCallLogic.findDecline(actions))
    }

    @Test
    fun activeCallPrefersHangUp() {
        val actions = listOf(LockScreenCallLogic.ActionHint("Hang up", null))
        assertEquals(LockScreenCallLogic.Phase.Active, LockScreenCallLogic.phase(actions, true))
        assertEquals("Hang up", LockScreenCallLogic.findHangUp(actions)?.title)
        assertNull(LockScreenCallLogic.findAnswer(actions))
    }

    @Test
    fun unrelatedNotificationHidden() {
        assertFalse(
            LockScreenCallLogic.isLikelyCallNotification(
                category = "msg",
                packageName = "com.whatsapp",
                actions = listOf(LockScreenCallLogic.ActionHint("Reply", null)),
                isOngoing = false,
            ),
        )
    }

    @Test
    fun callerLinePrefersTitle() {
        assertEquals(
            "Maria",
            LockScreenCallLogic.callerLine("Maria", "Incoming call", null),
        )
        assertEquals("Call", LockScreenCallLogic.callerLine("", "", ""))
        assertEquals("Incoming", LockScreenCallLogic.eyebrow(LockScreenCallLogic.Phase.Incoming))
        assertEquals("On call", LockScreenCallLogic.eyebrow(LockScreenCallLogic.Phase.Active))
    }
}
