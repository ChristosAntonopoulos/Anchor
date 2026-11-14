package com.pos.mobile

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.pos.mobile.launcher.LauncherIntents

class LauncherModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "LauncherModule"

    @ReactMethod
    fun previewHome(promise: Promise) {
        try {
            LauncherIntents.preview(reactApplicationContext)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("LAUNCHER", error.message, error)
        }
    }

    @ReactMethod
    fun requestHomeRole(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            LauncherIntents.openHomeSettings(reactApplicationContext)
            promise.resolve(false)
            return
        }
        activity.runOnUiThread {
            promise.resolve(LauncherIntents.requestHomeRole(activity))
        }
    }

    @ReactMethod
    fun openHomeSettings(promise: Promise) {
        LauncherIntents.openHomeSettings(reactApplicationContext)
        promise.resolve(true)
    }

    @ReactMethod
    fun isDefaultHome(promise: Promise) {
        promise.resolve(LauncherIntents.isDefaultHome(reactApplicationContext))
    }
}
