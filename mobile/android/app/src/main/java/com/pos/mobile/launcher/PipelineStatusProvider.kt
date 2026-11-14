package com.pos.mobile.launcher

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.pos.mobile.OsWidgetStore
import com.pos.mobile.OsWidgetUpdater
import com.pos.mobile.PosApiClient
import org.json.JSONArray
import org.json.JSONObject

data class PipelineRunRow(
    val name: String,
    val statusKey: String,
    val meta: String,
    val webUrl: String?,
    val title: String,
)

data class PipelineCardContent(
    val headline: String,
    val detail: String,
    val statusKey: String,
    val occurredAtMs: Long?,
    val webUrl: String?,
    val available: Boolean,
    val meta: String = "",
    val active: List<PipelineRunRow> = emptyList(),
)

/**
 * Live org-wide Azure DevOps pipelines for the Developer home card.
 * Shows every active (running/queued) run when more than one is in flight.
 */
class PipelineStatusProvider(
    private val appContext: Context,
    instance: WidgetInstance,
) : BaseProvider(instance) {
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var state: WidgetUiState<PipelineCardContent> = WidgetUiState.Loading
    @Volatile private var inFlight = false

    init {
        publishCachedOrLoading()
        refresh()
    }

    override fun current(): WidgetUiState<*> = state

    override fun doRefresh() {
        if (inFlight) return
        inFlight = true
        val previous = (state as? WidgetUiState.Content)?.value
        if (previous != null) {
            state = WidgetUiState.Content(
                value = previous,
                sourceAtMs = previous.occurredAtMs,
                refreshing = true,
                refreshError = null,
                sample = false,
            )
            notifyChanged()
        } else {
            state = WidgetUiState.Loading
            notifyChanged()
        }

        PosApiClient.enqueue {
            val result = runCatching { fetchLatest() }
            main.post {
                inFlight = false
                result.fold(
                    onSuccess = { content ->
                        state = WidgetUiState.Content(
                            value = content,
                            sourceAtMs = content.occurredAtMs ?: System.currentTimeMillis(),
                            refreshing = false,
                            refreshError = null,
                            sample = false,
                        )
                        mirrorToOsWidget(content)
                        notifyChanged()
                    },
                    onFailure = { error ->
                        val fallback = previous ?: cachedFromOsWidget()
                        if (fallback != null) {
                            state = WidgetUiState.Content(
                                value = fallback,
                                sourceAtMs = fallback.occurredAtMs,
                                refreshing = false,
                                refreshError = "Couldn't refresh pipeline.",
                                sample = false,
                            )
                        } else {
                            state = WidgetUiState.Content(
                                value = PipelineCardContent(
                                    headline = "Unavailable",
                                    detail = error.message?.takeIf { it.isNotBlank() }
                                        ?: "Couldn't load pipeline status.",
                                    statusKey = "unknown",
                                    occurredAtMs = null,
                                    webUrl = null,
                                    available = false,
                                ),
                                sourceAtMs = System.currentTimeMillis(),
                                refreshing = false,
                                refreshError = "Couldn't refresh pipeline.",
                                sample = false,
                            )
                        }
                        notifyChanged()
                    },
                )
            }
        }
    }

    private fun publishCachedOrLoading() {
        val cached = cachedFromOsWidget()
        state = if (cached != null) {
            WidgetUiState.Content(
                value = cached,
                sourceAtMs = cached.occurredAtMs,
                refreshing = true,
                sample = false,
            )
        } else {
            WidgetUiState.Loading
        }
        notifyChanged()
    }

    private fun fetchLatest(): PipelineCardContent {
        val envelope = PosApiClient.getJson(appContext, "pipelines/latest")
        val data = envelope.optJSONObject("data") ?: throw IllegalStateException("Missing pipeline payload")
        return fromApiJson(data)
    }

    private fun cachedFromOsWidget(): PipelineCardContent? {
        val snap = OsWidgetStore.read(appContext)
        if (snap.pipelineTitle.isBlank() || snap.pipelineTitle == "No pipeline yet") return null
        if (snap.pipelineStatus.isBlank() || snap.pipelineStatus == "unknown") return null
        return PipelineCardContent(
            headline = statusLabel(snap.pipelineStatus),
            detail = snap.pipelineTitle,
            statusKey = snap.pipelineStatus,
            occurredAtMs = null,
            webUrl = null,
            available = true,
            meta = snap.pipelineMeta,
        )
    }

    private fun mirrorToOsWidget(content: PipelineCardContent) {
        val current = OsWidgetStore.read(appContext)
        val title = when {
            content.active.size > 1 -> content.headline
            else -> content.detail.ifBlank { content.headline }
        }
        OsWidgetStore.write(
            appContext,
            current.copy(
                pipelineTitle = title,
                pipelineMeta = content.meta.ifBlank { content.headline },
                pipelineStatus = content.statusKey,
            ),
        )
        runCatching { OsWidgetUpdater.refreshAll(appContext) }
    }

    override fun primaryLabel() = "Pipeline"
    override fun body(): String {
        val content = (state as? WidgetUiState.Content)?.value ?: return "Loading pipeline…"
        return if (content.active.size > 1) {
            content.headline
        } else {
            content.detail.ifBlank { content.headline }
        }
    }

    override fun status(): String? {
        val content = state as? WidgetUiState.Content ?: return null
        val value = content.value
        val live = if (value.available) "Live" else null
        val error = content.refreshError
        return if (value.active.size > 1) {
            listOfNotNull(live, error).joinToString(" · ").ifBlank { null }
        } else {
            listOfNotNull(
                value.headline.takeIf { value.active.size <= 1 },
                value.meta.takeIf { it.isNotBlank() && it != "Live" },
                live,
                error,
            ).joinToString(" · ").ifBlank { null }
        }
    }

    override fun actionLabel() = "Refresh"
    override fun primaryAction() = WidgetAction.Refresh(instance.instanceId)

    override fun tapAction(): WidgetAction {
        val content = (state as? WidgetUiState.Content)?.value
        val webUrl = content?.webUrl?.takeIf { it.isNotBlank() }
        // Multiple active → org builds list; single/latest → specific run when known.
        return WidgetAction.OpenUrl(webUrl ?: DEFAULT_PIPELINES_URL)
    }

    override fun rows(): List<WidgetRow> {
        val content = (state as? WidgetUiState.Content)?.value ?: return emptyList()
        if (content.active.size <= 1) return emptyList()
        return content.active.take(4).map { row ->
            WidgetRow(
                label = statusLabel(row.statusKey),
                value = row.name,
                meta = row.meta,
                action = row.webUrl?.let { WidgetAction.OpenUrl(it) },
            )
        }
    }

    companion object {
        /** Org-wide builds list when the latest run has no webUrl yet. */
        const val DEFAULT_PIPELINES_URL = "https://dev.azure.com/CaptainBot/_build"

        fun statusLabel(status: String): String = when (status.lowercase()) {
            "running" -> "Running"
            "succeeded" -> "Succeeded"
            "failed" -> "Failed"
            "partial" -> "Partial"
            "canceled" -> "Canceled"
            "queued" -> "Queued"
            else -> "Pipeline"
        }

        fun fromApiJson(data: JSONObject): PipelineCardContent {
            val available = data.optBoolean("available", false)
            val active = parseActive(data.optJSONArray("active"))
            val statusKey = when {
                active.size > 1 -> "running"
                active.size == 1 -> active.first().statusKey
                else -> data.optString("status").ifBlank { "unknown" }
            }
            val headline = when {
                active.size > 1 -> {
                    val running = active.count { it.statusKey == "running" }
                    val queued = active.count { it.statusKey == "queued" }
                    when {
                        running > 0 && queued > 0 -> "$running running · $queued queued"
                        running > 0 -> if (running == 1) "1 running" else "$running running"
                        queued > 0 -> if (queued == 1) "1 queued" else "$queued queued"
                        else -> "${active.size} active"
                    }
                }
                active.size == 1 -> statusLabel(active.first().statusKey)
                else -> statusLabel(statusKey)
            }
            val name = data.optString("name").ifBlank { null }
            val title = data.optString("title").ifBlank { null }
            val subtitle = data.optString("subtitle").ifBlank { null }
            val message = data.optString("message").ifBlank { null }
            val detail = when {
                active.size > 1 -> active.joinToString("\n") { row ->
                    row.title.ifBlank { "${statusLabel(row.statusKey)} · ${row.name}" }
                }
                active.size == 1 -> active.first().title.ifBlank {
                    "${statusLabel(active.first().statusKey)} · ${active.first().name}"
                }
                available && !title.isNullOrBlank() -> title
                available && !name.isNullOrBlank() -> "$headline · $name"
                !message.isNullOrBlank() -> message
                else -> "No pipeline yet"
            }
            val meta = when {
                active.size > 1 -> "Live"
                active.size == 1 -> active.first().meta.ifBlank { subtitle.orEmpty() }
                !subtitle.isNullOrBlank() -> subtitle
                else -> listOfNotNull(
                    data.optString("project").ifBlank { null },
                    data.optString("branch").ifBlank { null },
                    data.optString("localTime").ifBlank { null },
                ).joinToString(" · ")
            }
            val webUrl = when {
                active.size == 1 -> active.first().webUrl
                active.size > 1 -> null
                else -> data.optString("webUrl").ifBlank { null }
            }
            return PipelineCardContent(
                headline = headline,
                detail = detail,
                statusKey = statusKey,
                occurredAtMs = PosApiClient.parseUtcMillis(data.optString("occurredAtUtc").ifBlank { null })
                    ?: System.currentTimeMillis().takeIf { active.isNotEmpty() },
                webUrl = webUrl,
                available = available || active.isNotEmpty(),
                meta = meta.orEmpty(),
                active = active,
            )
        }

        private fun parseActive(array: JSONArray?): List<PipelineRunRow> {
            if (array == null || array.length() == 0) return emptyList()
            return (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                val statusKey = item.optString("status").ifBlank { "unknown" }
                if (statusKey != "running" && statusKey != "queued") return@mapNotNull null
                val name = item.optString("name").ifBlank { "Pipeline" }
                val title = item.optString("title").ifBlank { "${statusLabel(statusKey)} · $name" }
                val meta = item.optString("subtitle").ifBlank {
                    listOfNotNull(
                        item.optString("project").ifBlank { null },
                        item.optString("branch").ifBlank { null },
                        item.optString("localTime").ifBlank { null },
                    ).joinToString(" · ")
                }
                PipelineRunRow(
                    name = name,
                    statusKey = statusKey,
                    meta = meta,
                    webUrl = item.optString("webUrl").ifBlank { null },
                    title = title,
                )
            }
        }
    }
}
