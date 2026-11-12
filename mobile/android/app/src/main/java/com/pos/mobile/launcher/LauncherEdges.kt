package com.pos.mobile.launcher

import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

object LauncherEdges {
    private const val SIDE_DP = 24
    private const val TOP_DP = 16
    private const val BOTTOM_DP = 12

    fun bind(view: View) {
        ViewCompat.setOnApplyWindowInsetsListener(view) { target, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
            )
            target.setPadding(
                bars.left + LauncherPalette.dp(target, SIDE_DP),
                bars.top + LauncherPalette.dp(target, TOP_DP),
                bars.right + LauncherPalette.dp(target, SIDE_DP),
                bars.bottom + LauncherPalette.dp(target, BOTTOM_DP),
            )
            insets
        }
        ViewCompat.requestApplyInsets(view)
    }
}
