package com.pos.mobile

import android.app.Activity
import android.os.Build
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class MorningModeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        instance = this
        MorningModeTts.ensure(reactContext)
    }

    override fun getName(): String = "MorningModeModule"

    @ReactMethod
    fun addListener(eventName: String) {
    }

    @ReactMethod
    fun removeListeners(count: Int) {
    }

    @ReactMethod
    fun getGate(promise: Promise) {
        val gate = MorningModeStore.gate(reactApplicationContext)
        val map = Arguments.createMap()
        map.putBoolean("pending", MorningModeStore.peekPending(reactApplicationContext))
        map.putBoolean("pinEnabled", MorningModeStore.pinEnabled(reactApplicationContext))
        map.putBoolean("overlayGranted", MorningModeLauncher.overlayGranted(reactApplicationContext))
        if (gate != null) {
            map.putString("localDate", gate.localDate)
            map.putString("timezone", gate.timezone)
            map.putString("status", gate.status)
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun consumePending(promise: Promise) {
        promise.resolve(MorningModeStore.consumePending(reactApplicationContext))
    }

    @ReactMethod
    fun getSessionJson(promise: Promise) {
        promise.resolve(MorningModeStore.sessionJson(reactApplicationContext))
    }

    @ReactMethod
    fun saveSessionJson(json: String?, promise: Promise) {
        MorningModeStore.saveSessionJson(reactApplicationContext, json)
        promise.resolve(true)
    }

    @ReactMethod
    fun speak(text: String) {
        MorningModeTts.ensure(reactApplicationContext)
        MorningModeTts.speak(text)
    }

    @ReactMethod
    fun stopSpeaking() {
        MorningModeTts.stop()
    }

    @ReactMethod
    fun playChime() {
        try {
            val player = android.media.MediaPlayer.create(reactApplicationContext, R.raw.focus_chime)
            player?.setOnCompletionListener { it.release() }
            player?.start()
        } catch (_: Exception) {
        }
    }

    @ReactMethod
    fun setPinEnabled(enabled: Boolean, promise: Promise) {
        MorningModeStore.setPinEnabled(reactApplicationContext, enabled)
        promise.resolve(true)
    }

    @ReactMethod
    fun enterImmersive(promise: Promise) {
        runOnActivity(promise) { activity ->
            applyImmersive(activity, true)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun exitImmersive(promise: Promise) {
        runOnActivity(promise) { activity ->
            applyImmersive(activity, false)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun startPin(promise: Promise) {
        runOnActivity(promise) { activity ->
            try {
                activity.startLockTask()
                promise.resolve(true)
            } catch (_: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun stopPin(promise: Promise) {
        runOnActivity(promise) { activity ->
            try {
                activity.stopLockTask()
            } catch (_: Exception) {
            }
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun capabilities(promise: Promise) {
        val map = Arguments.createMap()
        map.putBoolean("userPresentReceiver", true)
        map.putBoolean("overlayPermission", MorningModeLauncher.overlayGranted(reactApplicationContext))
        map.putBoolean("fullScreenNotification", true)
        map.putBoolean("deviceOwnerLockTask", false)
        map.putBoolean("accessibilityUsed", false)
        map.putBoolean("screenPinningOptional", true)
        promise.resolve(map)
    }

    private fun runOnActivity(promise: Promise, block: (Activity) -> Unit) {
        val activity = currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }
        activity.runOnUiThread { block(activity) }
    }

    private fun applyImmersive(activity: Activity, on: Boolean) {
        val window = activity.window
        if (on) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val controller = window.insetsController ?: return
            if (on) {
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            } else {
                controller.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = if (on) {
                (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)
            } else {
                View.SYSTEM_UI_FLAG_VISIBLE
            }
        }
    }

    companion object {
        @Volatile
        private var instance: MorningModeModule? = null

        fun emitOpened() {
            val module = instance ?: return
            if (!module.reactApplicationContext.hasActiveReactInstance()) return
            try {
                module.reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onMorningMode", Arguments.createMap())
            } catch (_: Exception) {
            }
        }
    }
}
