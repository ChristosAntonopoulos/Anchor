package com.pos.mobile.launcher

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import com.pos.mobile.WalletLaunchDetector
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class RecentEntry(
    val packageName: String,
    val className: String,
    val label: String,
    val atMs: Long,
) {
    fun key() = "$packageName/$className"
}

object RecentApps {
    const val LIMIT = 16
    private const val FILE = "launcher_recents.json"
    private val hiddenPackages = setOf(
        "com.android.systemui",
        "com.android.permissioncontroller",
        "com.google.android.permissioncontroller",
        "com.android.launcher3",
        "com.google.android.apps.nexuslauncher",
        "com.sec.android.app.launcher",
        "com.samsung.android.honeyboard",
    )

    fun remember(context: Context, app: LaunchableApp, atMs: Long = System.currentTimeMillis()) {
        val next = merge(
            listOf(RecentEntry(app.packageName, app.className, app.label, atMs)),
            load(context),
        )
        save(context, next)
    }

    fun list(context: Context, apps: List<LaunchableApp> = InstalledApps.list(context)): List<LaunchableApp> {
        val self = context.packageName
        val remembered = load(context)
        val usage = usage(context, self)
        val ranked = merge(remembered, usage)
        val byKey = apps.associateBy { "${it.packageName}/${it.className}" }
        val byPackage = apps.groupBy { it.packageName }
        val seen = mutableSetOf<String>()
        val resolved = mutableListOf<LaunchableApp>()
        ranked.forEach { entry ->
            if (entry.packageName == self || hiddenPackages.contains(entry.packageName)) return@forEach
            val match = byKey[entry.key()] ?: byPackage[entry.packageName]?.firstOrNull() ?: return@forEach
            val id = "${match.userSerial}/${match.packageName}/${match.className}"
            if (!seen.add(id)) return@forEach
            resolved.add(match)
        }
        return resolved.take(LIMIT)
    }

    fun merge(vararg groups: List<RecentEntry>): List<RecentEntry> {
        val newest = linkedMapOf<String, RecentEntry>()
        groups.forEach { group ->
            group.forEach { entry ->
                if (entry.packageName.isBlank()) return@forEach
                val current = newest[entry.key()]
                if (current == null || entry.atMs >= current.atMs) newest[entry.key()] = entry
            }
        }
        return newest.values.sortedByDescending { it.atMs }.take(LIMIT)
    }

    private fun load(context: Context): List<RecentEntry> {
        val file = File(context.filesDir, FILE)
        if (!file.exists()) return emptyList()
        return try {
            parse(file.readText())
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun parse(raw: String): List<RecentEntry> {
        val list = JSONArray(raw)
        return (0 until list.length()).mapNotNull { index ->
            val item = list.optJSONObject(index) ?: return@mapNotNull null
            RecentEntry(
                packageName = item.optString("packageName"),
                className = item.optString("className"),
                label = item.optString("label"),
                atMs = item.optLong("atMs"),
            ).takeIf { it.packageName.isNotBlank() }
        }
    }

    private fun save(context: Context, entries: List<RecentEntry>) {
        val payload = JSONArray()
        entries.forEach { entry ->
            payload.put(
                JSONObject()
                    .put("packageName", entry.packageName)
                    .put("className", entry.className)
                    .put("label", entry.label)
                    .put("atMs", entry.atMs),
            )
        }
        val file = File(context.filesDir, FILE)
        val tmp = File(context.filesDir, "$FILE.tmp")
        tmp.writeText(payload.toString())
        if (!tmp.renameTo(file)) {
            file.writeText(payload.toString())
            tmp.delete()
        }
    }

    private fun usage(context: Context, self: String): List<RecentEntry> {
        if (!WalletLaunchDetector.isUsageAccessGranted(context)) return emptyList()
        return try {
            val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val now = System.currentTimeMillis()
            val events = manager.queryEvents(now - 36 * 60 * 60 * 1000L, now)
            val event = UsageEvents.Event()
            val found = mutableListOf<RecentEntry>()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (!isResume(event.eventType)) continue
                val pkg = event.packageName ?: continue
                if (pkg == self || hiddenPackages.contains(pkg)) continue
                found.add(RecentEntry(pkg, event.className.orEmpty(), pkg, event.timeStamp))
            }
            merge(found)
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun isResume(type: Int): Boolean {
        if (type == UsageEvents.Event.ACTIVITY_RESUMED) return true
        @Suppress("DEPRECATION")
        return type == UsageEvents.Event.MOVE_TO_FOREGROUND
    }
}
