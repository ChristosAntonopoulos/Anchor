package com.pos.mobile.launcher

import android.content.Context

object WidgetRegistry {
    const val NEXT_ACTION = "next_action"
    const val TODAY = "today_glance"
    const val SERVER = "server"
    const val TRADING_BOT = "trading_bot"

    fun definitions(): List<WidgetDefinition> = listOf(
        WidgetDefinition(NEXT_ACTION, "Next Action", WidgetPlacement.HOME) { context, instance ->
            NextActionProvider(context, instance)
        },
        WidgetDefinition(TODAY, "Today", WidgetPlacement.HOME) { context, instance ->
            TodayGlanceProvider(context, instance)
        },
        WidgetDefinition(SERVER, "Server", WidgetPlacement.DEVELOPER) { _, instance ->
            SampleStatusProvider(instance, SampleCatalog.server(), "server")
        },
        WidgetDefinition(TRADING_BOT, "Trading bot", WidgetPlacement.DEVELOPER) { _, instance ->
            SampleStatusProvider(instance, SampleCatalog.trading(), "exchange")
        },
    )

    fun get(typeId: String): WidgetDefinition? = definitions().find { it.typeId == typeId }

    fun titleFor(typeId: String): String = get(typeId)?.title ?: typeId

    fun picker(placement: WidgetPlacement): List<WidgetDefinition> =
        definitions().filter { it.placement == placement }

    fun create(context: Context, instance: WidgetInstance): WidgetContentProvider? {
        val definition = get(instance.typeId) ?: return null
        return definition.factory(context.applicationContext, instance)
    }
}
