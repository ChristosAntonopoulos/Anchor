package com.pos.mobile

import android.content.Context
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CurrentBlockStore {
    private const val PREFS = "pos_unlock"
    private const val KEY_BLOCK = "currentBlock"

    @Synchronized
    fun write(context: Context, snapshot: CurrentBlockSnapshot?) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (snapshot == null) {
            prefs.edit().remove(KEY_BLOCK).apply()
            return
        }
        val json = JSONObject().apply {
            put("title", snapshot.title)
            put("startTime", snapshot.startTime ?: "")
            put("endTime", snapshot.endTime ?: "")
            put("cachedOn", localDate())
        }
        prefs.edit().putString(KEY_BLOCK, json.toString()).apply()
    }

    @Synchronized
    fun read(context: Context): CurrentBlockSnapshot? {
        val raw = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_BLOCK, null)
            ?: return null
        return try {
            val json = JSONObject(raw)
            val cachedOn = json.optString("cachedOn").trim()
            if (cachedOn.isNotEmpty() && cachedOn != localDate()) {
                return null
            }
            CurrentBlockSnapshot.fromBlockJson(json)
        } catch (_: Exception) {
            null
        }
    }

    private fun localDate(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
    }
}
