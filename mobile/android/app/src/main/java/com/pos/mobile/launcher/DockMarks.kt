package com.pos.mobile.launcher

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable
import kotlin.math.min

enum class DockMark { PHONE, WALLET, CHAT, CURSOR, SPOTIFY }

object DockMarks {
    fun drawable(kind: DockMark, color: Int, strokePx: Float): Drawable {
        return MarkDrawable(kind, color, strokePx.coerceAtLeast(1f))
    }
}

private class MarkDrawable(
    private val kind: DockMark,
    color: Int,
    strokePx: Float,
) : Drawable() {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        style = Paint.Style.STROKE
        strokeWidth = strokePx
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }
    private val path = Path()

    override fun draw(canvas: Canvas) {
        val box = bounds
        val size = min(box.width(), box.height()).toFloat()
        if (size <= 0f) return
        val scale = size / 24f
        path.reset()
        trace(kind, path)
        canvas.save()
        canvas.translate(box.left + (box.width() - size) / 2f, box.top + (box.height() - size) / 2f)
        canvas.scale(scale, scale)
        canvas.drawPath(path, paint)
        canvas.restore()
    }

    override fun setAlpha(alpha: Int) {
        paint.alpha = alpha
        invalidateSelf()
    }

    override fun setColorFilter(colorFilter: ColorFilter?) {
        paint.colorFilter = colorFilter
        invalidateSelf()
    }

    @Suppress("OVERRIDE_DEPRECATION")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

    override fun getIntrinsicWidth() = 24
    override fun getIntrinsicHeight() = 24
}

private fun trace(kind: DockMark, path: Path) {
    when (kind) {
        DockMark.PHONE -> {
            path.addRoundRect(RectF(8.2f, 2.6f, 15.8f, 21.4f), 2.2f, 2.2f, Path.Direction.CW)
            path.moveTo(10.4f, 4.6f)
            path.lineTo(13.6f, 4.6f)
            path.addRoundRect(RectF(10.8f, 18.2f, 13.2f, 19.4f), 0.7f, 0.7f, Path.Direction.CW)
        }
        DockMark.WALLET -> {
            path.addRoundRect(RectF(3.5f, 7f, 20.5f, 19f), 2.4f, 2.4f, Path.Direction.CW)
            path.moveTo(3.5f, 11.4f)
            path.lineTo(20.5f, 11.4f)
            path.addRoundRect(RectF(6.2f, 13.8f, 11.4f, 16.4f), 0.9f, 0.9f, Path.Direction.CW)
        }
        DockMark.CHAT -> {
            path.addRoundRect(RectF(4f, 4f, 20f, 16.2f), 3.2f, 3.2f, Path.Direction.CW)
            path.moveTo(8.2f, 16.2f)
            path.lineTo(6.6f, 20.4f)
            path.lineTo(12.4f, 16.2f)
        }
        DockMark.CURSOR -> {
            path.moveTo(7.2f, 4f)
            path.lineTo(7.2f, 20.2f)
            path.lineTo(11.4f, 16f)
            path.lineTo(17.8f, 16f)
            path.close()
        }
        DockMark.SPOTIFY -> {
            path.addArc(RectF(7.2f, 9.1f, 15.4f, 15.1f), -62f, 124f)
            path.addArc(RectF(5.1f, 6.4f, 18.2f, 17.8f), -62f, 124f)
            path.addArc(RectF(3.2f, 3.8f, 20.8f, 20.4f), -62f, 124f)
        }
    }
}
