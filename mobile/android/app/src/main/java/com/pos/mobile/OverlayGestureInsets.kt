package com.pos.mobile

import android.content.Context
import android.graphics.Point
import android.os.Build
import android.view.WindowInsets
import android.view.WindowManager
import kotlin.math.max

/**
 * Keeps TYPE_APPLICATION_OVERLAY windows clear of the system gesture / Home swipe strip
 * so bottom swipes (open apps / home) still reach HomeActivity while an overlay is up.
 */
internal object OverlayGestureInsets {
    /** Floor when OEMs report 0 for gesture insets (common on some Nothing / gesture-nav builds). */
    /** Tall enough to start Home’s open-apps swipe while Answer is still on screen. */
    const val MIN_BOTTOM_GAP_DP = 56

    fun bottomGapPx(context: Context, windowManager: WindowManager): Int {
        val density = context.resources.displayMetrics.density
        val floor = (MIN_BOTTOM_GAP_DP * density).toInt().coerceAtLeast(1)
        val reported = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val insets = windowManager.currentWindowMetrics.windowInsets
            max(
                insets.getInsets(WindowInsets.Type.systemGestures()).bottom,
                max(
                    insets.getInsets(WindowInsets.Type.mandatorySystemGestures()).bottom,
                    insets.getInsets(WindowInsets.Type.navigationBars()).bottom,
                ),
            )
        } else {
            navBarHeightPx(context)
        }
        return max(reported, floor)
    }

    fun windowHeightPx(windowManager: WindowManager, bottomGapPx: Int): Int {
        val screenHeight = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            windowManager.currentWindowMetrics.bounds.height()
        } else {
            @Suppress("DEPRECATION")
            val size = Point()
            windowManager.defaultDisplay.getRealSize(size)
            size.y
        }
        return heightMinusGap(screenHeight, bottomGapPx)
    }

    fun heightMinusGap(screenHeightPx: Int, bottomGapPx: Int): Int {
        return (screenHeightPx - bottomGapPx.coerceAtLeast(0)).coerceAtLeast(1)
    }

    fun navBarHeightPx(context: Context): Int {
        val resId = context.resources.getIdentifier("navigation_bar_height", "dimen", "android")
        return if (resId > 0) context.resources.getDimensionPixelSize(resId) else 0
    }
}
