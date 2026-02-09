package com.pos.mobile

import android.content.Intent
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*
import com.facebook.react.bridge.LifecycleEventListener

class NotificationListenerModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private val reactApplicationContext: ReactApplicationContext = reactContext

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String {
        return "NotificationListenerModule"
    }

    @ReactMethod
    fun isNotificationServiceEnabled(promise: Promise) {
        try {
            val enabledNotificationListeners = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                "enabled_notification_listeners"
            )
            val packageName = reactApplicationContext.packageName
            
            val isEnabled = !TextUtils.isEmpty(enabledNotificationListeners) &&
                    enabledNotificationListeners.contains(packageName)
            
            android.util.Log.d("NotificationListenerModule", "Notification service enabled: $isEnabled for package: $packageName")
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            android.util.Log.e("NotificationListenerModule", "Error checking notification service status", e)
            promise.reject("ERROR", "Failed to check notification service status: ${e.message}", e)
        }
    }

    @ReactMethod
    fun openNotificationSettings() {
        try {
            android.util.Log.d("NotificationListenerModule", "Attempting to open notification access settings...")
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            
            val activities = reactApplicationContext.packageManager.queryIntentActivities(intent, 0)
            if (activities.isEmpty()) {
                android.util.Log.e("NotificationListenerModule", "No activity found to handle ACTION_NOTIFICATION_LISTENER_SETTINGS")
                return
            }
            
            reactApplicationContext.startActivity(intent)
            android.util.Log.d("NotificationListenerModule", "Successfully opened notification access settings")
        } catch (e: Exception) {
            android.util.Log.e("NotificationListenerModule", "Error opening notification settings", e)
            // Re-throw to allow React Native to handle it
            throw RuntimeException("Failed to open notification settings: ${e.message}", e)
        }
    }

    @ReactMethod
    fun getActiveNotifications(promise: Promise) {
        try {
            val service = POSNotificationListenerService.getInstance()
            if (service == null) {
                promise.reject("SERVICE_NOT_READY", "Notification service not initialized")
                return
            }

            val activeNotifications = service.activeNotifications
            val notificationsArray = Arguments.createArray()

            for (sbn in activeNotifications) {
                try {
                    val notificationMap = service.extractNotificationData(sbn)
                    notificationsArray.pushMap(notificationMap)
                } catch (e: Exception) {
                    // Log error but continue with other notifications
                    android.util.Log.e("NotificationListenerModule", "Error extracting notification data", e)
                }
            }

            promise.resolve(notificationsArray)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get active notifications", e)
        }
    }

    override fun onHostResume() {
        // Service will be initialized when ReactContext is ready
        val service = POSNotificationListenerService.getInstance()
        service?.setReactContext(reactApplicationContext)
    }

    override fun onHostPause() {
        // No action needed
    }

    override fun onHostDestroy() {
        // No action needed
    }
}
