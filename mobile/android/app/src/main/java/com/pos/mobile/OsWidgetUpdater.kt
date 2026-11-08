package com.pos.mobile

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

object OsWidgetUpdater {
    fun refreshAll(context: Context) {
        val snapshot = OsWidgetStore.read(context)
        val manager = AppWidgetManager.getInstance(context)
        update(context, manager, OsNowWidget::class.java, R.layout.widget_now, snapshot.nowTitle, snapshot.nowAction, "pos://os/now")
        update(context, manager, OsMealWidget::class.java, R.layout.widget_meal, snapshot.mealTitle, snapshot.mealMeta, "pos://os/meals")
        update(context, manager, OsBlockWidget::class.java, R.layout.widget_block, snapshot.blockTitle, snapshot.blockMeta, "pos://os/block")
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
        val open = Intent(Intent.ACTION_VIEW, Uri.parse(deepLink)).apply {
            setPackage(context.packageName)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            context,
            deepLink.hashCode(),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        views.setOnClickPendingIntent(R.id.widget_root, pending)
        ids.forEach { manager.updateAppWidget(it, views) }
    }
}
