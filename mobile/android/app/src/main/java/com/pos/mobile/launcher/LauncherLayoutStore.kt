package com.pos.mobile.launcher

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

object LauncherLayoutStore {
    const val SCHEMA = 1
    private const val FILE = "launcher_layout.json"

    fun load(context: Context): LauncherLayout {
        val file = File(context.filesDir, FILE)
        if (!file.exists()) return defaultLayout()
        return try {
            parse(file.readText())
        } catch (_: Exception) {
            defaultLayout()
        }
    }

    fun save(context: Context, layout: LauncherLayout) {
        val payload = layout.capped().toJson().toString()
        val file = File(context.filesDir, FILE)
        val tmp = File(context.filesDir, "$FILE.tmp")
        tmp.writeText(payload)
        if (!tmp.renameTo(file)) {
            file.writeText(payload)
            tmp.delete()
        }
    }

    fun defaultLayout(): LauncherLayout {
        return LauncherLayout(
            schema = SCHEMA,
            widgets = listOf(
                WidgetInstance("home-next", WidgetRegistry.NEXT_ACTION, WidgetPlacement.HOME, 0),
                WidgetInstance("home-today", WidgetRegistry.TODAY, WidgetPlacement.HOME, 1),
                WidgetInstance("dev-server", WidgetRegistry.SERVER, WidgetPlacement.DEVELOPER, 0),
                WidgetInstance("dev-bot", WidgetRegistry.TRADING_BOT, WidgetPlacement.DEVELOPER, 1),
            ),
            favorites = emptyList(),
            sawFavoritesPrompt = false,
        )
    }

    fun parse(raw: String): LauncherLayout {
        val json = JSONObject(raw)
        val schema = json.optInt("schema", 0)
        if (schema != SCHEMA) return defaultLayout()
        val widgets = json.optJSONArray("widgets") ?: JSONArray()
        val favorites = json.optJSONArray("favorites") ?: JSONArray()
        return LauncherLayout(
            schema = SCHEMA,
            widgets = (0 until widgets.length()).mapNotNull { index ->
                val item = widgets.optJSONObject(index) ?: return@mapNotNull null
                val typeId = item.optString("typeId")
                if (typeId.isBlank()) return@mapNotNull null
                WidgetInstance(
                    instanceId = item.optString("instanceId").ifBlank { UUID.randomUUID().toString() },
                    typeId = typeId,
                    placement = if (item.optString("placement") == WidgetPlacement.DEVELOPER.name) {
                        WidgetPlacement.DEVELOPER
                    } else {
                        WidgetPlacement.HOME
                    },
                    order = item.optInt("order", index),
                    settings = item.optJSONObject("settings") ?: JSONObject(),
                )
            }.sortedBy { it.order },
            favorites = (0 until favorites.length()).mapNotNull { index ->
                val item = favorites.optJSONObject(index) ?: return@mapNotNull null
                FavoriteApp(
                    packageName = item.optString("packageName"),
                    className = item.optString("className"),
                    userSerial = item.optLong("userSerial"),
                    label = item.optString("label"),
                ).takeIf { it.packageName.isNotBlank() && it.className.isNotBlank() }
            },
            sawFavoritesPrompt = json.optBoolean("sawFavoritesPrompt", false),
        ).capped()
    }
}

data class LauncherLayout(
    val schema: Int,
    val widgets: List<WidgetInstance>,
    val favorites: List<FavoriteApp>,
    val sawFavoritesPrompt: Boolean,
) {
    fun homeWidgets() = widgets.filter { it.placement == WidgetPlacement.HOME }.sortedBy { it.order }.take(2)
    fun developerWidgets() = widgets.filter { it.placement == WidgetPlacement.DEVELOPER }.sortedBy { it.order }.take(6)

    fun capped(): LauncherLayout {
        val home = homeWidgets().mapIndexed { index, widget -> widget.copy(order = index) }
        val developer = developerWidgets().mapIndexed { index, widget -> widget.copy(order = index) }
        return copy(widgets = home + developer, favorites = favorites.take(5))
    }

    fun toJson(): JSONObject {
        val list = JSONArray()
        widgets.forEach { widget ->
            list.put(
                JSONObject()
                    .put("instanceId", widget.instanceId)
                    .put("typeId", widget.typeId)
                    .put("placement", widget.placement.name)
                    .put("order", widget.order)
                    .put("settings", widget.settings),
            )
        }
        val favs = JSONArray()
        favorites.forEach { favorite ->
            favs.put(
                JSONObject()
                    .put("packageName", favorite.packageName)
                    .put("className", favorite.className)
                    .put("userSerial", favorite.userSerial)
                    .put("label", favorite.label),
            )
        }
        return JSONObject()
            .put("schema", schema)
            .put("widgets", list)
            .put("favorites", favs)
            .put("sawFavoritesPrompt", sawFavoritesPrompt)
    }
}
