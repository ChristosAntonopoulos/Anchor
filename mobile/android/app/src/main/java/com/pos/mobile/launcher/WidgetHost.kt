package com.pos.mobile.launcher

import android.content.Context
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import java.util.concurrent.TimeUnit

class WidgetHost(
    context: Context,
    private val dispatch: (WidgetAction) -> Unit,
) : LinearLayout(context) {
    private val providers = mutableMapOf<String, WidgetContentProvider>()
    private val subscriptions = mutableListOf<() -> Unit>()

    init {
        orientation = VERTICAL
    }

    fun bind(instances: List<WidgetInstance>) {
        subscriptions.forEach { it.invoke() }
        subscriptions.clear()
        providers.clear()
        removeAllViews()
        if (instances.isEmpty()) return
        instances.forEach { instance ->
            val provider = WidgetRegistry.create(context, instance) ?: MissingWidgetProvider(instance)
            providers[instance.instanceId] = provider
            val card = WidgetCard(context)
            addView(card, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                bottomMargin = LauncherPalette.dp(this@WidgetHost, 10)
            })
            val unsub = provider.observe {
                card.render(provider) { action ->
                    when (action) {
                        is WidgetAction.Refresh -> provider.refresh()
                        else -> dispatch(action)
                    }
                }
            }
            subscriptions.add(unsub)
        }
    }

    fun provider(id: String) = providers[id]

    fun destroy() {
        subscriptions.forEach { it.invoke() }
        subscriptions.clear()
        providers.clear()
    }
}

private class WidgetCard(context: Context) : LinearLayout(context) {
    private val header = LinearLayout(context).apply {
        orientation = HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
    }
    private val title = LauncherPalette.eyebrow(this, "")
    private val action = LauncherPalette.text(this, 13f, LauncherPalette.accent, true)
    private val body = LauncherPalette.text(this, 20f, LauncherPalette.text, true)
    private val status = LauncherPalette.text(this, 13f, LauncherPalette.muted)
    private val rows = LinearLayout(context).apply { orientation = HORIZONTAL }

    init {
        orientation = VERTICAL
        background = LauncherPalette.card()
        val pad = LauncherPalette.dp(this, 16)
        setPadding(pad, pad, pad, pad)
        header.addView(title, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        action.minHeight = LauncherPalette.dp(this, 44)
        action.gravity = Gravity.CENTER_VERTICAL or Gravity.END
        action.isClickable = true
        action.isFocusable = true
        header.addView(action, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT))
        addView(header)
        addView(body, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 8)
        })
        addView(rows, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 6)
        })
        addView(status, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 8)
        })
        body.setLineSpacing(4f, 1.04f)
        isClickable = true
        isFocusable = true
    }

    fun render(provider: WidgetContentProvider, onAction: (WidgetAction) -> Unit) {
        val state = provider.current()
        title.text = provider.primaryLabel()?.uppercase().orEmpty()
        contentDescription = provider.primaryLabel()
        setOnLongClickListener {
            onAction(WidgetAction.Details(provider.instance.instanceId))
            true
        }
        val primary = provider.primaryAction()
        if (primary != null) {
            setOnClickListener { onAction(primary) }
        } else {
            setOnClickListener(null)
        }
        when (state) {
            WidgetUiState.Loading -> {
                body.visibility = View.VISIBLE
                body.text = "Loading"
                rows.visibility = View.GONE
                status.visibility = View.GONE
                action.visibility = View.GONE
            }
            WidgetUiState.Empty -> {
                body.visibility = View.VISIBLE
                body.text = "Nothing here"
                rows.visibility = View.GONE
                status.visibility = View.GONE
                action.visibility = View.GONE
            }
            is WidgetUiState.Content<*> -> {
                val labeled = provider.rows()
                if (labeled.isNotEmpty()) {
                    body.visibility = View.GONE
                    rows.visibility = View.VISIBLE
                    bindRows(labeled, onAction)
                } else {
                    body.visibility = View.VISIBLE
                    body.text = provider.body()
                    rows.visibility = View.GONE
                }
                val age = if (state.hideTimestamp) null else freshness(state.sourceAtMs)
                val line = listOfNotNull(
                    provider.status()?.takeUnless { it.equals(provider.body(), ignoreCase = true) },
                    age,
                    if (state.refreshing) "Checking…" else null,
                ).joinToString(" · ")
                status.text = line
                status.visibility = if (line.isBlank()) View.GONE else View.VISIBLE
                val label = provider.actionLabel()
                if (label.isNullOrBlank() || primary == null) {
                    action.visibility = View.GONE
                } else {
                    action.visibility = View.VISIBLE
                    action.text = label
                    action.contentDescription = label
                    action.setOnClickListener { onAction(primary) }
                }
            }
        }
    }

    private fun bindRows(items: List<WidgetRow>, onAction: (WidgetAction) -> Unit) {
        rows.removeAllViews()
        items.forEachIndexed { index, item ->
            if (index > 0) {
                val rule = View(context).apply { setBackgroundColor(LauncherPalette.hairline) }
                rows.addView(rule, LayoutParams(LauncherPalette.dp(this, 1), LayoutParams.MATCH_PARENT).apply {
                    marginStart = LauncherPalette.dp(this@WidgetCard, 12)
                    marginEnd = LauncherPalette.dp(this@WidgetCard, 12)
                    topMargin = LauncherPalette.dp(this@WidgetCard, 4)
                    bottomMargin = LauncherPalette.dp(this@WidgetCard, 4)
                })
            }
            val cell = LinearLayout(context).apply {
                orientation = VERTICAL
                isClickable = item.action != null
                isFocusable = item.action != null
                minimumHeight = LauncherPalette.dp(this@WidgetCard, 56)
                contentDescription = listOf(item.label, item.value, item.meta).filter { it.isNotBlank() }.joinToString(" ")
                item.action?.let { next -> setOnClickListener { onAction(next) } }
            }
            cell.addView(LauncherPalette.eyebrow(this, item.label))
            cell.addView(LauncherPalette.text(this, 17f, LauncherPalette.text, true).apply {
                text = item.value
                maxLines = 2
            }, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = LauncherPalette.dp(this@WidgetCard, 6)
            })
            if (item.meta.isNotBlank()) {
                cell.addView(LauncherPalette.text(this, 12f, LauncherPalette.muted).apply { text = item.meta }, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                    topMargin = LauncherPalette.dp(this@WidgetCard, 3)
                })
            }
            rows.addView(cell, LayoutParams(0, LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun freshness(sourceAtMs: Long?): String? {
        if (sourceAtMs == null) return null
        val minutes = TimeUnit.MILLISECONDS.toMinutes(System.currentTimeMillis() - sourceAtMs).coerceAtLeast(0)
        return when {
            minutes < 1 -> "Just now"
            minutes == 1L -> "1 min ago"
            minutes < 60 -> "$minutes min ago"
            else -> "${minutes / 60}h ago"
        }
    }
}

class MissingWidgetProvider(
    override val instance: WidgetInstance,
) : WidgetContentProvider {
    override fun current() = WidgetUiState.Content(
        value = instance.typeId,
        sourceAtMs = null,
        refreshError = "This widget is no longer available.",
        hideTimestamp = true,
    )
    override fun observe(onChange: () -> Unit): () -> Unit {
        onChange()
        return {}
    }
    override fun refresh() {}
    override fun primaryLabel() = "Missing widget"
    override fun body() = "Remove it in Edit Home."
    override fun status() = instance.typeId
    override fun actionLabel() = null
    override fun primaryAction() = null
}
