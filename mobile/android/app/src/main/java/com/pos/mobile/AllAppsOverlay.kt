package com.pos.mobile

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.Toast
import com.pos.mobile.launcher.InstalledApps
import com.pos.mobile.launcher.LaunchableApp
import com.pos.mobile.launcher.LauncherLayout
import com.pos.mobile.launcher.LauncherPalette

class AllAppsOverlay(
    context: Context,
    private var layout: LauncherLayout,
    private val pickingFavorites: Boolean,
    private val onLayout: (LauncherLayout) -> Unit,
) : LinearLayout(context) {
    private val list = LinearLayout(context).apply { orientation = VERTICAL }
    private val apps = InstalledApps.list(context)
    private var query = ""
    private var close: (() -> Unit)? = null

    init {
        orientation = VERTICAL
        setBackgroundColor(LauncherPalette.charcoal)
        val pad = LauncherPalette.dp(this, 20)
        setPadding(pad, pad, pad, pad)
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
        val title = LauncherPalette.text(this, 22f, LauncherPalette.text, true)
        title.text = if (pickingFavorites) "Favorites" else "All apps"
        val caption = LauncherPalette.text(this, 13f, LauncherPalette.muted)
        caption.text = if (pickingFavorites) "Pin up to five. Star to keep them on Home." else "Search on device. Star to pin."
        val search = EditText(context).apply {
            setHint("Search")
            setHintTextColor(LauncherPalette.faint)
            setTextColor(LauncherPalette.text)
            background = LauncherPalette.searchField()
            minHeight = LauncherPalette.dp(this@AllAppsOverlay, 48)
            setPadding(pad, LauncherPalette.dp(this@AllAppsOverlay, 12), pad, LauncherPalette.dp(this@AllAppsOverlay, 12))
            isSingleLine = true
            addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    query = s?.toString().orEmpty()
                    render()
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
        addView(title)
        addView(caption, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@AllAppsOverlay, 4)
            bottomMargin = LauncherPalette.dp(this@AllAppsOverlay, 14)
        })
        addView(search, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            bottomMargin = LauncherPalette.dp(this@AllAppsOverlay, 8)
        })
        addView(ScrollView(context).apply {
            overScrollMode = OVER_SCROLL_NEVER
            addView(list)
        }, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        addView(LauncherPalette.button(this, "Done") { close?.invoke() }, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@AllAppsOverlay, 12)
        })
        render()
    }

    fun setOnClose(block: () -> Unit) {
        close = block
    }

    private fun render() {
        list.removeAllViews()
        val results = InstalledApps.search(apps, query)
        results.forEach { app ->
            list.addView(row(app))
        }
        if (results.isEmpty()) {
            val empty = LauncherPalette.text(this, 14f, LauncherPalette.muted)
            empty.text = "No matching apps"
            empty.setPadding(0, LauncherPalette.dp(this, 16), 0, 0)
            list.addView(empty)
        }
    }

    private fun row(app: LaunchableApp): View {
        val favored = layout.favorites.any {
            it.packageName == app.packageName && it.className == app.className && it.userSerial == app.userSerial
        }
        val row = LinearLayout(context).apply {
            orientation = HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            minimumHeight = LauncherPalette.dp(this@AllAppsOverlay, 56)
        }
        val icon = InstalledApps.icon(context, app)
        if (icon != null) {
            row.addView(LauncherPalette.appIcon(this, icon, 36), LayoutParams(LauncherPalette.dp(this, 36), LauncherPalette.dp(this, 36)).apply {
                marginEnd = LauncherPalette.dp(this@AllAppsOverlay, 12)
            })
        } else {
            row.addView(LauncherPalette.glyph(this, app.label, 36), LayoutParams(LauncherPalette.dp(this, 36), LauncherPalette.dp(this, 36)).apply {
                marginEnd = LauncherPalette.dp(this@AllAppsOverlay, 12)
            })
        }
        val name = LauncherPalette.text(this, 15f, LauncherPalette.text).apply {
            text = app.label
            isClickable = true
            isFocusable = true
            minHeight = LauncherPalette.dp(this@AllAppsOverlay, 48)
            gravity = Gravity.CENTER_VERTICAL
            setOnClickListener {
                if (!InstalledApps.launch(context, app)) {
                    Toast.makeText(context, "Couldn’t open ${app.label}", Toast.LENGTH_SHORT).show()
                } else if (!pickingFavorites) {
                    close?.invoke()
                }
            }
        }
        val star = LauncherPalette.text(this, 18f, if (favored) LauncherPalette.accent else LauncherPalette.faint).apply {
            text = if (favored) "★" else "☆"
            minHeight = LauncherPalette.dp(this@AllAppsOverlay, 48)
            minWidth = LauncherPalette.dp(this@AllAppsOverlay, 48)
            gravity = Gravity.CENTER
            contentDescription = if (favored) "Unpin ${app.label}" else "Pin ${app.label}"
            isClickable = true
            isFocusable = true
            setOnClickListener { toggle(app) }
        }
        row.addView(name, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        row.addView(star)
        return row
    }

    private fun toggle(app: LaunchableApp) {
        val current = layout.favorites.toMutableList()
        val existing = current.indexOfFirst {
            it.packageName == app.packageName && it.className == app.className && it.userSerial == app.userSerial
        }
        if (existing >= 0) {
            current.removeAt(existing)
        } else {
            if (current.size >= 5) {
                Toast.makeText(context, "Five favorites at most", Toast.LENGTH_SHORT).show()
                return
            }
            current.add(app.asFavorite())
        }
        layout = layout.copy(favorites = current, sawFavoritesPrompt = true)
        onLayout(layout)
        render()
    }
}
