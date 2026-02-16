package com.pos.mobile

import android.content.Intent
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
    fun openNotificationSettings() {
        android.util.Log.d(TAG, "openNotificationSettings() called")
        try {
            android.util.Log.d(TAG, "Attempting to open notification access settings...")
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            android.util.Log.d(TAG, "Intent action: ${intent.action}")
            
            val activities = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            android.util.Log.d(TAG, "Found ${activities.size} activities that can handle the intent")
            
            if (activities.isEmpty()) {
                android.util.Log.e(TAG, "No activity found to handle ACTION_NOTIFICATION_LISTENER_SETTINGS")
                android.util.Log.e(TAG, "This might be a device-specific issue (e.g., Nothing phone custom ROM)")
                throw RuntimeException("No activity found to handle notification listener settings. This device may not support this feature.")
            }
            
            android.util.Log.d(TAG, "Starting activity to open notification settings...")
            reactApplicationContext.startActivity(intent)
            android.util.Log.d(TAG, "Successfully opened notification access settings")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error opening notification settings", e)
            android.util.Log.e(TAG, "Exception type: ${e.javaClass.simpleName}, message: ${e.message}")
            e.printStackTrace()
            // Re-throw to allow React Native to handle it
            throw RuntimeException("Failed to open notification settings: ${e.message}", e)
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
