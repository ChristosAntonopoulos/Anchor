package com.pos.mobile.launcher

import android.content.Context
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
                bottomMargin = LauncherPalette.dp(this@WidgetHost, 12)
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
    private val title = LauncherPalette.text(this, 12f, LauncherPalette.muted, true)
    private val body = LauncherPalette.text(this, 22f, LauncherPalette.text, true)
    private val rows = LinearLayout(context).apply { orientation = VERTICAL }
    private val status = LauncherPalette.text(this, 13f, LauncherPalette.muted)
    private val action = LauncherPalette.button(this, "Open") {}

    init {
        orientation = VERTICAL
        background = LauncherPalette.card()
        val pad = LauncherPalette.dp(this, 18)
        setPadding(pad, pad, pad, pad)
        title.letterSpacing = 0.08f
        addView(title)
        addView(body, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 8)
        })
        addView(rows, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 4)
        })
        addView(status, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 8)
        })
        addView(action, LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT).apply {
            topMargin = LauncherPalette.dp(this@WidgetCard, 14)
        })
        body.setLineSpacing(6f, 1.05f)
        isClickable = true
        isFocusable = true
    }

    fun render(provider: WidgetContentProvider, onAction: (WidgetAction) -> Unit) {
        val state = provider.current()
        title.text = provider.primaryLabel()?.uppercase()
        contentDescription = provider.primaryLabel()
        setOnLongClickListener {
            onAction(WidgetAction.Details(provider.instance.instanceId))
            true
        }
        provider.primaryAction()?.let { primary ->
            setOnClickListener { onAction(primary) }
        } ?: setOnClickListener(null)
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
                val line = listOfNotNull(provider.status(), age, if (state.refreshing) "Checking…" else null)
                    .joinToString(" · ")
                status.text = line
                status.visibility = if (line.isBlank()) View.GONE else View.VISIBLE
                val label = provider.actionLabel()
                val widgetAction = provider.primaryAction()
                if (label.isNullOrBlank() || widgetAction == null) {
                    action.visibility = View.GONE
                } else {
                    action.visibility = View.VISIBLE
                    action.text = label
                    action.contentDescription = label
                    action.setOnClickListener { onAction(widgetAction) }
                }
            }
        }
    }

    private fun bindRows(items: List<WidgetRow>, onAction: (WidgetAction) -> Unit) {
        rows.removeAllViews()
        items.forEachIndexed { index, item ->
            val row = LinearLayout(context).apply {
                orientation = VERTICAL
                isClickable = item.action != null
                isFocusable = item.action != null
                minimumHeight = LauncherPalette.dp(this@WidgetCard, 48)
                contentDescription = listOf(item.label, item.value, item.meta).filter { it.isNotBlank() }.joinToString(" ")
                item.action?.let { action -> setOnClickListener { onAction(action) } }
            }
            val label = LauncherPalette.text(this, 11f, LauncherPalette.muted, true)
            label.text = item.label.uppercase()
            label.letterSpacing = 0.08f
            val value = LauncherPalette.text(this, 18f, LauncherPalette.text, true)
            value.text = item.value
            row.addView(label)
            row.addView(value, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                topMargin = LauncherPalette.dp(this@WidgetCard, 4)
            })
            if (item.meta.isNotBlank()) {
                val meta = LauncherPalette.text(this, 13f, LauncherPalette.muted)
                meta.text = item.meta
                row.addView(meta, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                    topMargin = LauncherPalette.dp(this@WidgetCard, 2)
                })
            }
            rows.addView(row, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT).apply {
                if (index > 0) topMargin = LauncherPalette.dp(this@WidgetCard, 12)
            })
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
