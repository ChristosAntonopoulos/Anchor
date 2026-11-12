package com.pos.mobile

import android.os.Bundle
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
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.pos.mobile.launcher.InstalledApps
import com.pos.mobile.launcher.LauncherIntents
import com.pos.mobile.launcher.LauncherLayout
import com.pos.mobile.launcher.LauncherLayoutStore
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.WidgetAction
import com.pos.mobile.launcher.WidgetHost
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
    private var allApps: AllAppsOverlay? = null
    private var edit: EditHomeOverlay? = null
    private var layout: LauncherLayout = LauncherLayoutStore.defaultLayout()
    private var showingDeveloper = false
    private val preview: Boolean
        get() = intent?.getBooleanExtra(LauncherIntents.EXTRA_PREVIEW, false) == true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)
        window.statusBarColor = LauncherPalette.charcoal
        window.navigationBarColor = LauncherPalette.charcoal
        layout = LauncherLayoutStore.load(this)
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(LauncherPalette.charcoal)
        }
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars: Insets = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        buildChrome()
        showHome()
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    edit != null -> closeEdit()
                    allApps != null -> closeAllApps()
                    showingDeveloper -> showHome()
                    preview -> finish()
                    else -> moveTaskToBack(true)
                }
            }
        })
        if (!layout.sawFavoritesPrompt) {
            openAllApps(pickingFavorites = true)
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        closeAllApps()
        closeEdit()
        showHome()
    }

    override fun onResume() {
        super.onResume()
        refreshVisible()
    }

    private fun buildChrome() {
        val pad = LauncherPalette.dp(root, 20)
        val clock = TextClock(this).apply {
            format12Hour = "h:mm"
            format24Hour = "HH:mm"
            setTextColor(LauncherPalette.text)
            textSize = 64f
            letterSpacing = -0.03f
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "Clock"
        }
        val date = TextView(this).apply {
            setTextColor(LauncherPalette.muted)
            textSize = 16f
            text = SimpleDateFormat("EEEE d MMMM", Locale.getDefault()).format(Date())
        }
        homeWidgets = WidgetHost(this, ::dispatch)
        developerWidgets = WidgetHost(this, ::dispatch)
        favoritesColumn = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        homeColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(homeWidgets)
            addView(favoritesColumn, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
                topMargin = LauncherPalette.dp(root, 8)
            })
        }
        developerColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(developerWidgets)
            visibility = View.GONE
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
            addView(pages)
            setOnTouchListener { view, event ->
                detector.onTouchEvent(event)
                view.onTouchEvent(event)
            }
        }
        val dock = dock()
        val footer = footer()
        root.setPadding(pad, pad, pad, LauncherPalette.dp(root, 8))
        root.addView(clock)
        root.addView(date, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = LauncherPalette.dp(root, 20)
        })
        root.addView(scroll, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        root.addView(dock)
        root.addView(footer)
        bindWidgets()
        bindFavorites()
    }

    private fun dock(): LinearLayout {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        val actions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        val gap = LauncherPalette.dp(root, 10)
        val wallet = LauncherPalette.button(root, "Wallet") {
            if (!InstalledApps.openWallet(this)) Toast.makeText(this, "Wallet isn’t installed", Toast.LENGTH_SHORT).show()
        }
        wallet.contentDescription = "Open Wallet"
        val chatgpt = LauncherPalette.button(root, "ChatGPT") {
            openKnown(InstalledApps.CHATGPT, "ChatGPT")
        }
        chatgpt.contentDescription = "Open ChatGPT"
        actions.addView(wallet, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
            marginEnd = gap
        })
        actions.addView(chatgpt, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
            marginStart = gap
        })
        val secondary = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        fun quiet(label: String, desc: String, onClick: () -> Unit): TextView {
            return LauncherPalette.button(root, label, filled = false, onClick = onClick).apply {
                contentDescription = desc
            }
        }
        secondary.addView(quiet("Capture", "Open capture") { LauncherIntents.openCapture(this) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
            marginEnd = gap
        })
        secondary.addView(quiet("All apps", "All apps") { openAllApps(false) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
            marginStart = gap
        })
        wrap.addView(actions)
        wrap.addView(secondary, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 10)
        })
        return wrap
    }

    private fun footer(): LinearLayout {
        val row = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        fun link(label: String, onClick: () -> Unit): TextView {
            return LauncherPalette.text(root, 13f, LauncherPalette.muted).apply {
                text = label
                minHeight = LauncherPalette.dp(root, 48)
                gravity = Gravity.CENTER
                setPadding(LauncherPalette.dp(root, 10), 0, LauncherPalette.dp(root, 10), 0)
                isClickable = true
                isFocusable = true
                setOnClickListener { onClick() }
            }
        }
        pageLabel = link("Developer") { showDeveloper() }
        row.addView(pageLabel, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(link("Edit Home") { openEdit() }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        row.addView(link("Switch home screen") { LauncherIntents.openHomeSettings(this) }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        return row
    }

    private fun bindWidgets() {
        homeWidgets.bind(layout.homeWidgets())
        developerWidgets.bind(layout.developerWidgets())
    }

    private fun bindFavorites() {
        favoritesColumn.removeAllViews()
        val heading = LauncherPalette.text(root, 12f, LauncherPalette.muted, true)
        heading.text = "FAVORITES"
        heading.letterSpacing = 0.08f
        favoritesColumn.addView(heading, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(root, 8)
            bottomMargin = LauncherPalette.dp(root, 4)
        })
        val favorites = layout.favorites.mapNotNull { favorite ->
            InstalledApps.resolve(this, favorite)
        }.take(5)
        if (favorites.isEmpty()) {
            val empty = LauncherPalette.text(root, 14f, LauncherPalette.muted)
            empty.text = "Choose up to five favorites."
            empty.minHeight = LauncherPalette.dp(root, 48)
            empty.gravity = Gravity.CENTER_VERTICAL
            empty.setOnClickListener { openAllApps(true) }
            favoritesColumn.addView(empty)
            return
        }
        favorites.forEach { app ->
            val row = LauncherPalette.text(root, 16f, LauncherPalette.text, true).apply {
                text = app.label
                minHeight = LauncherPalette.dp(root, 48)
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, LauncherPalette.dp(root, 8), 0, LauncherPalette.dp(root, 8))
                contentDescription = "Open ${app.label}"
                isClickable = true
                isFocusable = true
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
            favoritesColumn.addView(row)
        }
    }

    private fun dispatch(action: WidgetAction) {
        when (action) {
            is WidgetAction.OpenRoute -> LauncherIntents.openPersonalAi(this, action.url)
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

    private fun openKnown(packageName: String, name: String) {
        val app = InstalledApps.findPackage(this, packageName)
        if (app == null || !InstalledApps.launch(this, app)) {
            Toast.makeText(this, "$name isn’t installed", Toast.LENGTH_SHORT).show()
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
        layout.homeWidgets().forEach { homeWidgets.provider(it.instanceId)?.refresh() }
        layout.developerWidgets().forEach { developerWidgets.provider(it.instanceId)?.refresh() }
        bindFavorites()
    }

    private fun openAllApps(pickingFavorites: Boolean) {
        closeAllApps()
        val overlay = AllAppsOverlay(this, layout, pickingFavorites) { next ->
            layout = next
            LauncherLayoutStore.save(this, layout)
            bindFavorites()
            if (!pickingFavorites) closeAllApps()
        }
        overlay.setOnClose { closeAllApps() }
        allApps = overlay
        addContentView(overlay, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
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
    }

    private fun closeEdit() {
        (edit?.parent as? ViewGroup)?.removeView(edit)
        edit = null
    }
}
