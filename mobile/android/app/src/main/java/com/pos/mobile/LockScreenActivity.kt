package com.pos.mobile

import android.app.ActivityManager
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
 * Minimal lock face shown over the keyguard.
 * Armed on screen-off so wake paints Anchor immediately (no system lock / icon flash).
 * Finishes on unlock so Answer / swipe / Recents keep working.
 */
class LockScreenActivity : AppCompatActivity() {
    private lateinit var dateView: TextView
    private lateinit var cueEyebrow: TextView
    private lateinit var cueTitle: TextView
    private lateinit var cueDetail: TextView
    private lateinit var statusLine: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        // Lock flags before first frame so the window is eligible over keyguard immediately.
        applyLockWindowBeforeContent()
        super.onCreate(savedInstanceState)
        overridePendingTransition(0, 0)
        showing = WeakReference(this)
        paintTaskDescription()

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
        // Only bail if we clearly woke into an unlocked phone (not while arming for lock).
        if (!isKeyguardLocked() && !isScreenOffLikely()) {
            finish()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        overridePendingTransition(0, 0)
        bindCopy()
    }

    override fun onResume() {
        super.onResume()
        showing = WeakReference(this)
        overridePendingTransition(0, 0)
        if (!isScreenOffLikely()) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        bindCopy()
        if (!isKeyguardLocked() && !isScreenOffLikely()) {
            finish()
        }
    }

    override fun onStop() {
        super.onStop()
        // Stay armed while the display is off; do not finish here.
    }

    override fun finish() {
        super.finish()
        overridePendingTransition(0, 0)
    }

    override fun onDestroy() {
        if (showing?.get() === this) {
            showing = null
        }
        super.onDestroy()
    }

    private fun applyLockWindowBeforeContent() {
        // Never turn the screen on from this activity — arming on SCREEN_OFF must not wake.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(false)
        }
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= 29) {
            window.isNavigationBarContrastEnforced = false
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
        )
        // Keep-awake only while the panel is already interactive — never while arming on SCREEN_OFF.
        if (isScreenOffLikely()) {
            @Suppress("DEPRECATION")
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        // Explicitly clear turn-on so arming cannot wake the panel.
        @Suppress("DEPRECATION")
        window.clearFlags(WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }

    private fun paintTaskDescription() {
        val color = LauncherPalette.charcoal
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            setTaskDescription(
                ActivityManager.TaskDescription.Builder()
                    .setLabel("Anchor")
                    .setPrimaryColor(color)
                    .setBackgroundColor(color)
                    .build(),
            )
        } else {
            @Suppress("DEPRECATION")
            setTaskDescription(ActivityManager.TaskDescription("Anchor", null as android.graphics.Bitmap?, color))
        }
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

    /** Power manager screen-off while we are arming for the next wake. */
    private fun isScreenOffLikely(): Boolean {
        val pm = applicationContext.getSystemService(android.os.PowerManager::class.java) ?: return false
        return !pm.isInteractive
    }

    companion object {
        @Volatile
        private var showing: WeakReference<LockScreenActivity>? = null

        fun isShowing(): Boolean {
            val activity = showing?.get()
            return activity != null && !activity.isFinishing && !activity.isDestroyed
        }

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
