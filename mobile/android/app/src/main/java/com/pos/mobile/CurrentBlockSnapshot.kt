package com.pos.mobile

import org.json.JSONArray
import org.json.JSONObject

data class CurrentBlockItem(
    val title: String,
    val completed: Boolean = false,
)

data class CurrentBlockSnapshot(
    val title: String,
    val startTime: String?,
    val endTime: String?,
    val items: List<CurrentBlockItem> = emptyList(),
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
                items = itemsFrom(block),
            )
        }

        fun itemsFrom(block: JSONObject): List<CurrentBlockItem> {
            val checklist = stringItems(block.optJSONArray("checklistItems"), preferObjects = true)
            if (checklist.isNotEmpty()) {
                return checklist
            }
            val cached = stringItems(block.optJSONArray("items"), preferObjects = true)
            if (cached.isNotEmpty()) {
                return cached
            }
            return stringItems(block.optJSONArray("routineActivities"), preferObjects = false)
        }

        private fun stringItems(array: JSONArray?, preferObjects: Boolean): List<CurrentBlockItem> {
            if (array == null) {
                return emptyList()
            }
            val items = mutableListOf<CurrentBlockItem>()
            for (index in 0 until array.length()) {
                val value = array.opt(index) ?: continue
                if (value is JSONObject) {
                    val title = value.optString("title").trim()
                    if (title.isNotEmpty()) {
                        items.add(CurrentBlockItem(title, value.optBoolean("completed", false)))
                    }
                } else if (!preferObjects || items.isEmpty()) {
                    val title = value.toString().trim()
                    if (title.isNotEmpty() && title != "null") {
                        items.add(CurrentBlockItem(title))
                    }
                }
            }
            return items
        }
    }
}
