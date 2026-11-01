package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneUnlockResolutionTest {
    @Test
    fun quickChoiceSavesIntentionAndClosesWithoutContext() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = false,
            contextExpanded = false,
            intention = "connection",
            trigger = "notification",
            feeling = "lonely",
            note = "do not store",
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            path = PhoneUnlockPrompt.PATH_QUICK,
            putDownExecution = null,
        )
        assertEquals("connection", decision.intentionCode)
        assertEquals(PhoneUnlockPrompt.ACTION_CONTINUE, decision.action)
        assertNull(decision.triggerCode)
        assertNull(decision.feelingCode)
        assertNull(decision.note)
        assertEquals(PhoneUnlockPrompt.PATH_QUICK, decision.submissionPath)
    }

    @Test
    fun eightIntentionCodesStayDistinct() {
        val codes = listOf(
            "specific_task",
            "connection",
            "intentional_break",
            "social_check",
            "pay",
            "automatic_check",
            "unsure",
            "other",
        )
        val saved = codes.map { code ->
            PhoneUnlockResolution.fromUserChoice(
                skip = false,
                keepContext = false,
                contextExpanded = false,
                intention = code,
                trigger = null,
                feeling = null,
                note = null,
                action = PhoneUnlockPrompt.ACTION_CONTINUE,
                status = PhoneUnlockPrompt.STATUS_ANSWERED,
                path = PhoneUnlockPrompt.PATH_QUICK,
                putDownExecution = null,
            ).intentionCode
        }
        assertEquals(codes, saved)
        assertNotEquals("automatic_check", saved[3])
        assertNotEquals("pay", saved[6])
    }

    @Test
    fun putDownWithoutIntentionLeavesIntentionNull() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = false,
            contextExpanded = false,
            intention = null,
            trigger = null,
            feeling = null,
            note = null,
            action = PhoneUnlockPrompt.ACTION_PUT_DOWN,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            path = PhoneUnlockPrompt.PATH_DIRECT,
            putDownExecution = PhoneUnlockPrompt.PUT_DOWN_OVERLAY,
        )
        assertNull(decision.intentionCode)
        assertEquals(PhoneUnlockPrompt.ACTION_PUT_DOWN, decision.action)
        assertEquals(PhoneUnlockPrompt.PUT_DOWN_OVERLAY, decision.putDownExecution)
    }

    @Test
    fun skipDiscardsContextAndDoesNotInferAutomaticCheck() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = true,
            keepContext = false,
            contextExpanded = true,
            intention = "automatic_check",
            trigger = "boredom_waiting",
            feeling = "restless",
            note = "private",
            action = PhoneUnlockPrompt.ACTION_SKIP,
            status = PhoneUnlockPrompt.STATUS_SKIPPED,
            path = PhoneUnlockPrompt.PATH_DIRECT,
            putDownExecution = null,
        )
        assertEquals(PhoneUnlockPrompt.STATUS_SKIPPED, decision.status)
        assertNull(decision.intentionCode)
        assertNull(decision.triggerCode)
        assertNull(decision.feelingCode)
        assertNull(decision.note)
    }

    @Test
    fun expandedContinueAllowsBlankFields() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = true,
            contextExpanded = true,
            intention = null,
            trigger = null,
            feeling = null,
            note = "  ",
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            path = PhoneUnlockPrompt.PATH_CONTEXT,
            putDownExecution = null,
        )
        assertNull(decision.intentionCode)
        assertNull(decision.triggerCode)
        assertNull(decision.feelingCode)
        assertNull(decision.note)
        assertTrue(decision.contextExpanded)
    }

    @Test
    fun triggerAndFeelingStayIndependent() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = true,
            contextExpanded = true,
            intention = "intentional_break",
            trigger = "difficult_moment",
            feeling = "stressed",
            note = null,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            path = PhoneUnlockPrompt.PATH_CONTEXT,
            putDownExecution = null,
        )
        assertEquals("intentional_break", decision.intentionCode)
        assertEquals("difficult_moment", decision.triggerCode)
        assertEquals("stressed", decision.feelingCode)
    }

    @Test
    fun notesAreCappedAt200Characters() {
        val note = "x".repeat(240)
        assertEquals(200, PhoneUnlockResolution.sanitizeNote(note)?.length)
    }

    @Test
    fun firstResolutionWins() {
        val prompt = PhoneUnlockPrompt.createPending(1_700_000_000_000L)
        val first = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = false,
            contextExpanded = false,
            intention = "specific_task",
            trigger = null,
            feeling = null,
            note = null,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            path = PhoneUnlockPrompt.PATH_QUICK,
            putDownExecution = null,
        )
        val second = PhoneUnlockResolution.fromUserChoice(
            skip = true,
            keepContext = false,
            contextExpanded = false,
            intention = null,
            trigger = null,
            feeling = null,
            note = null,
            action = PhoneUnlockPrompt.ACTION_SKIP,
            status = PhoneUnlockPrompt.STATUS_SKIPPED,
            path = PhoneUnlockPrompt.PATH_DIRECT,
            putDownExecution = null,
        )
        assertTrue(PhoneUnlockResolution.apply(prompt, first, "2026-10-31T18:00:00.000Z"))
        assertFalse(PhoneUnlockResolution.apply(prompt, second, "2026-10-31T18:00:01.000Z"))
        assertEquals("specific_task", prompt.intentionCode)
        assertEquals(PhoneUnlockPrompt.STATUS_ANSWERED, prompt.status)
    }

    @Test
    fun systemDismissalDiscardsUnsubmittedContext() {
        val decision = PhoneUnlockResolution.fromUserChoice(
            skip = false,
            keepContext = true,
            contextExpanded = true,
            intention = "specific_task",
            trigger = "notification",
            feeling = "calm",
            note = "unsubmitted",
            action = null,
            status = PhoneUnlockPrompt.STATUS_DISMISSED,
            path = null,
            putDownExecution = null,
        )
        assertEquals(PhoneUnlockPrompt.STATUS_DISMISSED, decision.status)
        assertNull(decision.action)
        assertNull(decision.intentionCode)
        assertNull(decision.note)
        assertNotEquals(PhoneUnlockPrompt.ACTION_SKIP, decision.action)
    }

    @Test
    fun interruptedPendingDoesNotBecomeAutomaticCheck() {
        val prompt = PhoneUnlockPrompt.createPending(1_700_000_000_000L)
        val decision = PhoneUnlockResolution.Decision(
            status = PhoneUnlockPrompt.STATUS_INTERRUPTED,
            action = null,
            intentionCode = null,
            triggerCode = null,
            feelingCode = null,
            note = null,
            contextExpanded = false,
            submissionPath = null,
            putDownExecution = null,
        )
        assertTrue(PhoneUnlockResolution.apply(prompt, decision, "2026-10-31T18:00:00.000Z"))
        assertEquals(PhoneUnlockPrompt.STATUS_INTERRUPTED, prompt.status)
        assertNull(prompt.intentionCode)
        assertNull(prompt.action)
        assertNotEquals("automatic_check", prompt.intentionCode)
    }
}
