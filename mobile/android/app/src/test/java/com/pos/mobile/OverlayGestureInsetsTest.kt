package com.pos.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OverlayGestureInsetsTest {
    @Test
    fun heightMinusGapSubtractsBottomInset() {
        assertEquals(1000, OverlayGestureInsets.heightMinusGap(1080, 80))
        assertEquals(1, OverlayGestureInsets.heightMinusGap(50, 80))
        assertEquals(1080, OverlayGestureInsets.heightMinusGap(1080, 0))
        assertEquals(1080, OverlayGestureInsets.heightMinusGap(1080, -10))
    }

    @Test
    fun minBottomGapDpIsPositive() {
        assertTrue(OverlayGestureInsets.MIN_BOTTOM_GAP_DP >= 16)
    }
}
