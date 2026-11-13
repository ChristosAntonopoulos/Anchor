package com.pos.mobile.launcher

import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import com.pos.mobile.ControlPanelClient

/**
 * Developer home Cluster card — polls control-panel GET /api/widget every 30s.
 */
class K8sStatusProvider(
    private val appContext: Context,
    instance: WidgetInstance,
) : BaseProvider(instance) {
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var state: WidgetUiState<K8sWidgetSnapshot> = WidgetUiState.Loading
    @Volatile private var inFlight = false
    @Volatile private var lastGood: K8sWidgetSnapshot? = null
    private val poll = object : Runnable {
        override fun run() {
            refresh()
            main.postDelayed(this, POLL_MS)
        }
    }

    init {
        refresh()
        main.postDelayed(poll, POLL_MS)
    }

    override fun current(): WidgetUiState<*> = state

    override fun doRefresh() {
        if (inFlight) return
        inFlight = true
        val previous = (state as? WidgetUiState.Content)?.value ?: lastGood
        if (previous != null) {
            state = WidgetUiState.Content(
                value = previous,
                sourceAtMs = previous.generatedAtMs,
                refreshing = true,
                refreshError = null,
                sample = false,
            )
            notifyChanged()
        } else {
            state = WidgetUiState.Loading
            notifyChanged()
        }

        val namespace = instance.settings.optString("namespace").ifBlank { null }
        val limit = instance.settings.optInt("limit", 5)
        val includeSystem = instance.settings.optBoolean("includeSystem", false)

        ControlPanelClient.enqueue {
            val fetch = ControlPanelClient.fetchWidget(
                context = appContext,
                namespace = namespace,
                limit = limit,
                includeSystem = includeSystem,
            )
            main.post {
                inFlight = false
                when (fetch) {
                    is ControlPanelClient.WidgetFetch.Ok -> {
                        val snap = K8sWidgetSnapshot.fromJson(fetch.json)
                        lastGood = snap
                        state = WidgetUiState.Content(
                            value = snap,
                            sourceAtMs = snap.generatedAtMs,
                            refreshing = false,
                            refreshError = null,
                            sample = false,
                        )
                    }
                    ControlPanelClient.WidgetFetch.NotDeployed -> {
                        val snap = K8sWidgetSnapshot.notDeployed()
                        // Don't clobber a prior good live snapshot with not-deployed
                        // if we somehow lose the route temporarily — but first paint should show it.
                        if (lastGood == null || lastGood?.notDeployed == true) {
                            lastGood = snap
                            state = WidgetUiState.Content(
                                value = snap,
                                sourceAtMs = snap.generatedAtMs,
                                refreshing = false,
                                refreshError = null,
                                sample = false,
                            )
                        } else {
                            state = WidgetUiState.Content(
                                value = lastGood!!,
                                sourceAtMs = lastGood!!.generatedAtMs,
                                refreshing = false,
                                refreshError = "Control panel widget route missing (404/HTML).",
                                sample = false,
                            )
                        }
                    }
                    is ControlPanelClient.WidgetFetch.Failed -> {
                        val keep = lastGood ?: previous
                        if (keep != null) {
                            state = WidgetUiState.Content(
                                value = keep,
                                sourceAtMs = keep.generatedAtMs,
                                refreshing = false,
                                refreshError = fetch.message,
                                sample = false,
                            )
                        } else {
                            state = WidgetUiState.Content(
                                value = K8sWidgetSnapshot.notDeployed().copy(
                                    headline = "Couldn't reach control panel",
                                    notes = listOf(fetch.message),
                                    notDeployed = false,
                                ),
                                sourceAtMs = System.currentTimeMillis(),
                                refreshing = false,
                                refreshError = fetch.message,
                                sample = false,
                            )
                        }
                    }
                }
                notifyChanged()
            }
        }
    }

    override fun primaryLabel() = "Cluster"
    override fun body(): String {
        val snap = (state as? WidgetUiState.Content)?.value ?: return "Loading cluster…"
        return listOf(snap.headline, snap.countsLine())
            .filter { it.isNotBlank() }
            .joinToString("\n")
    }

    override fun status(): String? {
        val content = state as? WidgetUiState.Content ?: return null
        val snap = content.value
        val status = statusLabel(snap.status)
        val live = when {
            snap.notDeployed -> "Not deployed"
            content.refreshError != null -> null
            else -> "Live"
        }
        val partial = if (snap.partial) "Partial" else null
        val note = snap.notes.firstOrNull()
        return listOfNotNull(status, partial, live, content.refreshError, note)
            .distinct()
            .joinToString(" · ")
            .ifBlank { null }
    }

    override fun actionLabel() = "Refresh"
    override fun primaryAction() = WidgetAction.Refresh(instance.instanceId)

    override fun accentColor(): Int? {
        val status = (state as? WidgetUiState.Content)?.value?.status ?: return null
        return statusColor(status)
    }

    override fun rows(): List<WidgetRow> {
        val snap = (state as? WidgetUiState.Content)?.value ?: return emptyList()
        val appRows = snap.apps.take(2).map { app ->
            val target = ControlPanelClient.absoluteUrl(appContext, app.url)
                ?: ControlPanelClient.absoluteUrl(appContext, app.panelPath)
            WidgetRow(
                label = app.name,
                value = app.status,
                meta = app.ready,
                action = target?.let { WidgetAction.OpenUrl(it) },
            )
        }
        val highlightRows = snap.highlights.take(2).map { highlight ->
            val panel = ControlPanelClient.absoluteUrl(appContext, highlight.url)
                ?: ControlPanelClient.absoluteUrl(appContext, highlight.panelPath)
            val logs = highlight.logsPath
            val action = when {
                !logs.isNullOrBlank() -> WidgetAction.FetchLogs(logs, highlight.name.ifBlank { "Logs" })
                panel != null -> WidgetAction.OpenUrl(panel)
                else -> null
            }
            val actionEyebrow = when {
                !logs.isNullOrBlank() -> "Logs"
                panel != null -> "Details"
                else -> highlight.severity.replaceFirstChar { it.uppercase() }
            }
            WidgetRow(
                label = actionEyebrow,
                value = highlight.name.ifBlank { highlight.kind },
                meta = highlight.detail.ifBlank { highlight.status },
                action = action,
            )
        }
        return (appRows + highlightRows).take(4)
    }

    fun stopPolling() {
        main.removeCallbacks(poll)
    }

    companion object {
        const val POLL_MS = 30_000L

        fun statusLabel(status: String): String = when (status.lowercase()) {
            "healthy" -> "Healthy"
            "attention" -> "Attention"
            "critical" -> "Critical"
            else -> "Unknown"
        }

        fun statusColor(status: String): Int = when (status.lowercase()) {
            "healthy" -> Color.parseColor("#A4CDBB")
            "attention" -> Color.parseColor("#E0C27A")
            "critical" -> Color.parseColor("#E08A8A")
            else -> Color.parseColor("#9AAEA2")
        }
    }
}
