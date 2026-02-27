package com.pos.mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.app.NotificationCompat
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

    companion object {
        @Volatile
        private var pendingUnlockTime: Long? = null

        fun setPendingUnlockTime(time: Long) {
            pendingUnlockTime = time
        }

        fun getPendingUnlockTime(): Long? {
            return pendingUnlockTime
        }

        fun clearPendingUnlockTime() {
            pendingUnlockTime = null
        }
    }

    @ReactMethod
    fun getPendingUnlockTime(promise: Promise) {
        try {
            val time = getPendingUnlockTime()
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
        clearPendingUnlockTime()
        android.util.Log.d(TAG, "Cleared pending unlock time")
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
            // Store unlock time for when app opens
            setPendingUnlockTime(unlockTime)
            
            // Show notification
            showUnlockNotification(unlockTime)
            
            // Also send event to React Native (for when app is already in foreground)
            val params = Arguments.createMap().apply {
                putDouble("unlockTime", unlockTime.toDouble())
            }

            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onPhoneUnlock", params)
            
            android.util.Log.d(TAG, "Unlock event processed: $unlockTime")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error processing unlock event", e)
        }
    }

    private fun showUnlockNotification(unlockTime: Long) {
        try {
            val context = reactApplicationContext.applicationContext
            val channelId = "phone_unlock_channel"
            val notificationId = 1001
            
            // Create notification channel (required for Android 8.0+)
            createNotificationChannel(channelId, "Phone Unlock", "Notifications for phone unlock events")
            
            // Create intent to open app
            val intent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("unlockTime", unlockTime)
                putExtra("showUnlockModal", true)
            }
            
            val pendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            
            // Build notification
            val notification = NotificationCompat.Builder(context, channelId)
                .setContentTitle("Why did you unlock your phone?")
                .setContentText("Tap to record your reason")
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .build()
            
            // Show notification
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.notify(notificationId, notification)
            
            android.util.Log.d(TAG, "Unlock notification shown: $unlockTime")
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error showing unlock notification", e)
        }
    }

    private fun createNotificationChannel(channelId: String, channelName: String, description: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                this.description = description
                setShowBadge(true)
            }
            
            val notificationManager = reactApplicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
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
