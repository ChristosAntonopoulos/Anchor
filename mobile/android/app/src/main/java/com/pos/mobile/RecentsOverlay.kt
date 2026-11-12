package com.pos.mobile

import android.content.Context
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.pos.mobile.launcher.InstalledApps
import com.pos.mobile.launcher.LaunchableApp
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.RecentApps

class RecentsOverlay(
    context: Context,
) : LinearLayout(context) {
    private var close: (() -> Unit)? = null

    init {
        orientation = VERTICAL
        setBackgroundColor(LauncherPalette.charcoal)
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
        addView(LauncherPalette.text(this, 22f, LauncherPalette.text, true).apply { text = "Open apps" })
        addView(LauncherPalette.text(this, 13f, LauncherPalette.muted).apply {
            text = "Swipe up from the bottom of Home. Tap a name to return to it."
        }, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@RecentsOverlay, 4)
            bottomMargin = LauncherPalette.dp(this@RecentsOverlay, 16)
        })
        val list = LinearLayout(context).apply { orientation = VERTICAL }
        val apps = RecentApps.list(context)
        if (apps.isEmpty()) {
            list.addView(LauncherPalette.text(this, 15f, LauncherPalette.muted).apply {
                text = "Nothing is open yet. Apps you launch from Home will appear here."
                minHeight = LauncherPalette.dp(this@RecentsOverlay, 44)
                gravity = Gravity.CENTER_VERTICAL
            })
        } else {
            apps.forEach { app -> list.addView(row(app)) }
        }
        addView(ScrollView(context).apply {
            overScrollMode = OVER_SCROLL_NEVER
            addView(list)
        }, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        addView(LauncherPalette.link(this, "Home") { close?.invoke() }, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@RecentsOverlay, 12)
        })
    }

    fun setOnClose(block: () -> Unit) {
        close = block
    }

    private fun row(app: LaunchableApp): LinearLayout {
        val row = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            minimumHeight = LauncherPalette.dp(this@RecentsOverlay, 48)
        }
        val name = LauncherPalette.text(this, 16f, LauncherPalette.text).apply {
            text = app.label
            minHeight = LauncherPalette.dp(this@RecentsOverlay, 48)
            gravity = Gravity.CENTER_VERTICAL
            isClickable = true
            isFocusable = true
            contentDescription = "Open ${app.label}"
            setOnClickListener {
                if (!InstalledApps.launch(context, app)) {
                    Toast.makeText(context, "Couldn’t open ${app.label}", Toast.LENGTH_SHORT).show()
                } else {
                    close?.invoke()
                }
            }
        }
        row.addView(name, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))
        return row
    }
}
