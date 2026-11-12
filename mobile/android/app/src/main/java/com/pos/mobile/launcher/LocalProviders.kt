package com.pos.mobile.launcher

import android.content.Context
import android.os.Handler
import android.os.Looper

abstract class BaseProvider(
    override val instance: WidgetInstance,
) : WidgetContentProvider {
    private val listeners = mutableListOf<() -> Unit>()
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var refreshQueued = false

    protected fun notifyChanged() {
        main.post { listeners.toList().forEach { it.invoke() } }
    }

    override fun observe(onChange: () -> Unit): () -> Unit {
        listeners.add(onChange)
        onChange()
        return {
            listeners.remove(onChange)
        }
    }

    override fun refresh() {
        if (refreshQueued) return
        refreshQueued = true
        main.post {
            try {
                doRefresh()
            } finally {
                refreshQueued = false
            }
        }
    }

    protected abstract fun doRefresh()
}

class NextActionProvider(
    private val appContext: Context,
    instance: WidgetInstance,
) : BaseProvider(instance) {
    @Volatile private var state: WidgetUiState<NextActionContent> = WidgetUiState.Loading

    init {
        doRefresh()
    }

    override fun current(): WidgetUiState<*> = state

    override fun doRefresh() {
        val previous = (state as? WidgetUiState.Content)?.value
        state = WidgetUiState.Content(
            value = previous ?: NextActionResolver.resolve(appContext),
            sourceAtMs = null,
            refreshing = true,
            hideTimestamp = true,
        )
        notifyChanged()
        val next = NextActionResolver.resolve(appContext)
        state = WidgetUiState.Content(
            value = next,
            sourceAtMs = null,
            refreshing = false,
            sample = next.sample,
            hideTimestamp = true,
        )
        notifyChanged()
    }

    override fun primaryLabel() = "Next"
    override fun body() = (state as? WidgetUiState.Content)?.value?.title.orEmpty()
    override fun status(): String? {
        val content = state as? WidgetUiState.Content ?: return null
        val detail = content.value.detail
        val sample = if (content.sample) "Sample until Today loads" else null
        return listOfNotNull(detail.takeIf { it.isNotBlank() }, sample).joinToString(" · ").ifBlank { null }
    }
    override fun actionLabel() = (state as? WidgetUiState.Content)?.value?.button
    override fun primaryAction(): WidgetAction? {
        val route = (state as? WidgetUiState.Content)?.value?.route ?: return null
        return WidgetAction.OpenRoute(route)
    }
}

class TodayGlanceProvider(
    private val appContext: Context,
    instance: WidgetInstance,
) : BaseProvider(instance) {
    @Volatile private var state: WidgetUiState<TodayGlanceContent> = WidgetUiState.Loading

    init {
        doRefresh()
    }

    override fun current(): WidgetUiState<*> = state

    override fun doRefresh() {
        val glance = TodayGlanceResolver.resolve(appContext)
        state = WidgetUiState.Content(
            value = glance,
            sourceAtMs = System.currentTimeMillis(),
            sample = glance.sample,
            hideTimestamp = true,
        )
        notifyChanged()
    }

    override fun primaryLabel() = "Today"
    override fun body(): String {
        val value = (state as? WidgetUiState.Content)?.value ?: return "Open Personal AI to load today."
        val block = if (value.blockMeta.isBlank()) value.blockTitle else "${value.blockTitle} · ${value.blockMeta}"
        val meal = if (value.mealMeta.isBlank()) value.mealTitle else "${value.mealTitle} · ${value.mealMeta}"
        return "$block\n$meal"
    }
    override fun status() = if ((state as? WidgetUiState.Content)?.sample == true) "Sample until Today loads" else null
    override fun actionLabel() = "Open Today"
    override fun primaryAction() = WidgetAction.OpenRoute("pos://os/now")
    override fun rows(): List<WidgetRow> {
        val value = (state as? WidgetUiState.Content)?.value ?: return emptyList()
        return listOf(
            WidgetRow("Block", value.blockTitle, value.blockMeta, WidgetAction.OpenRoute("pos://os/block")),
            WidgetRow("Meal", value.mealTitle, value.mealMeta, WidgetAction.OpenRoute("pos://os/meals")),
        )
    }
}

