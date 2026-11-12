package com.pos.mobile.launcher

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.Drawable
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewOutlineProvider
import android.widget.ImageView
import android.widget.TextView

object LauncherPalette {
    val charcoal = Color.parseColor("#151D1B")
    val surface = Color.parseColor("#1C2622")
    val raised = Color.parseColor("#24302B")
    val text = Color.parseColor("#EAF0EB")
    val muted = Color.parseColor("#9AAEA2")
    val faint = Color.parseColor("#6F8278")
    val accent = Color.parseColor("#A4CDBB")
    val onAccent = Color.parseColor("#152B23")
    val hairline = Color.parseColor("#2E3D37")
    val danger = Color.parseColor("#ECA7A1")

    fun card(): GradientDrawable = GradientDrawable().apply {
        setColor(surface)
        cornerRadius = 26f
        setStroke(1, hairline)
    }

    fun well(): GradientDrawable = GradientDrawable().apply {
        setColor(raised)
        cornerRadius = 22f
    }

    fun pill(fill: Int = accent): GradientDrawable = GradientDrawable().apply {
        setColor(fill)
        cornerRadius = 40f
    }

    fun outline(): GradientDrawable = GradientDrawable().apply {
        setColor(Color.TRANSPARENT)
        cornerRadius = 40f
        setStroke(1, Color.parseColor("#4A5E55"))
    }

    fun searchField(): GradientDrawable = GradientDrawable().apply {
        setColor(raised)
        cornerRadius = 18f
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

    fun eyebrow(view: View, label: String): TextView {
        return text(view, 11f, faint, true).apply {
            text = label.uppercase()
            letterSpacing = 0.14f
        }
    }

    fun link(view: View, label: String, onClick: () -> Unit): TextView {
        return text(view, 13f, accent, true).apply {
            text = label
            gravity = Gravity.CENTER_VERTICAL
            minHeight = dp(view, 44)
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
        }
    }

    fun button(view: View, label: String, filled: Boolean = true, onClick: () -> Unit): TextView {
        val min = dp(view, 44)
        return text(view, 14f, if (filled) onAccent else accent, true).apply {
            text = label
            gravity = Gravity.CENTER
            background = if (filled) pill() else outline()
            minHeight = min
            minWidth = min
            setPadding(dp(view, 16), dp(view, 10), dp(view, 16), dp(view, 10))
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
        }
    }

    fun appIcon(view: View, drawable: Drawable, sizeDp: Int = 40): ImageView {
        val size = dp(view, sizeDp)
        val radius = size * 0.28f
        return ImageView(view.context).apply {
            setImageDrawable(drawable)
            scaleType = ImageView.ScaleType.CENTER_CROP
            background = GradientDrawable().apply {
                setColor(raised)
                cornerRadius = radius
            }
            clipToOutline = true
            outlineProvider = ViewOutlineProvider.BACKGROUND
            layoutParams = android.widget.LinearLayout.LayoutParams(size, size)
        }
    }

    fun glyph(view: View, letter: String, sizeDp: Int = 40): TextView {
        val size = dp(view, sizeDp)
        return text(view, 15f, accent, true).apply {
            text = letter.take(1).uppercase()
            gravity = Gravity.CENTER
            background = well()
            minHeight = size
            minWidth = size
            layoutParams = android.widget.LinearLayout.LayoutParams(size, size)
        }
    }
}
