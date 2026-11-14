package com.pos.mobile

/**
 * Shared geometry helpers for gesture / inset math used by Home and unlock overlays.
 */
internal object OverlayGestureInsets {
    fun heightMinusGap(screenHeightPx: Int, bottomGapPx: Int): Int {
        return (screenHeightPx - bottomGapPx.coerceAtLeast(0)).coerceAtLeast(1)
    }
}
