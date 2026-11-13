package com.pos.mobile

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.pos.mobile.launcher.LauncherPalette

object ClusterLogsOverlay {
    fun show(activity: Activity, title: String, body: String) {
        val root = activity.findViewById<ViewGroup>(android.R.id.content)
        val host: View = activity.window.decorView
        val overlay = FrameLayout(activity).apply {
            setBackgroundColor(Color.parseColor("#CC0B1210"))
            isClickable = true
            isFocusable = true
        }
        val card = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(LauncherPalette.surface)
                cornerRadius = LauncherPalette.dp(host, 22).toFloat()
                setStroke(1, LauncherPalette.hairline)
            }
            val pad = LauncherPalette.dp(host, 16)
            setPadding(pad, pad, pad, pad)
        }
        val header = LinearLayout(activity).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val titleView = LauncherPalette.text(host, 16f, LauncherPalette.text, true).apply {
            text = title.ifBlank { "Logs" }
        }
        fun dismiss() {
            root.removeView(overlay)
        }
        val copy = LauncherPalette.link(host, "Copy") {
            val clipboard = activity.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("cluster-logs", body))
            Toast.makeText(activity, "Copied", Toast.LENGTH_SHORT).show()
        }
        val close = LauncherPalette.link(host, "Close") { dismiss() }
        header.addView(titleView, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        header.addView(copy)
        header.addView(
            close,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                marginStart = LauncherPalette.dp(host, 12)
            },
        )
        val scroll = ScrollView(activity)
        val log = TextView(activity).apply {
            typeface = Typeface.MONOSPACE
            setTextColor(LauncherPalette.text)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            text = body.ifBlank { "(empty)" }
            setTextIsSelectable(true)
        }
        scroll.addView(log)
        card.addView(header)
        card.addView(
            scroll,
            LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f).apply {
                topMargin = LauncherPalette.dp(host, 12)
            },
        )
        val margin = LauncherPalette.dp(host, 18)
        overlay.addView(
            card,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ).apply {
                setMargins(margin, margin * 2, margin, margin * 2)
            },
        )
        root.addView(
            overlay,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )
    }
}
