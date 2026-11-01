package com.pos.mobile

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ForegroundServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ForegroundServiceModule"
    }

    @ReactMethod
    fun startService(promise: Promise) {
        try {
            val serviceIntent = Intent(reactApplicationContext, POSForegroundService::class.java)
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(serviceIntent)
            } else {
                reactApplicationContext.startService(serviceIntent)
            }
            android.util.Log.d("ForegroundServiceModule", "Service started from React Native")
            promise.resolve(true)
        } catch (e: Exception) {
            android.util.Log.e("ForegroundServiceModule", "Error starting service", e)
            promise.reject("SERVICE_ERROR", "Failed to start service: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            val serviceIntent = Intent(reactApplicationContext, POSForegroundService::class.java)
            reactApplicationContext.stopService(serviceIntent)
            android.util.Log.d("ForegroundServiceModule", "Service stopped from React Native")
            promise.resolve(true)
        } catch (e: Exception) {
            android.util.Log.e("ForegroundServiceModule", "Error stopping service", e)
            promise.reject("SERVICE_ERROR", "Failed to stop service: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            // Check if service is running by checking if the service process is active
            // This is a simple check - in production you might want a more robust solution
            val activityManager = reactApplicationContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            val runningServices = activityManager.getRunningServices(Integer.MAX_VALUE)
            val isRunning = runningServices.any { 
                it.service.className == POSForegroundService::class.java.name 
            }
            promise.resolve(isRunning)
        } catch (e: Exception) {
            android.util.Log.e("ForegroundServiceModule", "Error checking service status", e)
            promise.reject("SERVICE_ERROR", "Failed to check service status: ${e.message}", e)
        }
    }
}
