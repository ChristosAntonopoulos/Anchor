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

        /**
         * Map control-panel GET /api/apps (+ optional /api/dashboard/overview)
         * into the same snapshot shape used by GET /api/widget.
         */
        fun fromAppsAndOverview(
            appsJson: JSONObject,
            overviewJson: JSONObject? = null,
            namespace: String? = null,
            limit: Int = 5,
            includeSystem: Boolean = false,
            generatedFallbackMs: Long = System.currentTimeMillis(),
        ): K8sWidgetSnapshot {
            val rawApps = appsJson.optJSONArray("apps") ?: JSONArray()
            val filtered = (0 until rawApps.length()).mapNotNull { index ->
                rawApps.optJSONObject(index)
            }.filter { item ->
                if (!includeSystem && item.optBoolean("isSystem", false)) return@filter false
                if (!namespace.isNullOrBlank() &&
                    !item.optString("namespace").equals(namespace, ignoreCase = true)
                ) {
                    return@filter false
                }
                true
            }

            val summary = appsJson.optJSONObject("summary")
            val healthy = summary?.optInt("healthy")
                ?: filtered.count { normalizeAppStatus(it) == "Healthy" }
            val degraded = summary?.optInt("degraded")
                ?: filtered.count { normalizeAppStatus(it) == "Degraded" }
            val offline = summary?.optInt("offline")
                ?: filtered.count { normalizeAppStatus(it) == "Offline" }
            val starting = summary?.optInt("starting")
                ?: filtered.count { normalizeAppStatus(it) == "Starting" }

            // When namespace/system filters apply, recount from filtered list.
            val (h, d, o, s) = if (!namespace.isNullOrBlank() || !includeSystem) {
                val statuses = filtered.map { normalizeAppStatus(it) }
                listOf(
                    statuses.count { it == "Healthy" },
                    statuses.count { it == "Degraded" },
                    statuses.count { it == "Offline" },
                    statuses.count { it == "Starting" },
                )
            } else {
                listOf(healthy, degraded, offline, starting)
            }

            val problemApps = filtered
                .filter { normalizeAppStatus(it) in setOf("Offline", "Degraded", "Starting", "Unknown") }
                .sortedWith(
                    compareBy<JSONObject> { statusRank(normalizeAppStatus(it)) }
                        .thenByDescending { it.optString("statusReason").contains("CrashLoop", true) }
                        .thenBy { it.optString("displayName").ifBlank { it.optString("appKey") } },
                )

            val hasCrashLoop = problemApps.any {
                it.optString("statusReason").contains("CrashLoop", ignoreCase = true)
            }
            val status = when {
                hasCrashLoop || o >= 3 -> "critical"
                o > 0 || d > 0 -> "attention"
                overviewHealth(overviewJson).equals("Warning", true) -> "attention"
                overviewHealth(overviewJson).equals("Critical", true) ||
                    overviewHealth(overviewJson).equals("Error", true) -> "critical"
                h > 0 -> "healthy"
                else -> "unknown"
            }

            val headline = when {
                problemApps.isEmpty() -> "All apps healthy"
                problemApps.size == 1 -> {
                    val app = problemApps.first()
                    val name = app.optString("displayName").ifBlank { app.optString("appKey") }
                    val reason = shortReason(app.optString("statusReason"))
                    if (reason.isNotBlank()) "$name · $reason" else "$name needs attention"
                }
                o > 0 && d == 0 -> "$o apps offline"
                else -> "${problemApps.size} apps need attention"
            }

            val generatedAtMs = com.pos.mobile.PosApiClient.parseUtcMillis(
                appsJson.optString("lastUpdated").ifBlank { null },
            ) ?: com.pos.mobile.PosApiClient.parseUtcMillis(
                overviewJson?.optString("lastUpdated")?.ifBlank { null },
            ) ?: generatedFallbackMs

            val (nodesReady, nodesTotal) = nodesFromOverview(overviewJson)
            val podsRunning = intOrNull(overviewJson, "runningPods")
            val failedPods = intOrNull(overviewJson, "failedPods") ?: 0
            val pendingPods = intOrNull(overviewJson, "pendingPods") ?: 0
            val podsWithProblems = (failedPods + pendingPods).takeIf { overviewJson != null }

            val appRows = (problemApps + filtered.filter { normalizeAppStatus(it) == "Healthy" })
                .distinctBy { it.optString("appKey") }
                .take(8)
                .map { item ->
                    val key = item.optString("appKey")
                    val readyPods = item.optInt("readyPods")
                    val totalPods = item.optInt("totalPods")
                    K8sAppRow(
                        name = item.optString("displayName").ifBlank { key },
                        namespace = item.optString("namespace"),
                        appKey = key,
                        status = normalizeAppStatus(item),
                        ready = if (totalPods > 0 || readyPods > 0) "$readyPods/$totalPods" else "",
                        url = item.optString("primaryUrl").ifBlank { null },
                        panelPath = if (key.isNotBlank()) "/apps/$key" else "/apps",
                    )
                }

            val highlights = problemApps.take(limit.coerceIn(1, 10)).map { item ->
                val key = item.optString("appKey")
                val name = item.optString("displayName").ifBlank { key }
                val appStatus = normalizeAppStatus(item)
                val reason = item.optString("statusReason")
                K8sHighlight(
                    severity = if (reason.contains("CrashLoop", true) || appStatus == "Offline") {
                        "critical"
                    } else {
                        "warning"
                    },
                    kind = "app",
                    name = name,
                    namespace = item.optString("namespace"),
                    status = appStatus,
                    detail = shortReason(reason).ifBlank { item.optString("availabilitySummary") },
                    url = item.optString("primaryUrl").ifBlank { null },
                    logsPath = null,
                    panelPath = if (key.isNotBlank()) "/apps/$key" else "/apps",
                )
            }

            val notes = buildList {
                if (overviewJson == null) add("Cluster overview unavailable")
            }

            return K8sWidgetSnapshot(
                status = status,
                headline = headline,
                generatedAtMs = generatedAtMs,
                partial = overviewJson == null,
                notes = notes,
                nodesReady = nodesReady,
                nodesTotal = nodesTotal,
                appsHealthy = h,
                appsDegraded = d,
                appsOffline = o,
                appsStarting = s,
                podsRunning = podsRunning,
                podsWithProblems = podsWithProblems,
                deploymentsReady = null,
                deploymentsTotal = null,
                apps = appRows,
                highlights = highlights,
                notDeployed = false,
            )
        }

        private fun normalizeAppStatus(item: JSONObject): String {
            val raw = item.optString("userStatus").ifBlank { item.optString("status") }
            return when (raw.lowercase()) {
                "healthy" -> "Healthy"
                "degraded" -> "Degraded"
                "offline" -> "Offline"
                "starting" -> "Starting"
                else -> "Unknown"
            }
        }

        private fun statusRank(status: String): Int = when (status) {
            "Offline" -> 0
            "Degraded" -> 1
            "Starting" -> 2
            "Unknown" -> 3
            else -> 4
        }

        private fun shortReason(reason: String): String {
            if (reason.isBlank()) return ""
            val crash = Regex("CrashLoopBackOff", RegexOption.IGNORE_CASE).find(reason)
            if (crash != null) return "CrashLoopBackOff"
            val first = reason.substringBefore('.').trim()
            return first.take(72)
        }

        private fun overviewHealth(overview: JSONObject?): String =
            overview?.optString("healthStatus").orEmpty()

        private fun nodesFromOverview(overview: JSONObject?): Pair<Int?, Int?> {
            if (overview == null) return null to null
            val total = intOrNull(overview, "totalNodes")
            val breakdown = overview.optJSONObject("nodeStatusBreakdown")
            val fromBreakdown = if (breakdown != null && breakdown.has("True")) {
                breakdown.optInt("True")
            } else {
                null
            }
            val readyField = intOrNull(overview, "readyNodes")
            // Prefer Ready=True breakdown when readyNodes looks stale (0 with True:N).
            val ready = when {
                fromBreakdown != null && (readyField == null || (readyField == 0 && fromBreakdown > 0)) ->
                    fromBreakdown
                readyField != null -> readyField
                else -> fromBreakdown
            }
            return ready to total
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
