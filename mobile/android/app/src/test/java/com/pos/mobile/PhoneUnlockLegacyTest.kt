package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Test

class PhoneUnlockLegacyTest {
    @Test
    fun mapsLegacyTaskAndMessageWithoutRewritingNoReason() {
        assertEquals(
            "specific_task",
            PhoneUnlockLegacy.analysisIntentionCode(PhoneUnlockLegacy.LEGACY_TASK, null, 1),
        )
        assertEquals(
            "connection",
            PhoneUnlockLegacy.analysisIntentionCode(PhoneUnlockLegacy.LEGACY_MESSAGE, null, 1),
        )
        assertNull(PhoneUnlockLegacy.analysisIntentionCode(PhoneUnlockLegacy.LEGACY_NO_REASON, null, 1))
        assertNotEquals(
            "automatic_check",
            PhoneUnlockLegacy.analysisIntentionCode(PhoneUnlockLegacy.LEGACY_NO_REASON, null, 1),
        )
    }

    @Test
    fun keepsOriginalLegacyDisplayValues() {
        assertEquals(
            PhoneUnlockLegacy.LEGACY_NO_REASON,
            PhoneUnlockLegacy.displayHeadline(
                PhoneUnlockLegacy.LEGACY_NO_REASON,
                null,
                1,
                null,
                null,
            ),
        )
        assertEquals(
            PhoneUnlockLegacy.LEGACY_TASK,
            PhoneUnlockLegacy.displayHeadline(PhoneUnlockLegacy.LEGACY_TASK, null, 1, null, null),
        )
    }

    @Test
    fun v2MissingIntentionIsNotNoReasonOrAutomaticCheck() {
        assertNull(PhoneUnlockLegacy.analysisIntentionCode(null, null, 2))
        assertEquals(
            PhoneUnlockPrompt.ACTION_SKIP,
            PhoneUnlockLegacy.displayHeadline(null, null, 2, PhoneUnlockPrompt.STATUS_SKIPPED, PhoneUnlockPrompt.ACTION_SKIP),
        )
        assertEquals(
            PhoneUnlockPrompt.STATUS_DISMISSED,
            PhoneUnlockLegacy.displayHeadline(null, null, 2, PhoneUnlockPrompt.STATUS_DISMISSED, null),
        )
        assertEquals(
            PhoneUnlockPrompt.STATUS_INTERRUPTED,
            PhoneUnlockLegacy.displayHeadline(null, null, 2, PhoneUnlockPrompt.STATUS_INTERRUPTED, null),
        )
        assertNotEquals(
            PhoneUnlockLegacy.LEGACY_NO_REASON,
            PhoneUnlockLegacy.displayHeadline(null, null, 2, PhoneUnlockPrompt.STATUS_INTERRUPTED, null),
        )
    }

    @Test
    fun storedIntentionCodeWinsOverLegacyReason() {
        assertEquals(
            "intentional_break",
            PhoneUnlockLegacy.analysisIntentionCode(PhoneUnlockLegacy.LEGACY_TASK, "intentional_break", 2),
        )
    }
}
