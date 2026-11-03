package com.pos.mobile

import org.json.JSONObject

data class CurrentBlockSnapshot(
    val title: String,
    val startTime: String?,
    val endTime: String?,
) {
    fun timeRange(): String? {
        val start = startTime?.trim().orEmpty()
        val end = endTime?.trim().orEmpty()
        if (start.isEmpty() && end.isEmpty()) {
            return null
        }
        if (start.isEmpty()) {
            return end
        }
        if (end.isEmpty()) {
            return start
        }
        return "$start – $end"
    }

    companion object {
        fun fromTodayJson(raw: String): CurrentBlockSnapshot? {
            return try {
                val root = JSONObject(raw)
                val data = root.optJSONObject("data") ?: root
                fromBlockJson(data.optJSONObject("currentBlock"))
            } catch (_: Exception) {
                null
            }
        }

        fun fromBlockJson(block: JSONObject?): CurrentBlockSnapshot? {
            if (block == null) {
                return null
            }
            val title = block.optString("title").trim()
            if (title.isEmpty()) {
                return null
            }
            return CurrentBlockSnapshot(
                title = title,
                startTime = block.optString("startTime").trim().ifEmpty { null },
                endTime = block.optString("endTime").trim().ifEmpty { null },
            )
        }
    }
}
