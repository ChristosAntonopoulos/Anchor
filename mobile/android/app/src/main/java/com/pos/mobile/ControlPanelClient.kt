package com.pos.mobile

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

/**
 * Kubernetes control-panel host (separate from Anchor POS API).
 * Configurable base URL for Developer Cluster widget.
 */
object ControlPanelClient {
    private const val PREFS = "pos_control_panel"
    private const val KEY_BASE = "baseUrl"
    const val DEFAULT_BASE_URL = "http://185.193.66.50:30080"
    private val executor = Executors.newSingleThreadExecutor()

    fun baseUrl(context: Context): String {
        val stored = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_BASE, null)
            ?.trim()
            ?.trimEnd('/')
        return if (stored.isNullOrBlank()) DEFAULT_BASE_URL else stored
    }

    fun setBaseUrl(context: Context, url: String) {
        val trimmed = url.trim().trimEnd('/')
        if (trimmed.isEmpty()) return
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BASE, trimmed)
            .apply()
    }

    fun enqueue(work: () -> Unit) {
        executor.execute {
            try {
                work()
            } catch (_: Exception) {
            }
        }
    }

    fun absoluteUrl(context: Context, pathOrUrl: String?): String? {
        if (pathOrUrl.isNullOrBlank()) return null
        if (pathOrUrl.startsWith("http://", ignoreCase = true) ||
            pathOrUrl.startsWith("https://", ignoreCase = true)
        ) {
            return pathOrUrl
        }
        return "${baseUrl(context)}${if (pathOrUrl.startsWith("/")) pathOrUrl else "/$pathOrUrl"}"
    }

    sealed class WidgetFetch {
        data class Ok(val json: JSONObject) : WidgetFetch()
        data object NotDeployed : WidgetFetch()
        data class Failed(val message: String, val httpCode: Int? = null) : WidgetFetch()
    }

    /** Prefer dedicated widget payload; fall back to /api/apps + overview when route is HTML/404. */
    sealed class ClusterFetch {
        data class Ok(
            val snapshot: com.pos.mobile.launcher.K8sWidgetSnapshot,
            val source: String,
        ) : ClusterFetch()
        data class Failed(val message: String, val httpCode: Int? = null) : ClusterFetch()
    }

    fun fetchWidget(
        context: Context,
        namespace: String? = null,
        limit: Int = 5,
        includeSystem: Boolean = false,
    ): WidgetFetch {
        val clamped = limit.coerceIn(1, 10)
        val query = buildString {
            append("limit=").append(clamped)
            if (!namespace.isNullOrBlank()) append("&namespace=").append(java.net.URLEncoder.encode(namespace, "UTF-8"))
            if (includeSystem) append("&includeSystem=true")
        }
        return getJson(context, "/api/widget?$query")
    }

    fun fetchApps(context: Context): WidgetFetch = getJson(context, "/api/apps")

    fun fetchOverview(context: Context): WidgetFetch = getJson(context, "/api/dashboard/overview")

    fun fetchCluster(
        context: Context,
        namespace: String? = null,
        limit: Int = 5,
        includeSystem: Boolean = false,
    ): ClusterFetch {
        when (val widget = fetchWidget(context, namespace, limit, includeSystem)) {
            is WidgetFetch.Ok -> {
                if (looksLikeWidgetPayload(widget.json)) {
                    return ClusterFetch.Ok(
                        snapshot = com.pos.mobile.launcher.K8sWidgetSnapshot.fromJson(widget.json),
                        source = "widget",
                    )
                }
                // Unexpected JSON shape — try live apps feed.
            }
            is WidgetFetch.Failed -> {
                // Keep hard 500 as failure so the card can retain last-good;
                // other failures still attempt apps fallback.
                if (widget.httpCode == 500) {
                    return ClusterFetch.Failed(widget.message, widget.httpCode)
                }
            }
            WidgetFetch.NotDeployed -> {
                // Fall through to /api/apps.
            }
        }
        return when (val apps = fetchApps(context)) {
            is WidgetFetch.Ok -> {
                val overview = when (val ov = fetchOverview(context)) {
                    is WidgetFetch.Ok -> ov.json
                    else -> null
                }
                val mapped = com.pos.mobile.launcher.K8sWidgetSnapshot.fromAppsAndOverview(
                    appsJson = apps.json,
                    overviewJson = overview,
                    namespace = namespace,
                    limit = limit.coerceIn(1, 10),
                    includeSystem = includeSystem,
                )
                ClusterFetch.Ok(mapped, source = "apps")
            }
            WidgetFetch.NotDeployed -> ClusterFetch.Failed("Control panel apps API not available")
            is WidgetFetch.Failed -> ClusterFetch.Failed(apps.message, apps.httpCode)
        }
    }

    private fun looksLikeWidgetPayload(json: JSONObject): Boolean {
        return json.has("headline") ||
            json.has("cluster") ||
            (json.has("status") && (json.has("counts") || json.has("apps") || json.has("highlights")))
    }

    fun fetchLogs(context: Context, logsPath: String): String {
        val absolute = absoluteUrl(context, logsPath)
            ?: throw IllegalArgumentException("Missing logs path")
        val connection = (URL(absolute).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 10_000
            readTimeout = 20_000
            setRequestProperty("Accept", "application/json, text/plain")
        }
        return try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                throw IllegalStateException("Logs GET returned HTTP $code")
            }
            // Spec: 200 JSON string (quoted text) — also accept raw text.
            val trimmed = body.trim()
            if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
                JSONObject("{\"v\":$trimmed}").optString("v", trimmed)
            } else {
                body
            }
        } finally {
            connection.disconnect()
        }
    }

    private fun getJson(context: Context, path: String): WidgetFetch {
        val absolute = absoluteUrl(context, path) ?: return WidgetFetch.Failed("Missing control panel base URL")
        val connection = (URL(absolute).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 8_000
            readTimeout = 12_000
            setRequestProperty("Accept", "application/json")
        }
        return try {
            val code = connection.responseCode
            val contentType = connection.contentType.orEmpty()
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            when {
                code == 404 -> WidgetFetch.NotDeployed
                code == 500 -> WidgetFetch.Failed(
                    message = runCatching { JSONObject(body).optString("error") }
                        .getOrNull()
                        ?.takeIf { it.isNotBlank() }
                        ?: "Failed to build widget snapshot",
                    httpCode = 500,
                )
                code !in 200..299 -> WidgetFetch.Failed("HTTP $code", code)
                contentType.contains("text/html", ignoreCase = true) -> WidgetFetch.NotDeployed
                body.trimStart().startsWith("<") -> WidgetFetch.NotDeployed
                else -> {
                    val json = runCatching { JSONObject(body) }.getOrElse {
                        return WidgetFetch.NotDeployed
                    }
                    if (!json.has("status") && !json.has("headline") && json.has("error")) {
                        WidgetFetch.Failed(json.optString("error", "Control panel error"), code)
                    } else {
                        WidgetFetch.Ok(json)
                    }
                }
            }
        } catch (error: Exception) {
            WidgetFetch.Failed(error.message ?: "Network error")
        } finally {
            connection.disconnect()
        }
    }
}
