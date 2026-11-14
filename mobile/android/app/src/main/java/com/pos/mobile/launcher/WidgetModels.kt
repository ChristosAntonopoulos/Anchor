package com.pos.mobile.launcher

import org.json.JSONObject

enum class WidgetPlacement { HOME, DEVELOPER }

data class WidgetDefinition(
    val typeId: String,
    val title: String,
    val placement: WidgetPlacement,
    val defaultSettings: JSONObject = JSONObject(),
    val factory: (android.content.Context, WidgetInstance) -> WidgetContentProvider,
)

data class WidgetInstance(
    val instanceId: String,
    val typeId: String,
    val placement: WidgetPlacement,
    val order: Int,
    val settings: JSONObject = JSONObject(),
)

sealed class WidgetUiState<out T> {
    data object Loading : WidgetUiState<Nothing>()
    data object Empty : WidgetUiState<Nothing>()
    data class Content<T>(
        val value: T,
        val sourceAtMs: Long?,
        val refreshing: Boolean = false,
        val refreshError: String? = null,
        val sample: Boolean = false,
        val hideTimestamp: Boolean = false,
    ) : WidgetUiState<T>()
}

sealed class WidgetAction {
    data class Refresh(val instanceId: String) : WidgetAction()
    data class Details(val instanceId: String) : WidgetAction()
    data class OpenRoute(val url: String) : WidgetAction()
    data class OpenUrl(val url: String) : WidgetAction()
    data class FetchLogs(val path: String, val title: String) : WidgetAction()
}

data class WidgetRow(
    val label: String,
    val value: String,
    val meta: String = "",
    val action: WidgetAction? = null,
)

interface WidgetContentProvider {
    val instance: WidgetInstance
    fun current(): WidgetUiState<*>
    fun observe(onChange: () -> Unit): () -> Unit
    fun refresh()
    fun primaryLabel(): String?
    fun body(): String
    fun status(): String?
    fun actionLabel(): String?
    /** Header action (e.g. Refresh). */
    fun primaryAction(): WidgetAction?
    /** Whole-card tap; when null, card click uses [primaryAction]. */
    fun tapAction(): WidgetAction? = null
    fun rows(): List<WidgetRow> = emptyList()
    fun accentColor(): Int? = null
}

data class FavoriteApp(
    val packageName: String,
    val className: String,
    val userSerial: Long,
    val label: String,
)
