package com.pos.mobile

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import com.facebook.react.bridge.*
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.modules.core.DeviceEventManagerModule

class PhoneUnlockModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val reactApplicationContext: ReactApplicationContext = reactContext
    private val TAG = "PhoneUnlockModule"
    private var unlockReceiver: BroadcastReceiver? = null
    private var isListening = false

    init {
        android.util.Log.d(TAG, "PhoneUnlockModule initialized")
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String {
        return "PhoneUnlockModule"
    }

    @ReactMethod
    fun startListening() {
        android.util.Log.d(TAG, "startListening() called")
        
        if (isListening) {
            android.util.Log.d(TAG, "Already listening, skipping")
            return
        }

        try {
            unlockReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    if (intent?.action == Intent.ACTION_USER_PRESENT) {
                        android.util.Log.d(TAG, "Phone unlock detected - ACTION_USER_PRESENT")
                        val unlockTime = System.currentTimeMillis()
                        
                        // Send event to React Native
                        sendUnlockEvent(unlockTime)
                    }
                }
            }

            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_USER_PRESENT)
            }

            reactApplicationContext.registerReceiver(unlockReceiver, filter)
            isListening = true
            android.util.Log.d(TAG, "Successfully registered unlock receiver")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error registering unlock receiver", e)
            isListening = false
        }
    }

    @ReactMethod
    fun stopListening() {
        android.util.Log.d(TAG, "stopListening() called")
        
        if (!isListening) {
            android.util.Log.d(TAG, "Not listening, skipping")
            return
        }

        try {
            unlockReceiver?.let {
                reactApplicationContext.unregisterReceiver(it)
                android.util.Log.d(TAG, "Successfully unregistered unlock receiver")
            }
            unlockReceiver = null
            isListening = false
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error unregistering unlock receiver", e)
        }
    }

    private fun sendUnlockEvent(unlockTime: Long) {
        try {
            // Bring app to foreground
            bringAppToForeground()
            
            val params = Arguments.createMap().apply {
                putDouble("unlockTime", unlockTime.toDouble())
            }

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPhoneUnlock", params)
            
            android.util.Log.d(TAG, "Unlock event sent to React Native: $unlockTime")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error sending unlock event to React Native", e)
        }
    }

    private fun bringAppToForeground() {
        try {
            val context = reactApplicationContext.applicationContext
            val intent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            context.startActivity(intent)
            android.util.Log.d(TAG, "Brought app to foreground")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error bringing app to foreground", e)
        }
    }

    override fun onHostResume() {
        android.util.Log.d(TAG, "onHostResume() called")
        // Auto-start listening when app resumes
        if (!isListening) {
            startListening()
        }
    }

    override fun onHostPause() {
        android.util.Log.d(TAG, "onHostPause() called")
        // Keep listening even when paused (we want to detect unlocks)
    }

    override fun onHostDestroy() {
        android.util.Log.d(TAG, "onHostDestroy() called")
        stopListening()
    }
}
