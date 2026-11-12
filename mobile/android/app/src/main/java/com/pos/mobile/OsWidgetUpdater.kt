package com.pos.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.widget.RemoteViews

object OsWidgetUpdater {
    fun refreshAll(context: Context) {
        val snapshot = OsWidgetStore.read(context)
        val manager = AppWidgetManager.getInstance(context)
        update(context, manager, OsNowWidget::class.java, R.layout.widget_now, snapshot.nowTitle, snapshot.nowAction, "pos://os/now")
        update(context, manager, OsMealWidget::class.java, R.layout.widget_meal, snapshot.mealTitle, snapshot.mealMeta, "pos://os/meals")
        update(context, manager, OsBlockWidget::class.java, R.layout.widget_block, snapshot.blockTitle, snapshot.blockMeta, "pos://os/block")
        updatePipeline(context, manager, snapshot)
    }

    private fun update(
        context: Context,
        manager: AppWidgetManager,
        provider: Class<*>,
        layout: Int,
        title: String,
        subtitle: String,
        deepLink: String,
    ) {
        val ids = manager.getAppWidgetIds(ComponentName(context, provider))
        if (ids.isEmpty()) return
        val views = RemoteViews(context.packageName, layout)
        views.setTextViewText(R.id.widget_title, title)
        views.setTextViewText(R.id.widget_subtitle, subtitle.ifBlank { " " })
        views.setOnClickPendingIntent(R.id.widget_root, openIntent(context, deepLink))
        ids.forEach { manager.updateAppWidget(it, views) }
    }

    private fun updatePipeline(context: Context, manager: AppWidgetManager, snapshot: OsWidgetSnapshot) {
        val ids = manager.getAppWidgetIds(ComponentName(context, OsPipelineWidget::class.java))
        if (ids.isEmpty()) return
        val views = RemoteViews(context.packageName, R.layout.widget_pipeline)
        views.setTextViewText(R.id.widget_eyebrow, pipelineEyebrow(snapshot.pipelineStatus))
        views.setTextColor(R.id.widget_eyebrow, pipelineAccent(snapshot.pipelineStatus))
        views.setTextViewText(R.id.widget_title, snapshot.pipelineTitle.ifBlank { "No pipeline yet" })
        views.setTextViewText(R.id.widget_subtitle, snapshot.pipelineMeta.ifBlank { " " })
        views.setOnClickPendingIntent(R.id.widget_root, openIntent(context, "pos://os/pipeline"))
        ids.forEach { manager.updateAppWidget(it, views) }
    }

    private fun openIntent(context: Context, deepLink: String): PendingIntent {
        val open = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
            setPackage(context.packageName)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        return PendingIntent.getActivity(
            context,
            deepLink.hashCode(),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun pipelineEyebrow(status: String): String = when (status.lowercase()) {
        "running" -> "PIPELINE · RUNNING"
        "succeeded" -> "PIPELINE · OK"
        "failed" -> "PIPELINE · FAILED"
        "partial" -> "PIPELINE · PARTIAL"
        "canceled" -> "PIPELINE · CANCELED"
        "queued" -> "PIPELINE · QUEUED"
        else -> "PIPELINE"
    }

    private fun pipelineAccent(status: String): Int = when (status.lowercase()) {
        "running" -> Color.parseColor("#7EB6FF")
        "succeeded" -> Color.parseColor("#A4CDBB")
        "failed" -> Color.parseColor("#E08A8A")
        "partial" -> Color.parseColor("#E0C27A")
        "canceled" -> Color.parseColor("#9AA7A0")
        "queued" -> Color.parseColor("#B4C1BA")
        else -> Color.parseColor("#A4CDBB")
    }
}
