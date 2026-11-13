package com.pos.mobile.launcher

import org.json.JSONArray
import org.json.JSONObject

data class K8sWidgetSnapshot(
    val status: String,
    val headline: String,
    val generatedAtMs: Long?,
    val partial: Boolean,
    val notes: List<String>,
    val nodesReady: Int?,
    val nodesTotal: Int?,
    val appsHealthy: Int?,
    val appsDegraded: Int?,
    val appsOffline: Int?,
    val appsStarting: Int?,
    val podsRunning: Int?,
    val podsWithProblems: Int?,
    val deploymentsReady: Int?,
    val deploymentsTotal: Int?,
    val apps: List<K8sAppRow>,
    val highlights: List<K8sHighlight>,
    val notDeployed: Boolean = false,
) {
    fun problemsCount(): Int {
        val degraded = appsDegraded ?: 0
        val offline = appsOffline ?: 0
        val podProblems = podsWithProblems ?: 0
        return (degraded + offline).coerceAtLeast(podProblems)
    }

    fun healthyCount(): Int = appsHealthy ?: apps.count { it.status.equals("Healthy", true) }

    fun countsLine(): String {
        val nodes = if (nodesReady != null && nodesTotal != null) {
            "Nodes $nodesReady/$nodesTotal"
        } else {
            null
        }
        val healthy = "Healthy ${healthyCount()}"
        val problems = problemsCount()
        val problemLabel = if (problems == 1) "1 problem" else "$problems problems"
        return listOfNotNull(nodes, healthy, problemLabel).joinToString(" · ")
    }

    companion object {
        fun notDeployed(): K8sWidgetSnapshot = K8sWidgetSnapshot(
            status = "unknown",
            headline = "Control panel updating",
            generatedAtMs = System.currentTimeMillis(),
            partial = true,
            notes = listOf("Cluster widget API is not on this control-panel image yet."),
            nodesReady = null,
            nodesTotal = null,
            appsHealthy = null,
            appsDegraded = null,
            appsOffline = null,
            appsStarting = null,
            podsRunning = null,
            podsWithProblems = null,
            deploymentsReady = null,
            deploymentsTotal = null,
            apps = emptyList(),
            highlights = emptyList(),
            notDeployed = true,
        )

        fun fromJson(json: JSONObject, generatedFallbackMs: Long = System.currentTimeMillis()): K8sWidgetSnapshot {
            val cluster = json.optJSONObject("cluster")
            val counts = json.optJSONObject("counts")
            return K8sWidgetSnapshot(
                status = json.optString("status").ifBlank { cluster?.optString("status").orEmpty() }.ifBlank { "unknown" },
                headline = json.optString("headline").ifBlank { "Cluster status" },
                generatedAtMs = com.pos.mobile.PosApiClient.parseUtcMillis(json.optString("generatedAt").ifBlank { null })
                    ?: generatedFallbackMs,
                partial = json.optBoolean("partial", false),
                notes = stringList(json.optJSONArray("notes")),
                nodesReady = intOrNull(cluster, "nodesReady"),
                nodesTotal = intOrNull(cluster, "nodesTotal"),
                appsHealthy = intOrNull(counts, "appsHealthy"),
                appsDegraded = intOrNull(counts, "appsDegraded"),
                appsOffline = intOrNull(counts, "appsOffline"),
                appsStarting = intOrNull(counts, "appsStarting"),
                podsRunning = intOrNull(counts, "podsRunning"),
                podsWithProblems = intOrNull(counts, "podsWithProblems"),
                deploymentsReady = intOrNull(counts, "deploymentsReady"),
                deploymentsTotal = intOrNull(counts, "deploymentsTotal"),
                apps = parseApps(json.optJSONArray("apps")),
                highlights = parseHighlights(json.optJSONArray("highlights")),
                notDeployed = false,
            )
        }

        private fun intOrNull(obj: JSONObject?, key: String): Int? {
            if (obj == null || !obj.has(key) || obj.isNull(key)) return null
            return obj.optInt(key)
        }

        private fun stringList(array: JSONArray?): List<String> {
            if (array == null) return emptyList()
            return (0 until array.length()).mapNotNull { index ->
                array.optString(index).takeIf { it.isNotBlank() }
            }
        }

        private fun parseApps(array: JSONArray?): List<K8sAppRow> {
            if (array == null) return emptyList()
            return (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                K8sAppRow(
                    name = item.optString("name").ifBlank { item.optString("appKey") },
                    namespace = item.optString("namespace"),
                    appKey = item.optString("appKey"),
                    status = item.optString("status").ifBlank { "Unknown" },
                    ready = item.optString("ready").ifBlank {
                        if (item.has("ready") && !item.isNull("ready")) item.opt("ready").toString() else ""
                    },
                    url = item.optString("url").ifBlank { null },
                    panelPath = item.optString("panelPath").ifBlank { null },
                ).takeIf { it.name.isNotBlank() }
            }.take(8)
        }

        private fun parseHighlights(array: JSONArray?): List<K8sHighlight> {
            if (array == null) return emptyList()
            return (0 until array.length()).mapNotNull { index ->
                val item = array.optJSONObject(index) ?: return@mapNotNull null
                K8sHighlight(
                    severity = item.optString("severity").ifBlank { "warning" },
                    kind = item.optString("kind").ifBlank { "app" },
                    name = item.optString("name"),
                    namespace = item.optString("namespace"),
                    status = item.optString("status"),
                    detail = item.optString("detail"),
                    url = item.optString("url").ifBlank { null },
                    logsPath = item.optString("logsPath").ifBlank { null },
                    panelPath = item.optString("panelPath").ifBlank { null },
                ).takeIf { it.name.isNotBlank() || it.detail.isNotBlank() }
            }
        }
    }
}

data class K8sAppRow(
    val name: String,
    val namespace: String,
    val appKey: String,
    val status: String,
    val ready: String,
    val url: String?,
    val panelPath: String?,
)

data class K8sHighlight(
    val severity: String,
    val kind: String,
    val name: String,
    val namespace: String,
    val status: String,
    val detail: String,
    val url: String?,
    val logsPath: String?,
    val panelPath: String?,
)
