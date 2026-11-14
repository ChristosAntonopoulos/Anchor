package com.pos.mobile

import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Rect
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextClock
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.LockScreenContent
import com.pos.mobile.launcher.NextActionResolver
import java.lang.ref.WeakReference
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.abs

/**
 * Minimal lock face shown over the keyguard.
 * Armed on screen-off so wake paints Anchor immediately (no system lock / icon flash).
 * Finishes on unlock so Answer / swipe / Recents keep working.
 */
class LockScreenActivity : AppCompatActivity() {
    private lateinit var root: LinearLayout
    private lateinit var dateView: TextView
    private lateinit var cueEyebrow: TextView
    private lateinit var cueTitle: TextView
    private lateinit var cueDetail: TextView
    private lateinit var statusLine: TextView
    private lateinit var mediaPanel: LinearLayout
    private lateinit var mediaLine: TextView
    private lateinit var mediaPlay: TextView
    private var stopMediaObserve: (() -> Unit)? = null
    private var edgeTrack = false
    private var edgeConsumed = false
    private var edgeStartX = 0f
    private var edgeStartY = 0f
    private val touchSlop by lazy { ViewConfiguration.get(this).scaledTouchSlop }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Lock flags before first frame so the window is eligible over keyguard immediately.
        applyLockWindowBeforeContent()
        super.onCreate(savedInstanceState)
        overridePendingTransition(0, 0)
        showing = WeakReference(this)
        paintTaskDescription()

        root = LinearLayout(this).apply {
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
        bindSystemGestureExclusion()
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
        mediaPanel = buildMediaPanel(root)
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
        root.addView(mediaPanel, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { bottomMargin = LauncherPalette.dp(root, 18) })
        root.addView(hint)

        root.isClickable = true
        root.isFocusable = true
        root.setOnClickListener { requestUnlock() }

        bindCopy()
        startMediaObserve()
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
        startMediaObserve()
        if (!isKeyguardLocked() && !isScreenOffLikely()) {
            finish()
        }
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        // Swipe-up on the stock keyguard peeks the old lock UI under us — eat those climbs.
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                edgeTrack = true
                edgeConsumed = false
                edgeStartX = event.x
                edgeStartY = event.y
            }
            MotionEvent.ACTION_MOVE -> {
                if (edgeTrack && isUpwardSwipe(event.x, event.y)) {
                    edgeConsumed = true
                    return true
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                val consumed = edgeConsumed || (edgeTrack && isUpwardSwipe(event.x, event.y))
                edgeTrack = false
                edgeConsumed = false
                if (consumed) {
                    return true
                }
            }
        }
        return super.dispatchTouchEvent(event)
    }

    override fun onStop() {
        super.onStop()
        // Stay armed while the display is off; do not finish here.
    }

    override fun finish() {
        stopMediaObserve()
        super.finish()
        overridePendingTransition(0, 0)
    }

    override fun onDestroy() {
        stopMediaObserve()
        if (showing?.get() === this) {
            showing = null
        }
        super.onDestroy()
    }

    private fun buildMediaPanel(host: View): LinearLayout {
        mediaLine = LauncherPalette.text(host, 14f, LauncherPalette.text, true).apply {
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            isClickable = true
            isFocusable = true
            contentDescription = "Open Spotify"
            setOnClickListener { openSpotifyFromLock() }
        }
        val prev = transportButton(host, "‹‹", "Previous") {
            LockScreenSpotify.skipPrevious()
        }
        mediaPlay = transportButton(host, "▶", "Play or pause") {
            LockScreenSpotify.playPause()
        }
        val next = transportButton(host, "››", "Next") {
            LockScreenSpotify.skipNext()
        }
        val transport = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            addView(prev, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            addView(mediaPlay, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
            addView(next, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        }
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            isClickable = true
            isFocusable = true
            // Absorb taps on the strip so they don't request unlock.
            setOnClickListener { /* no-op */ }
            addView(View(context).apply { setBackgroundColor(LauncherPalette.hairline) },
                LinearLayout.LayoutParams(LauncherPalette.dp(host, 40), 1).apply {
                    bottomMargin = LauncherPalette.dp(host, 14)
                })
            addView(LauncherPalette.eyebrow(host, "Spotify"))
            addView(mediaLine, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = LauncherPalette.dp(host, 6) })
            addView(transport, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = LauncherPalette.dp(host, 10) })
        }
    }

    private fun transportButton(host: View, glyph: String, label: String, onClick: () -> Unit): TextView {
        return LauncherPalette.text(host, 22f, LauncherPalette.accent, true).apply {
            text = glyph
            gravity = Gravity.CENTER
            minHeight = LauncherPalette.dp(host, 48)
            isClickable = true
            isFocusable = true
            contentDescription = label
            setOnClickListener { onClick() }
        }
    }

    private fun startMediaObserve() {
        if (stopMediaObserve != null) return
        stopMediaObserve = LockScreenSpotify.observe(this) { snap ->
            if (!::mediaPanel.isInitialized) return@observe
            bindMedia(snap)
        }
    }

    private fun stopMediaObserve() {
        stopMediaObserve?.invoke()
        stopMediaObserve = null
    }

    private fun bindMedia(snap: SpotifyLockSnapshot?) {
        if (snap == null) {
            mediaPanel.visibility = View.GONE
            return
        }
        mediaPanel.visibility = View.VISIBLE
        mediaLine.text = snap.line
        mediaLine.contentDescription = "Open Spotify. ${snap.line}"
        mediaPlay.text = if (snap.playing) "Ⅱ" else "▶"
        mediaPlay.contentDescription = if (snap.playing) "Pause" else "Play"
    }

    private fun openSpotifyFromLock() {
        val keyguard = getSystemService(KeyguardManager::class.java)
        if (keyguard?.isKeyguardLocked == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    LockScreenSpotify.openSpotify(this@LockScreenActivity)
                }
            })
        } else {
            LockScreenSpotify.openSpotify(this)
        }
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

    /** Prefer owning edge swipes so gesture-nav cannot open the stock keyguard shade. */
    private fun bindSystemGestureExclusion() {
        if (Build.VERSION.SDK_INT < 29 || !::root.isInitialized) return
        root.addOnLayoutChangeListener { view, _, _, _, _, _, _, _, _ ->
            if (view.width <= 0 || view.height <= 0) {
                ViewCompat.setSystemGestureExclusionRects(view, emptyList())
                return@addOnLayoutChangeListener
            }
            // Full face — swipe-up on lock must stay inside Anchor, not the OEM keyguard.
            ViewCompat.setSystemGestureExclusionRects(
                view,
                listOf(Rect(0, 0, view.width, view.height)),
            )
        }
        root.requestLayout()
    }

    private fun isUpwardSwipe(x: Float, y: Float): Boolean {
        val climb = edgeStartY - y
        val sideways = abs(x - edgeStartX)
        return climb > touchSlop * 2 && climb > sideways * 1.05f
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
