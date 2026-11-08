package com.pos.mobile

import android.content.Context
import org.json.JSONObject

data class OsWidgetSnapshot(
    val nowTitle: String,
    val nowAction: String,
    val mealTitle: String,
    val mealMeta: String,
    val blockTitle: String,
    val blockMeta: String,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("nowTitle", nowTitle)
        put("nowAction", nowAction)
        put("mealTitle", mealTitle)
        put("mealMeta", mealMeta)
        put("blockTitle", blockTitle)
        put("blockMeta", blockMeta)
    }

    companion object {
        fun empty() = OsWidgetSnapshot(
            nowTitle = "Choose one thing",
            nowAction = "Open the app to load today",
            mealTitle = "No meal set",
            mealMeta = "",
            blockTitle = "No block",
            blockMeta = "",
        )

        fun fromJson(raw: String): OsWidgetSnapshot {
            val json = JSONObject(raw)
            return OsWidgetSnapshot(
                nowTitle = json.optString("nowTitle").ifBlank { empty().nowTitle },
                nowAction = json.optString("nowAction"),
                mealTitle = json.optString("mealTitle").ifBlank { empty().mealTitle },
                mealMeta = json.optString("mealMeta"),
                blockTitle = json.optString("blockTitle").ifBlank { empty().blockTitle },
                blockMeta = json.optString("blockMeta"),
            )
        }
    }
}

object OsWidgetStore {
    private const val PREFS = "pos_widgets"
    private const val KEY = "snapshot"

    @Synchronized
    fun write(context: Context, snapshot: OsWidgetSnapshot) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY, snapshot.toJson().toString())
            .apply()
    }

    @Synchronized
    fun read(context: Context): OsWidgetSnapshot {
        val raw = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY, null)
            ?: return OsWidgetSnapshot.empty()
        return try {
            OsWidgetSnapshot.fromJson(raw)
        } catch (_: Exception) {
            OsWidgetSnapshot.empty()
        }
    }
}
