package com.pos.mobile

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

object UnlockReasonOverlay {
    private const val TAG = "UnlockReasonOverlay"
    private val mainHandler = Handler(Looper.getMainLooper())
    private val reasons = listOf("No reason", "A task", "A message")

    @Volatile
    private var overlayView: View? = null

    val isShowing: Boolean
        get() = overlayView != null

    fun show(host: Context, unlockTime: Long): Boolean {
        if (overlayView != null) {
            return true
        }
        if (Looper.myLooper() == Looper.getMainLooper()) {
            return showOnMain(host, unlockTime)
        }
        mainHandler.post { showOnMain(host, unlockTime) }
        return true
    }

    fun hide() {
        mainHandler.post { hideOnMain() }
    }

    private fun showOnMain(host: Context, unlockTime: Long): Boolean {
        if (overlayView != null) {
            return true
        }
        val windowType = windowTypeFor(host) ?: return false
        val windowContext = host.applicationContext
        val layout = buildLayout(windowContext, unlockTime)
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            windowType,
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.CENTER
            title = "POS Unlock prompt"
        }
        return try {
            val windowManager = windowContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            windowManager.addView(layout, params)
            overlayView = layout
            android.util.Log.d(TAG, "Unlock overlay shown")
            true
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not show unlock overlay", error)
            false
        }
    }

    private fun hideOnMain() {
        val view = overlayView ?: return
        try {
            val windowManager = view.context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            windowManager.removeView(view)
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not hide unlock overlay", error)
        }
        overlayView = null
    }

    private fun windowTypeFor(host: Context): Int? {
        val canOverlay = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
            Settings.canDrawOverlays(host)
        if (!canOverlay) {
            return null
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    private fun buildLayout(context: Context, unlockTime: Long): View {
        val density = context.resources.displayMetrics.density
        fun dp(value: Int) = (value * density).toInt()

        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#F20F1419"))
            setPadding(dp(24), dp(24), dp(24), dp(24))
        }

        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(Color.parseColor("#1E2530"), dp(20))
            setPadding(dp(22), dp(28), dp(22), dp(22))
        }

        val title = TextView(context).apply {
            text = "Why did you unlock your phone?"
            setTextColor(Color.parseColor("#E8EAED"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(context).apply {
            text = "Pick one. This is how the app tracks what pulled you back to the screen."
            setTextColor(Color.parseColor("#8B95A6"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            gravity = Gravity.CENTER
            setPadding(0, dp(10), 0, dp(20))
        }
        card.addView(title)
        card.addView(subtitle)

        reasons.forEach { label ->
            val button = Button(context).apply {
                text = label
                isAllCaps = false
                setTextColor(Color.parseColor("#132E2A"))
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
                background = rounded(Color.parseColor("#C7E5CD"), dp(14))
                setPadding(dp(16), dp(14), dp(16), dp(14))
                setOnClickListener {
                    hideOnMain()
                    PhoneUnlockModule.resetPendingUnlockTime()
                    PhoneUnlockApi.submit(context, label, unlockTime)
                }
            }
            val buttonParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = dp(10)
            }
            card.addView(button, buttonParams)
        }

        root.addView(
            card,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        )
        return root
    }

    private fun rounded(color: Int, radius: Int): GradientDrawable {
        return GradientDrawable().apply {
            setColor(color)
            cornerRadius = radius.toFloat()
        }
    }
}
