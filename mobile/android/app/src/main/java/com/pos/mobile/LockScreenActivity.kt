package com.pos.mobile

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextClock
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.LockScreenContent
import com.pos.mobile.launcher.NextActionResolver
import java.lang.ref.WeakReference
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Minimal lock face shown over the keyguard while the screen is on.
 * Matches Home chrome (thin middle-dot clock, faint date, sparse cue + pipeline line).
 * Finishes on unlock so Answer / swipe / Recents keep working.
 */
class LockScreenActivity : AppCompatActivity() {
    private lateinit var dateView: TextView
    private lateinit var cueEyebrow: TextView
    private lateinit var cueTitle: TextView
    private lateinit var cueDetail: TextView
    private lateinit var statusLine: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        showing = WeakReference(this)
        applyLockWindow()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(LauncherPalette.charcoal)
            setPadding(
                LauncherPalette.dp(this, 28),
                LauncherPalette.dp(this, 72),
                LauncherPalette.dp(this, 28),
                LauncherPalette.dp(this, 40),
            )
        }
        setContentView(root)
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        dateView = LauncherPalette.text(root, 11f, LauncherPalette.faint, true).apply {
            letterSpacing = 0.2f
        }
        val clock = TextClock(this).apply {
            format12Hour = "h · mm"
            format24Hour = "HH · mm"
            setTextColor(LauncherPalette.text)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 56f)
            typeface = Typeface.create("sans-serif-thin", Typeface.NORMAL)
            letterSpacing = 0.08f
            includeFontPadding = false
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Clock"
        }
        val rule = View(this).apply { setBackgroundColor(LauncherPalette.hairline) }

        cueEyebrow = LauncherPalette.eyebrow(root, "NOW")
        cueTitle = LauncherPalette.text(root, 20f, LauncherPalette.text, true).apply {
            setLineSpacing(0f, 1.15f)
        }
        cueDetail = LauncherPalette.text(root, 14f, LauncherPalette.muted).apply {
            setLineSpacing(0f, 1.2f)
            setPadding(0, LauncherPalette.dp(root, 6), 0, 0)
        }
        statusLine = LauncherPalette.text(root, 12f, LauncherPalette.faint).apply {
            setPadding(0, LauncherPalette.dp(root, 18), 0, 0)
            letterSpacing = 0.02f
        }
        val hint = LauncherPalette.text(root, 12f, LauncherPalette.faint).apply {
            text = "Unlock to continue"
            gravity = Gravity.CENTER_HORIZONTAL
        }

        root.addView(dateView)
        root.addView(clock, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { topMargin = LauncherPalette.dp(root, 8) })
        root.addView(rule, LinearLayout.LayoutParams(LauncherPalette.dp(root, 40), 1).apply {
            topMargin = LauncherPalette.dp(root, 22)
            bottomMargin = LauncherPalette.dp(root, 28)
        })
        root.addView(cueEyebrow)
        root.addView(cueTitle, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { topMargin = LauncherPalette.dp(root, 8) })
        root.addView(cueDetail)
        root.addView(statusLine)
        root.addView(View(this), LinearLayout.LayoutParams(0, 0, 1f))
        root.addView(hint)

        root.isClickable = true
        root.isFocusable = true
        root.setOnClickListener { requestUnlock() }

        bindCopy()
        if (!isKeyguardLocked()) {
            finish()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        bindCopy()
        if (!isKeyguardLocked()) {
            finish()
        }
    }

    override fun onResume() {
        super.onResume()
        showing = WeakReference(this)
        bindCopy()
        if (!isKeyguardLocked()) {
            finish()
        }
    }

    override fun onDestroy() {
        if (showing?.get() === this) {
            showing = null
        }
        super.onDestroy()
    }

    private fun applyLockWindow() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= 29) {
            window.isNavigationBarContrastEnforced = false
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun bindCopy() {
        dateView.text = SimpleDateFormat("EEEE  d MMMM", Locale.getDefault())
            .format(Date())
            .uppercase(Locale.getDefault())
        dateView.contentDescription = dateView.text

        val lines = LockScreenContent.resolve(
            next = NextActionResolver.resolve(this),
            widgets = OsWidgetStore.read(this),
        )
        cueEyebrow.text = lines.cueEyebrow
        cueTitle.text = lines.cueTitle
        if (lines.cueDetail.isBlank()) {
            cueDetail.visibility = View.GONE
        } else {
            cueDetail.visibility = View.VISIBLE
            cueDetail.text = lines.cueDetail
        }
        if (lines.statusLine.isNullOrBlank()) {
            statusLine.visibility = View.GONE
        } else {
            statusLine.visibility = View.VISIBLE
            statusLine.text = lines.statusLine
        }
    }

    private fun requestUnlock() {
        val keyguard = getSystemService(KeyguardManager::class.java) ?: return
        if (!keyguard.isKeyguardLocked) {
            finish()
            return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    // USER_PRESENT path finishes this activity and runs Answer.
                }
            })
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD)
        }
    }

    private fun isKeyguardLocked(): Boolean {
        val keyguard = getSystemService(KeyguardManager::class.java)
        return keyguard?.isKeyguardLocked == true
    }

    companion object {
        @Volatile
        private var showing: WeakReference<LockScreenActivity>? = null

        fun intent(context: Context): Intent {
            return Intent(context, LockScreenActivity::class.java).apply {
                flags = LockScreenHost.intentFlags()
            }
        }

        fun finishIfShowing() {
            showing?.get()?.let { activity ->
                if (!activity.isFinishing) {
                    activity.finish()
                }
            }
            showing = null
        }
    }
}
