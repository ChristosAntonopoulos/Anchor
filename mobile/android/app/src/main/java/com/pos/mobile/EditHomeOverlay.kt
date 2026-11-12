package com.pos.mobile

import android.content.Context
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.pos.mobile.launcher.LauncherLayout
import com.pos.mobile.launcher.LauncherPalette
import com.pos.mobile.launcher.WidgetInstance
import com.pos.mobile.launcher.WidgetPlacement
import com.pos.mobile.launcher.WidgetRegistry
import java.util.UUID

class EditHomeOverlay(
    context: Context,
    private var layout: LauncherLayout,
    private val onSave: (LauncherLayout) -> Unit,
) : LinearLayout(context) {
    private val homeList = LinearLayout(context).apply { orientation = VERTICAL }
    private val developerList = LinearLayout(context).apply { orientation = VERTICAL }
    private var close: (() -> Unit)? = null

    init {
        orientation = VERTICAL
        setBackgroundColor(LauncherPalette.charcoal)
        val pad = LauncherPalette.dp(this, 16)
        setPadding(pad, pad, pad, pad)
        addView(LauncherPalette.text(this, 20f, LauncherPalette.text, true).apply { text = "Edit Home" })
        addView(LauncherPalette.text(this, 14f, LauncherPalette.muted).apply {
            text = "Two Home widgets. Developer cards below. Favorites are chosen in All apps."
        })
        val scroll = ScrollView(context)
        val column = LinearLayout(context).apply { orientation = VERTICAL }
        column.addView(section("Home widgets", homeList, WidgetPlacement.HOME))
        column.addView(section("Developer", developerList, WidgetPlacement.DEVELOPER))
        scroll.addView(column)
        addView(scroll, LayoutParams(LayoutParams.MATCH_PARENT, 0, 1f))
        val row = LinearLayout(context).apply { orientation = HORIZONTAL }
        row.addView(LauncherPalette.button(this, "Cancel") { close?.invoke() })
        row.addView(LauncherPalette.button(this, "Save") { onSave(layout) }, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            marginStart = LauncherPalette.dp(this@EditHomeOverlay, 12)
        })
        addView(row, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@EditHomeOverlay, 12)
        })
        render()
    }

    fun setOnClose(block: () -> Unit) {
        close = block
    }

    private fun section(title: String, list: LinearLayout, placement: WidgetPlacement): LinearLayout {
        val wrap = LinearLayout(context).apply { orientation = VERTICAL }
        wrap.addView(LauncherPalette.text(this, 13f, LauncherPalette.muted, true).apply {
            text = title.uppercase()
            setPadding(0, LauncherPalette.dp(this@EditHomeOverlay, 16), 0, LauncherPalette.dp(this@EditHomeOverlay, 8))
        })
        wrap.addView(list)
        val addRow = LinearLayout(context).apply { orientation = HORIZONTAL }
        WidgetRegistry.picker(placement).forEach { definition ->
            addRow.addView(LauncherPalette.text(this, 14f, LauncherPalette.accent).apply {
                text = "+ ${definition.title}"
                minHeight = LauncherPalette.dp(this@EditHomeOverlay, 48)
                gravity = Gravity.CENTER_VERTICAL
                setPadding(0, 0, LauncherPalette.dp(this@EditHomeOverlay, 16), 0)
                isClickable = true
                isFocusable = true
                setOnClickListener { add(definition.typeId, placement) }
            })
        }
        wrap.addView(addRow)
        return wrap
    }

    private fun render() {
        fill(homeList, layout.homeWidgets(), WidgetPlacement.HOME, max = 2)
        fill(developerList, layout.developerWidgets(), WidgetPlacement.DEVELOPER, max = 6)
    }

    private fun fill(target: LinearLayout, items: List<WidgetInstance>, placement: WidgetPlacement, max: Int) {
        target.removeAllViews()
        items.forEachIndexed { index, item ->
            val row = LinearLayout(context).apply {
                orientation = HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                minimumHeight = LauncherPalette.dp(this@EditHomeOverlay, 48)
            }
            val missing = WidgetRegistry.get(item.typeId) == null
            val name = LauncherPalette.text(this, 16f, LauncherPalette.text)
            name.text = if (missing) "Missing · ${item.typeId}" else WidgetRegistry.titleFor(item.typeId)
            row.addView(name, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
            row.addView(small("Up") { move(placement, index, -1) })
            row.addView(small("Down") { move(placement, index, 1) })
            row.addView(small("Remove") { remove(item.instanceId) })
            target.addView(row)
        }
        if (items.size >= max) {
            // at cap
        }
    }

    private fun small(label: String, onClick: () -> Unit): TextView {
        return LauncherPalette.text(this, 13f, LauncherPalette.accent).apply {
            text = label
            minHeight = LauncherPalette.dp(this@EditHomeOverlay, 48)
            gravity = Gravity.CENTER
            setPadding(LauncherPalette.dp(this@EditHomeOverlay, 8), 0, LauncherPalette.dp(this@EditHomeOverlay, 8), 0)
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
        }
    }

    private fun add(typeId: String, placement: WidgetPlacement) {
        val current = if (placement == WidgetPlacement.HOME) layout.homeWidgets() else layout.developerWidgets()
        val cap = if (placement == WidgetPlacement.HOME) 2 else 6
        if (current.size >= cap) return
        val next = WidgetInstance(
            instanceId = UUID.randomUUID().toString(),
            typeId = typeId,
            placement = placement,
            order = current.size,
        )
        layout = layout.copy(widgets = layout.widgets + next)
        render()
    }

    private fun remove(instanceId: String) {
        layout = layout.copy(widgets = layout.widgets.filterNot { it.instanceId == instanceId }.reindexed())
        render()
    }

    private fun move(placement: WidgetPlacement, index: Int, delta: Int) {
        val slice = (if (placement == WidgetPlacement.HOME) layout.homeWidgets() else layout.developerWidgets()).toMutableList()
        val target = index + delta
        if (target !in slice.indices) return
        val item = slice.removeAt(index)
        slice.add(target, item)
        val others = layout.widgets.filterNot { it.placement == placement }
        layout = layout.copy(widgets = others + slice.mapIndexed { order, widget -> widget.copy(order = order) })
        render()
    }

    private fun List<WidgetInstance>.reindexed() = mapIndexed { index, item -> item.copy(order = index) }
}
