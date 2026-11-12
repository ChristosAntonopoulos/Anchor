package com.pos.mobile.launcher

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.widget.TextView

object LauncherPalette {
    val charcoal = Color.parseColor("#151D1B")
    val surface = Color.parseColor("#1E2925")
    val raised = Color.parseColor("#26332D")
    val text = Color.parseColor("#EAF0EB")
    val muted = Color.parseColor("#9AAEA2")
    val accent = Color.parseColor("#A4CDBB")
    val onAccent = Color.parseColor("#152B23")
    val danger = Color.parseColor("#ECA7A1")

    fun card(): GradientDrawable = GradientDrawable().apply {
        setColor(surface)
        cornerRadius = 28f
        setStroke(2, Color.parseColor("#3B4C42"))
    }

    fun pill(fill: Int = accent): GradientDrawable = GradientDrawable().apply {
        setColor(fill)
        cornerRadius = 40f
    }

    fun outline(): GradientDrawable = GradientDrawable().apply {
        setColor(Color.TRANSPARENT)
        cornerRadius = 40f
        setStroke(2, accent)
    }

    fun dp(view: View, value: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), view.resources.displayMetrics).toInt()

    fun text(view: View, sizeSp: Float, color: Int, bold: Boolean = false): TextView {
        return TextView(view.context).apply {
            setTextColor(color)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
            typeface = if (bold) Typeface.create("sans-serif-medium", Typeface.NORMAL) else Typeface.SANS_SERIF
            includeFontPadding = false
        }
    }

    fun button(view: View, label: String, filled: Boolean = true, onClick: () -> Unit): TextView {
        val min = dp(view, 48)
        return text(view, 16f, if (filled) onAccent else accent, true).apply {
            text = label
            gravity = Gravity.CENTER
            background = if (filled) pill() else outline()
            minHeight = min
            minWidth = min
            setPadding(dp(view, 16), dp(view, 12), dp(view, 16), dp(view, 12))
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
        }
    }
}
