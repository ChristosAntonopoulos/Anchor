package com.pos.mobile.launcher

import android.content.Context
import com.pos.mobile.CurrentBlockSnapshot
import com.pos.mobile.CurrentBlockStore
import com.pos.mobile.MorningModeLogic
import com.pos.mobile.MorningModeStore
import com.pos.mobile.OsWidgetSnapshot
import com.pos.mobile.OsWidgetStore
import java.util.TimeZone

data class NextActionContent(
    val title: String,
    val detail: String,
    val button: String,
    val route: String,
    val sample: Boolean = false,
)

object NextActionResolver {
    const val ROUTE_MORNING = "pos://os/morning"
    const val ROUTE_NOW = "pos://os/now"
    const val ROUTE_TASKS = "pos://os/tasks"
    const val ROUTE_BLOCK = "pos://os/block"

    fun resolve(context: Context, nowMs: Long = System.currentTimeMillis()): NextActionContent {
        return resolve(
            morning = MorningModeLogic.onCivilDate(MorningModeStore.gate(context), nowMs),
            nowMs = nowMs,
            now = OsWidgetStore.read(context),
            block = CurrentBlockStore.read(context),
        )
    }

    fun resolve(
        morning: MorningModeLogic.Gate,
        nowMs: Long,
        now: OsWidgetSnapshot,
        block: CurrentBlockSnapshot?,
        timeZone: TimeZone = TimeZone.getDefault(),
    ): NextActionContent {
        if (morning.status == MorningModeLogic.ACTIVE || morning.status == MorningModeLogic.PAUSED) {
            val verb = if (morning.status == MorningModeLogic.PAUSED) "Resume" else "Continue"
            return NextActionContent(
                title = "Morning Mode",
                detail = "The 30-minute indoor routine is underway.",
                button = "$verb morning",
                route = ROUTE_MORNING,
            )
        }
        if (MorningModeLogic.isAtOrAfterTrigger(nowMs, timeZone) &&
            (morning.status == MorningModeLogic.WAITING || morning.status == MorningModeLogic.NOT_DUE)
        ) {
            return NextActionContent(
                title = "Morning Mode",
                detail = "Due after 07:00. First unlock starts it.",
                button = "Open morning",
                route = ROUTE_MORNING,
            )
        }
        val hasTask = now.nowTitle.isNotBlank() && now.nowTitle != "Choose one thing"
        if (hasTask) {
            return NextActionContent(
                title = now.nowTitle,
                detail = now.nowAction.ifBlank { "First small step." },
                button = "Open task",
                route = ROUTE_NOW,
            )
        }
        if (block != null && block.title.isNotBlank()) {
            return NextActionContent(
                title = block.title,
                detail = block.entryAction?.ifBlank { null } ?: block.timeRange().orEmpty(),
                button = "Open block",
                route = ROUTE_BLOCK,
            )
        }
        if (now.nowAction.isNotBlank()) {
            return NextActionContent(
                title = "Choose one thing",
                detail = now.nowAction,
                button = "Choose a task",
                route = ROUTE_TASKS,
                sample = now.nowAction.contains("Open the app", ignoreCase = true),
            )
        }
        return NextActionContent(
            title = "Choose one thing",
            detail = "Nothing is queued yet.",
            button = "Choose a task",
            route = ROUTE_TASKS,
            sample = true,
        )
    }
}

data class TodayGlanceContent(
    val blockTitle: String,
    val blockMeta: String,
    val mealTitle: String,
    val mealMeta: String,
    val sample: Boolean,
)

object TodayGlanceResolver {
    fun resolve(context: Context): TodayGlanceContent {
        return resolve(OsWidgetStore.read(context), CurrentBlockStore.read(context))
    }

    fun resolve(widgets: OsWidgetSnapshot, block: CurrentBlockSnapshot?): TodayGlanceContent {
        val blockTitle = block?.title?.ifBlank { null } ?: widgets.blockTitle
        val blockMeta = block?.timeRange() ?: widgets.blockMeta
        val empty = (blockTitle.isBlank() || blockTitle == "No block") &&
            (widgets.mealTitle.isBlank() || widgets.mealTitle == "No meal set")
        return TodayGlanceContent(
            blockTitle = if (blockTitle.isBlank() || blockTitle == "No block") "No block now" else blockTitle,
            blockMeta = blockMeta.orEmpty(),
            mealTitle = widgets.mealTitle.ifBlank { "No meal set" },
            mealMeta = widgets.mealMeta,
            sample = empty,
        )
    }
}