data class StatusCardContent(
    val headline: String,
    val detail: String,
    val kind: String,
    val lastOkMs: Long?,
)

class SampleStatusProvider(
    instance: WidgetInstance,
    private val states: List<StatusCardContent>,
    private val unavailableKind: String,
) : BaseProvider(instance) {
    @Volatile private var index = instance.settings.optInt("sampleIndex", 0)
    @Volatile private var state: WidgetUiState<StatusCardContent> = WidgetUiState.Loading
    @Volatile private var failNext = instance.settings.optBoolean("forceRefreshFail", false)

    init {
        publish(states[index.mod(states.size)], refreshing = false, error = null)
    }

    override fun current(): WidgetUiState<*> = state

    override fun doRefresh() {
        val previous = (state as? WidgetUiState.Content)?.value
        publish(previous ?: states[0], refreshing = true, error = null)
        if (failNext || index.mod(states.size) == states.lastIndex) {
            failNext = false
            publish(
                previous ?: states[0],
                refreshing = false,
                error = "Couldn't check ${if (unavailableKind == "server") "server" else "exchange"}.",
            )
            return
        }
        index = (index + 1) % (states.size - 1).coerceAtLeast(1)
        try {
            instance.settings.put("sampleIndex", index)
        } catch (_: Exception) {
        }
        publish(states[index], refreshing = false, error = null)
    }

    private fun publish(value: StatusCardContent, refreshing: Boolean, error: String?) {
        state = WidgetUiState.Content(
            value = value,
            sourceAtMs = value.lastOkMs,
            refreshing = refreshing,
            refreshError = error,
            sample = true,
        )
        notifyChanged()
    }

    override fun primaryLabel() = WidgetRegistry.titleFor(instance.typeId)
    override fun body() = (state as? WidgetUiState.Content)?.value?.detail.orEmpty()
    override fun status(): String? {
        val content = state as? WidgetUiState.Content ?: return null
        val headline = content.value.headline
        val error = content.refreshError
        val sample = "Sample data"
        return listOfNotNull(headline, error, sample).joinToString(" · ")
    }
    override fun actionLabel() = "Refresh"
    override fun primaryAction() = WidgetAction.Refresh(instance.instanceId)
}

object SampleCatalog {
    fun server(): List<StatusCardContent> {
        val now = System.currentTimeMillis()
        return listOf(
            StatusCardContent("Healthy", "Personal AI API is answering.", "healthy", now),
            StatusCardContent("Degraded", "Personal AI API restarting.", "degraded", now - 90_000),
            StatusCardContent("Stale", "Last successful check 18 min ago.", "stale", now - 18 * 60_000),
            StatusCardContent("Unavailable", "Server reported unavailable.", "down", now - 4 * 60_000),
            StatusCardContent("Healthy", "Personal AI API is answering.", "healthy", now),
        )
    }

    fun trading(): List<StatusCardContent> {
        val now = System.currentTimeMillis()
        return listOf(
            StatusCardContent("Running", "Heartbeat 12s ago. Exchange sync ok.", "healthy", now - 12_000),
            StatusCardContent("Running", "Exchange sync delayed.", "degraded", now - 40_000),
            StatusCardContent("Stale", "Last heartbeat 11 min ago.", "stale", now - 11 * 60_000),
            StatusCardContent("Stopped", "Bot reported unavailable.", "down", now - 6 * 60_000),
            StatusCardContent("Running", "Heartbeat 12s ago. Exchange sync ok.", "healthy", now - 12_000),
        )
    }
}

