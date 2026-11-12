package com.pos.mobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class OsWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "OsWidgetModule"

    @ReactMethod
    fun updateSnapshot(map: ReadableMap, promise: Promise) {
        try {
            val snapshot = OsWidgetSnapshot(
                nowTitle = string(map, "nowTitle"),
                nowAction = string(map, "nowAction"),
                mealTitle = string(map, "mealTitle"),
                mealMeta = string(map, "mealMeta"),
                blockTitle = string(map, "blockTitle"),
                blockMeta = string(map, "blockMeta"),
                pipelineTitle = string(map, "pipelineTitle"),
                pipelineMeta = string(map, "pipelineMeta"),
                pipelineStatus = string(map, "pipelineStatus"),
            )
            OsWidgetStore.write(reactApplicationContext, snapshot)
            OsWidgetUpdater.refreshAll(reactApplicationContext)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("WIDGET_UPDATE_FAILED", error.message, error)
        }
    }

    private fun string(map: ReadableMap, key: String): String {
        return if (map.hasKey(key) && !map.isNull(key)) map.getString(key).orEmpty() else ""
    }
}
