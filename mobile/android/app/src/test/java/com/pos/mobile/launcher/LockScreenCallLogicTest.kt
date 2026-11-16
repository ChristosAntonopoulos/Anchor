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
    fun dialerWithAnswerAndDeclineCounts() {
        val actions = listOf(
            LockScreenCallLogic.ActionHint("Answer", null),
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
    fun replySemanticIsNotACall() {
        // SEMANTIC_ACTION_REPLY = 1 — messaging apps. Must not look like Answer.
        val actions = listOf(
            LockScreenCallLogic.ActionHint("Reply", 1),
            LockScreenCallLogic.ActionHint("Mark as read", 2),
        )
        assertFalse(
            LockScreenCallLogic.isLikelyCallNotification(
                category = "msg",
                packageName = "com.google.android.apps.messaging",
                actions = actions,
                isOngoing = false,
            ),
        )
        assertNull(LockScreenCallLogic.findAnswer(actions))
    }

    @Test
    fun sendActionIsNotHangUp() {
        val actions = listOf(LockScreenCallLogic.ActionHint("Send", null))
        assertNull(LockScreenCallLogic.findHangUp(actions))
        assertFalse(
            LockScreenCallLogic.isLikelyCallNotification(
                category = null,
                packageName = "com.google.android.dialer",
                actions = actions,
                isOngoing = true,
            ),
        )
    }

    @Test
    fun dialerOngoingWithoutCallActionsHidden() {
        assertFalse(
            LockScreenCallLogic.isLikelyCallNotification(
                category = null,
                packageName = "com.google.android.dialer",
                actions = listOf(LockScreenCallLogic.ActionHint("Settings", null)),
                isOngoing = true,
            ),
        )
    }

    @Test
    fun activeCallPrefersHangUp() {
        val actions = listOf(LockScreenCallLogic.ActionHint("Hang up", null))
        assertTrue(
            LockScreenCallLogic.isLikelyCallNotification(
                category = "call",
                packageName = "com.google.android.dialer",
                actions = actions,
                isOngoing = true,
            ),
        )
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
                actions = listOf(
                    LockScreenCallLogic.ActionHint("Reply", 1),
                    LockScreenCallLogic.ActionHint("Mark as read", null),
                ),
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
