package com.pos.mobile

import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.graphics.Typeface
import android.os.Build
import android.os.Bundle
import android.util.TypedValue
import android.view.GestureDetector
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextClock
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import com.pos.mobile.launcher.DockApp
import com.pos.mobile.launcher.InstalledApps
import com.pos.mobile.launcher.LauncherEdges
import com.pos.mobile.launcher.LauncherIntents
import com.pos.mobile.launcher.LauncherLayout
import com.pos.mobile.launcher.LauncherLayoutStore
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.WidgetAction
import com.pos.mobile.launcher.WidgetHost
import com.pos.mobile.ControlPanelClient
import kotlin.math.abs
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class HomeActivity : AppCompatActivity() {
    private lateinit var root: LinearLayout
    private lateinit var homeWidgets: WidgetHost
    private lateinit var developerWidgets: WidgetHost
    private lateinit var homeColumn: LinearLayout
    private lateinit var developerColumn: LinearLayout
    private lateinit var favoritesColumn: LinearLayout
    private lateinit var pageLabel: TextView
    private lateinit var dateView: TextView
    private var allApps: AllAppsOverlay? = null
    private var recents: RecentsOverlay? = null
    private var edit: EditHomeOverlay? = null
    private var openedRecents = false
    private var recentsTrack = false
    private var recentsStartX = 0f
    private var recentsStartY = 0f
    private lateinit var recentsDetector: GestureDetector
    private var layout: LauncherLayout = LauncherLayoutStore.defaultLayout()
    private var showingDeveloper = false
    private val preview: Boolean
        get() = intent?.getBooleanExtra(LauncherIntents.EXTRA_PREVIEW, false) == true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= 29) {
            window.isNavigationBarContrastEnforced = false
        }
        layout = LauncherLayoutStore.load(this)
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(LauncherPalette.charcoal)
        }
        setContentView(root)
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
        LauncherEdges.bind(root)
        bindOpenAppsGestureExclusion()
        recentsDetector = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
                val start = e1 ?: return false
                if (recents != null || allApps != null || edit != null) return false
                val zone = root.height - LauncherPalette.dp(root, RECENTS_ZONE_DP)
                if (start.y < zone) return false
                // Softer thresholds so open-apps feels immediate without stealing side swipes.
                if (velocityY > -RECENTS_MIN_VELOCITY || abs(velocityY) < abs(velocityX) * 1.05f) return false
                if (start.y - e2.y < LauncherPalette.dp(root, RECENTS_CLIMB_DP)) return false
                openRecents()
                openedRecents = true
                return true
            }
        })
        buildChrome()
        showHome()
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    recents != null -> closeRecents()
                    edit != null -> closeEdit()
                    allApps != null -> closeAllApps()
                    showingDeveloper -> showHome()
                    preview -> finish()
                    else -> moveTaskToBack(true)
                }
            }
        })
        val fromUnlock = intent?.getBooleanExtra(LauncherIntents.EXTRA_FROM_UNLOCK, false) == true
        val openRecentsExtra = intent?.getBooleanExtra(LauncherIntents.EXTRA_OPEN_RECENTS, false) == true
        if (!layout.sawFavoritesPrompt && !fromUnlock && !openRecentsExtra) {
            openAllApps(pickingFavorites = true)
        }
        if (openRecentsExtra) {
            openRecents()
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        closeAllApps()
        closeEdit()
        val openRecentsExtra = intent.getBooleanExtra(LauncherIntents.EXTRA_OPEN_RECENTS, false)
        closeRecents()
        showHome()
        if (openRecentsExtra) {
            openRecents()
        }
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (::recentsDetector.isInitialized) recentsDetector.onTouchEvent(event)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                recentsTrack = recents == null && allApps == null && edit == null &&
                    ::root.isInitialized && event.y >= root.height - LauncherPalette.dp(root, RECENTS_ZONE_DP)
                recentsStartX = event.x
                recentsStartY = event.y
            }
            MotionEvent.ACTION_MOVE -> {
                // Open as soon as the climb clears the threshold — waiting for UP felt laggy.
                if (recentsTrack && recents == null && ::root.isInitialized && tryOpenRecentsFromTrack(event.x, event.y)) {
                    openedRecents = true
                    recentsTrack = false
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (recentsTrack && recents == null && ::root.isInitialized) {
                    if (tryOpenRecentsFromTrack(event.x, event.y)) {
                        openedRecents = true
                    }
                }
                recentsTrack = false
            }
        }
        if (openedRecents) {
            if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
                openedRecents = false
            }
            return true
        }
        return super.dispatchTouchEvent(event)
    }

    private fun tryOpenRecentsFromTrack(x: Float, y: Float): Boolean {
        val climb = recentsStartY - y
        val sideways = abs(x - recentsStartX)
        if (climb <= LauncherPalette.dp(root, RECENTS_CLIMB_DP) || climb <= sideways * 1.1f) {
            return false
        }
        openRecents()
        return true
    }

    /** Prefer Anchor’s open-apps list over system Overview where Android allows. */
    private fun bindOpenAppsGestureExclusion() {
        if (Build.VERSION.SDK_INT < 29) return
        root.addOnLayoutChangeListener { view, _, _, _, _, _, _, _, _ ->
            val zone = LauncherPalette.dp(view, RECENTS_ZONE_DP)
            if (view.height <= zone) {
                ViewCompat.setSystemGestureExclusionRects(view, emptyList())
                return@addOnLayoutChangeListener
            }
            val rect = Rect(0, view.height - zone, view.width, view.height)
            ViewCompat.setSystemGestureExclusionRects(view, listOf(rect))
        }
    }

    override fun onResume() {
        super.onResume()
        refreshVisible()
        if (intent?.getBooleanExtra(LauncherIntents.EXTRA_OPEN_RECENTS, false) == true) {
            intent?.removeExtra(LauncherIntents.EXTRA_OPEN_RECENTS)
            if (recents == null) openRecents()
        }
    }

    private fun buildChrome() {
        val openNow = View.OnClickListener { LauncherIntents.openPersonalAi(this, "pos://os/now") }
        dateView = LauncherPalette.text(root, 11f, LauncherPalette.faint, true).apply {
            letterSpacing = 0.2f
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            isClickable = true
            isFocusable = true
            minHeight = LauncherPalette.dp(root, 32)
            gravity = Gravity.CENTER_VERTICAL
            setOnClickListener(openNow)
        }
        bindDate()
        val clock = TextClock(this).apply {
            format12Hour = "h · mm"
            format24Hour = "HH · mm"
            setTextColor(LauncherPalette.text)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 44f)
            typeface = Typeface.create("sans-serif-thin", Typeface.NORMAL)
            letterSpacing = 0.08f
            includeFontPadding = false
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Clock. Open Personal AI."
            isClickable = true
            isFocusable = true
            minHeight = LauncherPalette.dp(root, 48)
            setOnClickListener(openNow)
        }
        val rule = View(this).apply { setBackgroundColor(LauncherPalette.hairline) }
        homeWidgets = WidgetHost(this, ::dispatch)
        developerWidgets = WidgetHost(this, ::dispatch)
        favoritesColumn = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val developerTitle = LauncherPalette.eyebrow(root, "Developer")
        homeColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(homeWidgets)
            addView(favoritesColumn, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                topMargin = LauncherPalette.dp(root, 6)
            })
        }
        developerColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            addView(developerTitle, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = LauncherPalette.dp(root, 12)
            })
            addView(developerWidgets)
        }
        val pages = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(homeColumn)
            addView(developerColumn)
        }
        val detector = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onFling(e1: MotionEvent?, e2: MotionEvent, velocityX: Float, velocityY: Float): Boolean {
                val start = e1 ?: return false
                if (abs(e2.x - start.x) < 80 || abs(e2.x - start.x) < abs(e2.y - start.y)) return false
                if (e2.x < start.x) showDeveloper() else showHome()
                return true
            }
        })
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            overScrollMode = View.OVER_SCROLL_NEVER
            addView(pages)
            setOnTouchListener { view, event ->
                detector.onTouchEvent(event)
                view.onTouchEvent(event)
            }
        }
        root.addView(dateView)
        root.addView(clock, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 6)
        })
        root.addView(rule, LinearLayout.LayoutParams(LauncherPalette.dp(root, 40), 1).apply {
            topMargin = LauncherPalette.dp(root, 16)
            bottomMargin = LauncherPalette.dp(root, 18)
        })
        root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(dock())
        root.addView(footer())
        root.addView(homeHandle())
        bindWidgets()
        bindFavorites()
    }

    private fun dock(): LinearLayout {
        val wrap = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        val apps = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        listOf(
            InstalledApps.PHONE_APP,
            InstalledApps.WALLET_APP,
            InstalledApps.CHATGPT_APP,
            InstalledApps.CURSOR_APP,
            InstalledApps.SPOTIFY_APP,
        ).forEach { target ->
            apps.addView(dockCell(target), LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        }
        val tools = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        tools.addView(quietLink("Capture") { LauncherIntents.openCapture(this) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        tools.addView(quietLink("All apps") { openAllApps(false) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        tools.addView(quietLink("Personal AI") { LauncherIntents.openPersonalAi(this, "pos://os/now") }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        wrap.addView(apps, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 8)
        })
        wrap.addView(tools, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 2)
        })
        return wrap
    }

    private fun dockCell(target: DockApp): View {
        val col = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            isClickable = true
            isFocusable = true
            contentDescription = "Open ${target.label}"
            minimumHeight = LauncherPalette.dp(root, 72)
            setPadding(0, LauncherPalette.dp(root, 8), 0, LauncherPalette.dp(root, 4))
            setOnClickListener {
                if (!InstalledApps.openDock(this@HomeActivity, target)) {
                    Toast.makeText(this@HomeActivity, "${target.label} isn’t installed", Toast.LENGTH_SHORT).show()
                }
            }
        }
        col.addView(LauncherPalette.mark(root, target.mark, 26))
        col.addView(LauncherPalette.text(root, 11f, LauncherPalette.faint).apply {
            text = target.label
            gravity = Gravity.CENTER
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
        }, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 6)
        })
        return col
    }

    private fun quietLink(label: String, onClick: () -> Unit): TextView {
        return LauncherPalette.text(root, 13f, LauncherPalette.muted, true).apply {
            text = label
            gravity = Gravity.CENTER
            minHeight = LauncherPalette.dp(root, 44)
            isClickable = true
            isFocusable = true
            contentDescription = label
            setOnClickListener { onClick() }
        }
    }

    private fun footer(): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        fun link(label: String, onClick: () -> Unit): TextView {
            return LauncherPalette.text(root, 12f, LauncherPalette.faint).apply {
                text = label
                minHeight = LauncherPalette.dp(root, 44)
                gravity = Gravity.CENTER
                isClickable = true
                isFocusable = true
                setOnClickListener { onClick() }
            }
        }
        pageLabel = link("Developer") { showDeveloper() }
        row.addView(pageLabel, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(link("Edit") { openEdit() }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(link("Switch Home") { LauncherIntents.openHomeSettings(this) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        return row
    }

    private fun homeHandle(): View {
        val row = LinearLayout(this).apply {
            gravity = Gravity.CENTER
            minimumHeight = LauncherPalette.dp(root, 28)
            isClickable = true
            isFocusable = true
            contentDescription = "Open apps"
            setOnClickListener { openRecents() }
        }
        val pill = View(this).apply {
            background = GradientDrawable().apply {
                setColor(LauncherPalette.faint)
                alpha = 120
                cornerRadius = LauncherPalette.dp(root, 2).toFloat()
            }
        }
        row.addView(pill, LinearLayout.LayoutParams(LauncherPalette.dp(root, 40), LauncherPalette.dp(root, 3)))
        return row
    }

    private fun bindWidgets() {
        homeWidgets.bind(layout.homeWidgets())
        developerWidgets.bind(layout.developerWidgets())
    }

    private fun bindFavorites() {
        favoritesColumn.removeAllViews()
        val heading = LauncherPalette.eyebrow(root, "Favorites")
        heading.minHeight = LauncherPalette.dp(root, 28)
        heading.gravity = Gravity.CENTER_VERTICAL
        heading.isClickable = true
        heading.isFocusable = true
        heading.contentDescription = "Edit favorites"
        heading.setOnClickListener { openAllApps(true) }
        favoritesColumn.addView(heading)
        val favorites = layout.favorites.mapNotNull { favorite ->
            InstalledApps.resolve(this, favorite)
        }.take(5)
        if (favorites.isEmpty()) {
            val empty = LauncherPalette.text(root, 15f, LauncherPalette.muted)
            empty.text = "Tap to pin up to five apps"
            empty.minHeight = LauncherPalette.dp(root, 44)
            empty.gravity = Gravity.CENTER_VERTICAL
            empty.setOnClickListener { openAllApps(true) }
            favoritesColumn.addView(empty)
            return
        }
        favorites.forEach { app ->
            val name = LauncherPalette.text(root, 16f, LauncherPalette.text).apply {
                text = app.label
                minHeight = LauncherPalette.dp(root, 44)
                gravity = Gravity.CENTER_VERTICAL
                isClickable = true
                isFocusable = true
                contentDescription = "Open ${app.label}"
                setOnClickListener {
                    if (!InstalledApps.launch(this@HomeActivity, app)) {
                        Toast.makeText(this@HomeActivity, "Couldn’t open ${app.label}", Toast.LENGTH_SHORT).show()
                    }
                }
                setOnLongClickListener {
                    openAllApps(true)
                    true
                }
            }
            favoritesColumn.addView(name)
        }
    }

    private fun bindDate() {
        dateView.text = SimpleDateFormat("EEEE  d MMMM", Locale.getDefault())
            .format(Date())
            .uppercase(Locale.getDefault())
        dateView.contentDescription = dateView.text
    }

    private fun dispatch(action: WidgetAction) {
        when (action) {
            is WidgetAction.OpenRoute -> LauncherIntents.openPersonalAi(this, action.url)
            is WidgetAction.OpenUrl -> {
                try {
                    LauncherIntents.openExternalUrl(this, action.url)
                } catch (_: Exception) {
                    Toast.makeText(this, "Couldn't open link", Toast.LENGTH_SHORT).show()
                }
            }
            is WidgetAction.FetchLogs -> showClusterLogs(action.title, action.path)
            is WidgetAction.Details -> {
                val body = homeWidgets.provider(action.instanceId)?.body()
                    ?: developerWidgets.provider(action.instanceId)?.body()
                    ?: "No extra detail."
                Toast.makeText(this, body, Toast.LENGTH_LONG).show()
            }
            is WidgetAction.Refresh -> {
                homeWidgets.provider(action.instanceId)?.refresh()
                developerWidgets.provider(action.instanceId)?.refresh()
            }
        }
    }

    private fun showClusterLogs(title: String, path: String) {
        Toast.makeText(this, "Loading logs…", Toast.LENGTH_SHORT).show()
        ControlPanelClient.enqueue {
            val result = runCatching { ControlPanelClient.fetchLogs(this, path) }
            runOnUiThread {
                result.fold(
                    onSuccess = { text -> ClusterLogsOverlay.show(this, title, text) },
                    onFailure = {
                        Toast.makeText(this, "Couldn't load logs", Toast.LENGTH_SHORT).show()
                    },
                )
            }
        }
    }

    private fun showHome() {
        showingDeveloper = false
        homeColumn.visibility = View.VISIBLE
        developerColumn.visibility = View.GONE
        pageLabel.text = "Developer"
        pageLabel.setOnClickListener { showDeveloper() }
        refreshVisible()
    }

    private fun showDeveloper() {
        showingDeveloper = true
        homeColumn.visibility = View.GONE
        developerColumn.visibility = View.VISIBLE
        pageLabel.text = "Home"
        pageLabel.setOnClickListener { showHome() }
        refreshVisible()
    }

    private fun refreshVisible() {
        bindDate()
        layout.homeWidgets().forEach { homeWidgets.provider(it.instanceId)?.refresh() }
        layout.developerWidgets().forEach { developerWidgets.provider(it.instanceId)?.refresh() }
        bindFavorites()
    }

    private fun openRecents() {
        if (recents != null) return
        // Answer (unlock) overlay sits above Home; dismiss it so open-apps is visible.
        if (UnlockReasonOverlay.isShowing) {
            UnlockReasonOverlay.hideForSystemDismissal()
        }
        closeAllApps()
        closeEdit()
        val overlay = RecentsOverlay(this)
        overlay.setOnClose { closeRecents() }
        recents = overlay
        addContentView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        LauncherEdges.bind(overlay)
    }

    private fun closeRecents() {
        (recents?.parent as? ViewGroup)?.removeView(recents)
        recents = null
    }

    private fun openAllApps(pickingFavorites: Boolean) {
        closeRecents()
        closeAllApps()
        val overlay = AllAppsOverlay(this, layout, pickingFavorites) { next ->
            layout = next
            LauncherLayoutStore.save(this, layout)
            bindFavorites()
        }
        overlay.setOnClose { closeAllApps() }
        allApps = overlay
        addContentView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        LauncherEdges.bind(overlay)
    }

    private fun closeAllApps() {
        (allApps?.parent as? ViewGroup)?.removeView(allApps)
        allApps = null
        if (!layout.sawFavoritesPrompt) {
            layout = layout.copy(sawFavoritesPrompt = true)
            LauncherLayoutStore.save(this, layout)
        }
    }

    private fun openEdit() {
        closeRecents()
        closeEdit()
        val overlay = EditHomeOverlay(this, layout) { next ->
            layout = next
            LauncherLayoutStore.save(this, layout)
            bindWidgets()
            bindFavorites()
            closeEdit()
        }
        overlay.setOnClose { closeEdit() }
        edit = overlay
        addContentView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        LauncherEdges.bind(overlay)
    }

    private fun closeEdit() {
        (edit?.parent as? ViewGroup)?.removeView(edit)
        edit = null
    }

    companion object {
        private const val RECENTS_ZONE_DP = 120
        private const val RECENTS_CLIMB_DP = 48
        private const val RECENTS_MIN_VELOCITY = 700f
    }
}
