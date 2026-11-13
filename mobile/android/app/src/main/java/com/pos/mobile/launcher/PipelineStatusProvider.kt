package com.pos.mobile.launcher

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.pos.mobile.OsWidgetSnapshot
import com.pos.mobile.OsWidgetStore
import com.pos.mobile.OsWidgetUpdater
import com.pos.mobile.PosApiClient
import org.json.JSONObject

data class PipelineCardContent(
    val headline: String,
    val detail: String,
    val statusKey: String,
    val occurredAtMs: Long?,
    val webUrl: String?,
    val available: Boolean,
    val meta: String = "",
)

/**
 * Live org-wide latest Azure DevOps pipeline for the Developer home card.
 * Never marks real API payloads as sample data.
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
        return mapPayload(data)
    }

    private fun mapPayload(data: JSONObject): PipelineCardContent {
        val available = data.optBoolean("available", false)
        val statusKey = data.optString("status").ifBlank { "unknown" }
        val headline = statusLabel(statusKey)
        val name = data.optString("name").ifBlank { null }
        val title = data.optString("title").ifBlank { null }
        val subtitle = data.optString("subtitle").ifBlank { null }
        val message = data.optString("message").ifBlank { null }
        val detail = when {
            available && !title.isNullOrBlank() -> title
            available && !name.isNullOrBlank() -> "$headline · $name"
            !message.isNullOrBlank() -> message
            else -> "No pipeline yet"
        }
        val meta = when {
            !subtitle.isNullOrBlank() -> subtitle
            else -> listOfNotNull(
                data.optString("project").ifBlank { null },
                data.optString("branch").ifBlank { null },
                data.optString("localTime").ifBlank { null },
            ).joinToString(" · ")
        }
        return PipelineCardContent(
            headline = headline,
            detail = detail,
            statusKey = statusKey,
            occurredAtMs = PosApiClient.parseUtcMillis(data.optString("occurredAtUtc").ifBlank { null }),
            webUrl = data.optString("webUrl").ifBlank { null },
            available = available,
            meta = meta,
        )
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
        OsWidgetStore.write(
            appContext,
            current.copy(
                pipelineTitle = content.detail.ifBlank { content.headline },
                pipelineMeta = content.meta.ifBlank { content.headline },
                pipelineStatus = content.statusKey,
            ),
        )
        runCatching { OsWidgetUpdater.refreshAll(appContext) }
    }

    override fun primaryLabel() = "Pipeline"
    override fun body(): String {
        val content = (state as? WidgetUiState.Content)?.value ?: return "Loading pipeline…"
        return content.detail.ifBlank { content.headline }
    }

    override fun status(): String? {
        val content = state as? WidgetUiState.Content ?: return null
        val value = content.value
        val live = if (value.available) "Live" else null
        val error = content.refreshError
        return listOfNotNull(
            value.headline,
            value.meta.takeIf { it.isNotBlank() },
            live,
            error,
        ).joinToString(" · ").ifBlank { null }
    }

    override fun actionLabel() = "Refresh"
    override fun primaryAction() = WidgetAction.Refresh(instance.instanceId)

    companion object {
        fun statusLabel(status: String): String = when (status.lowercase()) {
            "running" -> "Running"
            "succeeded" -> "Succeeded"
            "failed" -> "Failed"
            "partial" -> "Partial"
            "canceled" -> "Canceled"
            "queued" -> "Queued"
            else -> "Pipeline"
        }
    }
}
