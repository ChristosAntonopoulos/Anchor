package com.pos.mobile.launcher

import com.pos.mobile.OsWidgetSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LockScreenContentTest {
    @Test
    fun nowCueUsesSparseTitleAndDetail() {
        val lines = LockScreenContent.resolve(
            next = NextActionContent(
                title = "Ship lock face",
                detail = "Write the sparse copy.",
                button = "Open",
                route = NextActionResolver.ROUTE_NOW,
            ),
            widgets = OsWidgetSnapshot.empty(),
        )
        assertEquals("NOW", lines.cueEyebrow)
        assertEquals("Ship lock face", lines.cueTitle)
        assertEquals("Write the sparse copy.", lines.cueDetail)
        assertNull(lines.statusLine)
    }

    @Test
    fun morningCueUsesMorningEyebrow() {
        val lines = LockScreenContent.resolve(
            next = NextActionContent(
                title = "Morning Mode",
                detail = "Due after 07:00. First unlock starts it.",
                button = "Morning",
                route = NextActionResolver.ROUTE_MORNING,
            ),
            widgets = OsWidgetSnapshot.empty(),
        )
        assertEquals("MORNING", lines.cueEyebrow)
    }

    @Test
    fun pipelineLineJoinsWithMiddleDots() {
        val line = LockScreenContent.pipelineLine(
            OsWidgetSnapshot.empty().copy(
                pipelineTitle = "Anchor",
                pipelineMeta = "main · 09:14",
                pipelineStatus = "succeeded",
            ),
        )
        assertEquals("PIPELINE · OK · Anchor · main · 09:14", line)
    }

    @Test
    fun emptyPipelineIsOmitted() {
        assertNull(LockScreenContent.pipelineLine(OsWidgetSnapshot.empty()))
    }

    @Test
    fun duplicateDetailIsDropped() {
        val lines = LockScreenContent.resolve(
            next = NextActionContent(
                title = "Choose one thing",
                detail = "Choose one thing",
                button = "Choose",
                route = NextActionResolver.ROUTE_TASKS,
            ),
            widgets = OsWidgetSnapshot.empty(),
        )
        assertTrue(lines.cueDetail.isEmpty())
    }
}
