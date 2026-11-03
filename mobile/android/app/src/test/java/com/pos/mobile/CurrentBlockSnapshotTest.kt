package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class CurrentBlockSnapshotTest {
    @Test
    fun parsesTodayPayloadAndFormatsTimeRange() {
        val snapshot = CurrentBlockSnapshot.fromTodayJson(
            """{"success":true,"data":{"currentBlock":{"title":"Deep work","startTime":"09:00","endTime":"11:00"}}}""",
        )
        assertEquals("Deep work", snapshot?.title)
        assertEquals("09:00 – 11:00", snapshot?.timeRange())
    }

    @Test
    fun emptyTitleIsNotShown() {
        val snapshot = CurrentBlockSnapshot.fromTodayJson(
            """{"success":true,"data":{"currentBlock":{"title":"","startTime":"09:00","endTime":"11:00"}}}""",
        )
        assertNull(snapshot)
    }
}
