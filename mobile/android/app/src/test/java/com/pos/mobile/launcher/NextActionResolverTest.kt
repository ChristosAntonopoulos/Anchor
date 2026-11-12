package com.pos.mobile.launcher

import com.pos.mobile.CurrentBlockSnapshot
import com.pos.mobile.MorningModeLogic
import com.pos.mobile.OsWidgetSnapshot
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class NextActionResolverTest {
    private val athens = TimeZone.getTimeZone("Europe/Athens")

    private fun at(hour: Int, minute: Int): Long {
        val calendar = Calendar.getInstance(athens)
        calendar.set(2026, Calendar.NOVEMBER, 12, hour, minute, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    private fun gate(status: String, hour: Int = 8): MorningModeLogic.Gate {
        val now = at(hour, 0)
        return MorningModeLogic.Gate(
            localDate = MorningModeLogic.localDate(now, athens),
            timezone = athens.id,
            status = status,
            firstEligibleUnlockAtMs = at(7, 0),
            activationAtMs = if (status == MorningModeLogic.ACTIVE || status == MorningModeLogic.PAUSED) at(7, 5) else null,
            pinEnabled = false,
        )
    }

    private fun now(
        title: String = "Choose one thing",
        action: String = "Open the app to load today",
        mealTitle: String = "No meal set",
        mealMeta: String = "",
        blockTitle: String = "No block",
        blockMeta: String = "",
    ) = OsWidgetSnapshot(title, action, mealTitle, mealMeta, blockTitle, blockMeta)

    @Test
    fun activeMorningWins() {
        val next = NextActionResolver.resolve(gate(MorningModeLogic.ACTIVE), at(8, 0), now(title = "Write"), null, athens)
        assertEquals("Morning Mode", next.title)
        assertEquals("Continue morning", next.button)
        assertEquals(NextActionResolver.ROUTE_MORNING, next.route)
    }

    @Test
    fun pausedMorningAsksToResume() {
        val next = NextActionResolver.resolve(gate(MorningModeLogic.PAUSED), at(8, 10), now(), null, athens)
        assertEquals("Resume morning", next.button)
    }

    @Test
    fun waitingAfterSevenPromptsMorning() {
        val next = NextActionResolver.resolve(gate(MorningModeLogic.WAITING, 7), at(7, 5), now(title = "Write"), null, athens)
        assertEquals("Morning", next.button)
        assertEquals(NextActionResolver.ROUTE_MORNING, next.route)
    }

    @Test
    fun queuedTaskBeatsEmptyBlock() {
        val next = NextActionResolver.resolve(
            gate(MorningModeLogic.COMPLETED),
            at(10, 0),
            now(title = "Draft the outline", action = "Open the notes"),
            null,
            athens,
        )
        assertEquals("Draft the outline", next.title)
        assertEquals("Open", next.button)
        assertEquals(NextActionResolver.ROUTE_NOW, next.route)
        assertFalse(next.sample)
    }

    @Test
    fun currentBlockWhenNoTask() {
        val block = CurrentBlockSnapshot("Deep work", "09:00", "11:00", entryAction = "Sit down")
        val next = NextActionResolver.resolve(gate(MorningModeLogic.COMPLETED), at(10, 0), now(), block, athens)
        assertEquals("Deep work", next.title)
        assertEquals("Sit down", next.detail)
        assertEquals(NextActionResolver.ROUTE_BLOCK, next.route)
    }

    @Test
    fun emptyQueueIsSampleChooseATask() {
        val next = NextActionResolver.resolve(gate(MorningModeLogic.COMPLETED), at(10, 0), now(), null, athens)
        assertEquals("Choose one thing", next.title)
        assertEquals(NextActionResolver.ROUTE_TASKS, next.route)
        assertTrue(next.sample)
    }
}

class TodayGlanceResolverTest {
    @Test
    fun emptyStateIsSample() {
        val glance = TodayGlanceResolver.resolve(OsWidgetSnapshot.empty(), null)
        assertEquals("No block now", glance.blockTitle)
        assertEquals("No meal set", glance.mealTitle)
        assertTrue(glance.sample)
    }

    @Test
    fun prefersLiveBlockAndMeal() {
        val glance = TodayGlanceResolver.resolve(
            OsWidgetSnapshot(
                nowTitle = "Task",
                nowAction = "Go",
                mealTitle = "Lunch",
                mealMeta = "Chicken · 13:00",
                blockTitle = "No block",
                blockMeta = "",
            ),
            CurrentBlockSnapshot("Deep work", "09:00", "11:00"),
        )
        assertEquals("Deep work", glance.blockTitle)
        assertEquals("09:00 – 11:00", glance.blockMeta)
        assertEquals("Lunch", glance.mealTitle)
        assertEquals("Chicken · 13:00", glance.mealMeta)
        assertFalse(glance.sample)
    }
}
