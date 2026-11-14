package com.pos.mobile.launcher

import com.pos.mobile.OsWidgetSnapshot

/**
 * Sparse copy for the lock face — Home chrome energy, not a dashboard.
 * Clock/date are rendered by the activity; this is only the cue + one status line.
 */
data class LockScreenLines(
    val cueEyebrow: String,
    val cueTitle: String,
    val cueDetail: String,
    val statusLine: String?,
)

object LockScreenContent {
    fun resolve(next: NextActionContent, widgets: OsWidgetSnapshot): LockScreenLines {
        val eyebrow = when (next.route) {
            NextActionResolver.ROUTE_MORNING -> "MORNING"
            NextActionResolver.ROUTE_BLOCK -> "BLOCK"
            else -> "NOW"
        }
        val detail = next.detail.trim().takeIf { it.isNotEmpty() && !it.equals(next.title, ignoreCase = true) }.orEmpty()
        return LockScreenLines(
            cueEyebrow = eyebrow,
            cueTitle = next.title.trim().ifBlank { "Anchor" },
            cueDetail = detail,
            statusLine = pipelineLine(widgets),
        )
    }

    fun pipelineLine(widgets: OsWidgetSnapshot): String? {
        val title = widgets.pipelineTitle.trim()
        if (title.isEmpty() || title.equals("No pipeline yet", ignoreCase = true)) {
            return null
        }
        val meta = widgets.pipelineMeta.trim()
        return buildList {
            add(pipelineEyebrow(widgets.pipelineStatus))
            add(title)
            if (meta.isNotBlank() && !meta.equals(title, ignoreCase = true)) add(meta)
        }.joinToString(" · ")
    }

    /** Matches [OsWidgetUpdater] pipeline eyebrow wording. */
    fun pipelineEyebrow(status: String): String = when (status.lowercase()) {
        "running" -> "PIPELINE · RUNNING"
        "succeeded" -> "PIPELINE · OK"
        "failed" -> "PIPELINE · FAILED"
        "partial" -> "PIPELINE · PARTIAL"
        "canceled" -> "PIPELINE · CANCELED"
        "queued" -> "PIPELINE · QUEUED"
        else -> "PIPELINE"
    }
}
