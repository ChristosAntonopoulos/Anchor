package com.pos.mobile

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*
import com.facebook.react.bridge.LifecycleEventListener

class NotificationListenerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val reactApplicationContext: ReactApplicationContext = reactContext
    private val TAG = "NotificationListenerModule"

    init {
        android.util.Log.d(TAG, "NotificationListenerModule initialized")
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String {
        android.util.Log.d(TAG, "getName() called, returning: NotificationListenerModule")
        return "NotificationListenerModule"
    }

    @ReactMethod
    fun isNotificationServiceEnabled(promise: Promise) {
        android.util.Log.d(TAG, "isNotificationServiceEnabled() called")
        try {
            val packageName = reactApplicationContext.packageName
            android.util.Log.d(TAG, "Checking notification service for package: $packageName")
            android.util.Log.d(TAG, "Device info: Manufacturer=${Build.MANUFACTURER}, Model=${Build.MODEL}")
            
            val enabledNotificationListeners = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            )
            
            android.util.Log.d(TAG, "Enabled notification listeners string: ${if (enabledNotificationListeners.isNullOrEmpty()) "null or empty" else enabledNotificationListeners}")
            
            val isEnabled = !TextUtils.isEmpty(enabledNotificationListeners) &&
                    enabledNotificationListeners.contains(packageName)
            
            android.util.Log.d(TAG, "Notification service enabled: $isEnabled for package: $packageName")
            if (!isEnabled) {
                android.util.Log.w(TAG, "Notification service is NOT enabled. User needs to enable it in Settings.")
                if (Build.MANUFACTURER.equals("Nothing", ignoreCase = true)) {
                    android.util.Log.w(TAG, "Nothing Phone detected - may require manual navigation to settings")
                }
            }
            
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error checking notification service status", e)
            android.util.Log.e(TAG, "Exception type: ${e.javaClass.simpleName}, message: ${e.message}")
            e.printStackTrace()
            promise.reject("ERROR", "Failed to check notification service status: ${e.message}", e)
        }
    }

    @ReactMethod
    fun openNotificationSettings(promise: Promise) {
        android.util.Log.d(TAG, "openNotificationSettings() called")
        
        val packageName = reactApplicationContext.packageName
        var methodUsed = "none"
        var success = false
        
        // Method 1: Try standard notification listener settings
        try {
            android.util.Log.d(TAG, "Method 1: Attempting to open notification access settings...")
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            val activities = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            android.util.Log.d(TAG, "Found ${activities.size} activities that can handle ACTION_NOTIFICATION_LISTENER_SETTINGS")
            
            if (activities.isNotEmpty()) {
                android.util.Log.d(TAG, "Starting activity to open notification settings...")
                reactApplicationContext.startActivity(intent)
                android.util.Log.d(TAG, "Successfully opened notification access settings using standard intent")
                methodUsed = "standard"
                success = true
                promise.resolve("standard")
                return
            } else {
                android.util.Log.w(TAG, "No activity found for ACTION_NOTIFICATION_LISTENER_SETTINGS, trying fallback...")
            }
        } catch (e: Exception) {
            android.util.Log.w(TAG, "Method 1 failed: ${e.message}, trying fallback...")
        }
        
        // Method 2: Try opening app's detail settings (user can navigate to notification access from there)
        try {
            android.util.Log.d(TAG, "Method 2: Attempting to open app detail settings...")
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = Uri.parse("package:$packageName")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            val activities = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            android.util.Log.d(TAG, "Found ${activities.size} activities that can handle ACTION_APPLICATION_DETAILS_SETTINGS")
            
            if (activities.isNotEmpty()) {
                android.util.Log.d(TAG, "Starting activity to open app detail settings...")
                reactApplicationContext.startActivity(intent)
                android.util.Log.d(TAG, "Successfully opened app detail settings (user can navigate to notification access)")
                methodUsed = "app_details"
                success = true
                promise.resolve("app_details")
                return
            } else {
                android.util.Log.w(TAG, "No activity found for ACTION_APPLICATION_DETAILS_SETTINGS, trying fallback...")
            }
        } catch (e: Exception) {
            android.util.Log.w(TAG, "Method 2 failed: ${e.message}, trying fallback...")
        }
        
        // Method 3: Try opening general settings
        try {
            android.util.Log.d(TAG, "Method 3: Attempting to open general settings...")
            val intent = Intent(Settings.ACTION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            val activities = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            android.util.Log.d(TAG, "Found ${activities.size} activities that can handle ACTION_SETTINGS")
            
            if (activities.isNotEmpty()) {
                android.util.Log.d(TAG, "Starting activity to open general settings...")
                reactApplicationContext.startActivity(intent)
                android.util.Log.d(TAG, "Successfully opened general settings (user must navigate manually)")
                methodUsed = "general"
                success = true
                promise.resolve("general")
                return
            }
        } catch (e: Exception) {
            android.util.Log.w(TAG, "Method 3 failed: ${e.message}")
        }
        
        // All methods failed
        android.util.Log.e(TAG, "All methods failed to open settings")
        android.util.Log.e(TAG, "Device manufacturer: ${Build.MANUFACTURER}, Model: ${Build.MODEL}")
        promise.reject("SETTINGS_OPEN_FAILED", "Could not open notification settings. Please navigate manually: Settings → Apps → Special app access → Notification access")
    }
    
    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val deviceInfo = Arguments.createMap().apply {
                putString("manufacturer", Build.MANUFACTURER)
                putString("model", Build.MODEL)
                putString("brand", Build.BRAND)
                putString("device", Build.DEVICE)
                putInt("sdkInt", Build.VERSION.SDK_INT)
            }
            promise.resolve(deviceInfo)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting device info", e)
            promise.reject("ERROR", "Failed to get device info: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getActiveNotifications(promise: Promise) {
        android.util.Log.d(TAG, "getActiveNotifications() called")
        try {
            val service = POSNotificationListenerService.getInstance()
            if (service == null) {
                android.util.Log.w(TAG, "Notification service not initialized")
                promise.reject("SERVICE_NOT_READY", "Notification service not initialized")
                return
            }

            android.util.Log.d(TAG, "Getting active notifications from service...")
            val activeNotifications = service.activeNotifications
            android.util.Log.d(TAG, "Found ${activeNotifications.size} active notifications")
            
            val notificationsArray = Arguments.createArray()

            for (sbn in activeNotifications) {
                try {
                    val notificationMap = service.extractNotificationData(sbn)
                    notificationsArray.pushMap(notificationMap)
                } catch (e: Exception) {
                    // Log error but continue with other notifications
                    android.util.Log.e(TAG, "Error extracting notification data for package: ${sbn.packageName}", e)
                }
            }

            android.util.Log.d(TAG, "Returning ${notificationsArray.size()} notifications")
            promise.resolve(notificationsArray)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting active notifications", e)
            android.util.Log.e(TAG, "Exception type: ${e.javaClass.simpleName}, message: ${e.message}")
            e.printStackTrace()
            promise.reject("ERROR", "Failed to get active notifications: ${e.message}", e)
        }
    }

    override fun onHostResume() {
        android.util.Log.d(TAG, "onHostResume() called")
        // Service will be initialized when ReactContext is ready
        val service = POSNotificationListenerService.getInstance()
        if (service != null) {
            android.util.Log.d(TAG, "Setting ReactContext on notification service")
            service.setReactContext(reactApplicationContext)
        } else {
            android.util.Log.w(TAG, "Notification service instance is null in onHostResume()")
        }
    }

    override fun onHostPause() {
        android.util.Log.d(TAG, "onHostPause() called")
        // No action needed
    }

    override fun onHostDestroy() {
        android.util.Log.d(TAG, "onHostDestroy() called")
        // No action needed
    }
}
