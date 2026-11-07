package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class CurrentBlockSnapshotTest {
    @Test
    fun parsesTodayPayloadAndFormatsTimeRange() {
        val snapshot = CurrentBlockSnapshot.fromTodayJson(
            """{"success":true,"data":{"currentBlock":{"id":"block-1","title":"Deep work","startTime":"09:00","endTime":"11:00","taskId":"task-9","entryAction":"Draft the outline","startMinutes":25,"isRoutine":false}}}""",
        )
        assertEquals("Deep work", snapshot?.title)
        assertEquals("09:00 – 11:00", snapshot?.timeRange())
        assertEquals("block-1", snapshot?.id)
        assertEquals("task-9", snapshot?.taskId)
        assertEquals("Draft the outline", snapshot?.entryAction)
        assertEquals(25, snapshot?.startMinutes)
        assertEquals(false, snapshot?.isRoutine)
    }

    @Test
    fun prefersChecklistItemsThenRoutineActivities() {
        val snapshot = CurrentBlockSnapshot.fromTodayJson(
            """{"success":true,"data":{"currentBlock":{"title":"Morning routine","startTime":"07:00","endTime":"08:00","checklistItems":[{"title":"Drink water","completed":true},{"title":"Brush teeth","completed":false}],"routineActivities":["Ignored"]}}}""",
        )
        assertEquals(listOf("Drink water", "Brush teeth"), snapshot?.items?.map { it.title })
        assertEquals(true, snapshot?.items?.first()?.completed)
    }

    @Test
    fun emptyTitleIsNotShown() {
        val snapshot = CurrentBlockSnapshot.fromTodayJson(
            """{"success":true,"data":{"currentBlock":{"title":"","startTime":"09:00","endTime":"11:00"}}}""",
        )
        assertNull(snapshot)
    }
}
