package com.pos.mobile

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class PhoneUnlockModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val TAG = "PhoneUnlockModule"
    private var isListening = false

    init {
        android.util.Log.d(TAG, "PhoneUnlockModule initialized")
        instance = this
        reactContext.addLifecycleEventListener(this)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter on the new React Native event API.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter on the new React Native event API.
    }

    override fun getName(): String {
        return "PhoneUnlockModule"
    }

    companion object {
        @Volatile
        private var pendingUnlockTime: Long? = null

        @Volatile
        private var instance: PhoneUnlockModule? = null

        fun setPendingUnlockTime(time: Long) {
            pendingUnlockTime = time
        }

        fun peekPendingUnlockTime(): Long? {
            return pendingUnlockTime
        }

        fun resetPendingUnlockTime() {
            pendingUnlockTime = null
        }

        fun emitUnlock(unlockTime: Long) {
            instance?.sendUnlockEvent(unlockTime)
        }
    }

    @ReactMethod
    fun getPendingUnlockTime(promise: Promise) {
        try {
            val time = peekPendingUnlockTime()
            if (time != null) {
                promise.resolve(time.toDouble())
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting pending unlock time", e)
            promise.reject("ERROR", "Failed to get pending unlock time: ${e.message}", e)
        }
    }

    @ReactMethod
    fun clearPendingUnlockTime() {
        resetPendingUnlockTime()
        android.util.Log.d(TAG, "Cleared pending unlock time")
    }

    @ReactMethod
    fun setApiUrl(url: String) {
        PhoneUnlockApi.setApiUrl(reactApplicationContext, url)
    }

    @ReactMethod
    fun startListening() {
        android.util.Log.d(TAG, "startListening() called")
        isListening = true
        instance = this
        try {
            val serviceIntent = Intent(reactApplicationContext, POSForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(serviceIntent)
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error starting foreground service for unlock listening", e)
        }
    }

    @ReactMethod
    fun stopListening() {
        android.util.Log.d(TAG, "stopListening() called")
        isListening = false
    }

    private fun sendUnlockEvent(unlockTime: Long) {
        try {
            setPendingUnlockTime(unlockTime)
            if (!reactApplicationContext.hasActiveReactInstance()) {
                android.util.Log.d(TAG, "React instance not active; pending unlock stored")
                return
            }
            val params = Arguments.createMap().apply {
                putDouble("unlockTime", unlockTime.toDouble())
            }
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPhoneUnlock", params)
            android.util.Log.d(TAG, "Unlock event sent to JS: $unlockTime")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error processing unlock event", e)
        }
    }

    override fun onHostResume() {
        android.util.Log.d(TAG, "onHostResume() called")
        instance = this
        if (!isListening) {
            startListening()
        }
    }

    override fun onHostPause() {
        android.util.Log.d(TAG, "onHostPause() called")
    }

    override fun onHostDestroy() {
        android.util.Log.d(TAG, "onHostDestroy() called")
        if (instance === this) {
            instance = null
        }
    }
}
