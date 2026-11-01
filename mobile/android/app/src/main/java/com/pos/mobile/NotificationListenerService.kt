package com.pos.mobile

import android.app.NotificationManager
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream

class POSNotificationListenerService : NotificationListenerService() {
    private var reactContext: ReactApplicationContext? = null

    fun setReactContext(context: ReactApplicationContext) {
        this.reactContext = context
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        try {
            val data = extractNotificationData(sbn)
            val packageName = sbn.packageName ?: ""
            val appName = data.getString("appName")
            
            // Send event to React Native
            sendEventToReactNative("onNotificationPosted", data)
            
            Log.d(TAG, "Notification received: $packageName ($appName) - ${data.getString("title")}: ${data.getString("text")}")
        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }
    
    private fun getAppName(packageName: String): String? {
        return try {
            val packageManager = applicationContext.packageManager
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            Log.w(TAG, "Could not get app name for $packageName", e)
            null
        }
    }
    
    private fun getAppIconBase64(packageName: String): String? {
        return try {
            val packageManager = applicationContext.packageManager
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            val icon = packageManager.getApplicationIcon(appInfo)
            drawableToBase64(icon)
        } catch (e: Exception) {
            Log.w(TAG, "Could not get app icon for $packageName", e)
            null
        }
    }
    
    private fun getChannelName(channelId: String?, packageName: String): String? {
        if (channelId == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return null
        }
        
        return try {
            val notificationManager = getSystemService(NotificationManager::class.java)
            val channel = notificationManager?.getNotificationChannel(channelId)
            channel?.name?.toString()
        } catch (e: Exception) {
            Log.w(TAG, "Could not get channel name for $channelId", e)
            null
        }
    }
    
    private fun extractActions(notification: android.app.Notification): WritableArray? {
        val actions = notification.actions
        if (actions == null || actions.isEmpty()) {
            return null
        }
        
        val actionsArray = Arguments.createArray()
        for (action in actions) {
            val actionMap = Arguments.createMap().apply {
                putString("title", action.title?.toString() ?: "")
                // Note: Intent extraction is complex and may not be serializable
                // We'll skip intent data for now
            }
            actionsArray.pushMap(actionMap)
        }
        
        return actionsArray
    }
    
    private fun drawableToBase64(drawable: Drawable): String? {
        return try {
            val bitmap = if (drawable is android.graphics.drawable.BitmapDrawable) {
                drawable.bitmap
            } else {
                // Convert drawable to bitmap
                val width = drawable.intrinsicWidth.coerceAtLeast(1)
                val height = drawable.intrinsicHeight.coerceAtLeast(1)
                val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                val canvas = android.graphics.Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                bitmap
            }
            bitmapToBase64(bitmap)
        } catch (e: Exception) {
            Log.w(TAG, "Could not convert drawable to base64", e)
            null
        }
    }
    
    private fun bitmapToBase64(bitmap: Bitmap): String? {
        return try {
            // Compress bitmap to reduce size (max 200KB)
            val outputStream = ByteArrayOutputStream()
            var quality = 90
            bitmap.compress(Bitmap.CompressFormat.PNG, quality, outputStream)
            
            // If still too large, reduce quality
            while (outputStream.toByteArray().size > 200 * 1024 && quality > 10) {
                outputStream.reset()
                quality -= 10
                bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            }
            
            val byteArray = outputStream.toByteArray()
            Base64.encodeToString(byteArray, Base64.NO_WRAP)
        } catch (e: Exception) {
            Log.w(TAG, "Could not convert bitmap to base64", e)
            null
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        
        val data = Arguments.createMap().apply {
            putString("packageName", sbn.packageName ?: "")
            putString("id", "${sbn.id}")
        }
        
        sendEventToReactNative("onNotificationRemoved", data)
    }

    private fun sendEventToReactNative(eventName: String, data: WritableMap) {
        reactContext?.let { context ->
            try {
                val eventEmitter = context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                eventEmitter.emit(eventName, data)
            } catch (e: Exception) {
                Log.e(TAG, "Error sending event to React Native", e)
            }
        } ?: run {
            // Store notification for later if ReactContext is not ready
            Log.d(TAG, "ReactContext not ready, storing notification: $eventName")
        }
    }

    /**
     * Extract notification data to WritableMap (helper function)
     */
    fun extractNotificationData(sbn: StatusBarNotification): WritableMap {
        val notification = sbn.notification
        val extras = notification.extras
        val packageName = sbn.packageName ?: ""
        
        // Extract core notification data
        val title = extras?.getCharSequence("android.title")?.toString() ?: ""
        val text = extras?.getCharSequence("android.text")?.toString() ?: ""
        val subText = extras?.getCharSequence("android.subText")?.toString() ?: ""
        val postTime = sbn.postTime
        val tag = sbn.tag ?: ""
        
        // Extract rich metadata
        val appName = getAppName(packageName)
        val appIcon = getAppIconBase64(packageName)
        val largeText = extras?.getCharSequence("android.bigText")?.toString()
        val bigPicture = extras?.getParcelable<Bitmap>("android.bigPicture")?.let { bitmapToBase64(it) }
        val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            notification.channelId
        } else {
            null
        }
        val channelName = getChannelName(channelId, packageName)
        val priority = notification.priority
        val importance = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && channelId != null) {
            try {
                val notificationManager = getSystemService(NotificationManager::class.java)
                val channel = notificationManager?.getNotificationChannel(channelId)
                val importanceValue = channel?.importance
                when (importanceValue) {
                    NotificationManager.IMPORTANCE_NONE -> "none"
                    NotificationManager.IMPORTANCE_MIN -> "min"
                    NotificationManager.IMPORTANCE_LOW -> "low"
                    NotificationManager.IMPORTANCE_DEFAULT -> "default"
                    NotificationManager.IMPORTANCE_HIGH -> "high"
                    else -> "default"
                }
            } catch (e: Exception) {
                Log.w(TAG, "Could not get notification importance", e)
                null
            }
        } else {
            null
        }
        
        // Extract actions
        val actions = extractActions(notification)
        
        // Extract grouping keys
        val groupKey = extras?.getString("android.groupKey")
        val sortKey = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            extras?.getString("android.sortKey")
        } else {
            null
        }
        
        // Create data map
        return Arguments.createMap().apply {
            // Core data
            putString("title", title)
            putString("text", text)
            putString("subText", subText)
            putString("packageName", packageName)
            putDouble("postTime", postTime.toDouble())
            putString("tag", tag)
            putString("id", "${sbn.id}")
            
            // Rich metadata
            appName?.let { putString("appName", it) }
            appIcon?.let { putString("appIcon", it) }
            largeText?.let { putString("largeText", it) }
            bigPicture?.let { putString("bigPicture", it) }
            channelId?.let { putString("channelId", it) }
            channelName?.let { putString("channelName", it) }
            putInt("priority", priority)
            importance?.let { putString("importance", it) }
            actions?.let { putArray("actions", it) }
            groupKey?.let { putString("groupKey", it) }
            sortKey?.let { putString("sortKey", it) }
        }
    }

    companion object {
        private const val TAG = "POSNotificationListener"
        private var instance: POSNotificationListenerService? = null

        fun getInstance(): POSNotificationListenerService? = instance

        fun setInstance(service: POSNotificationListenerService?) {
            instance = service
        }
    }

    override fun onCreate() {
        super.onCreate()
        setInstance(this)
        Log.d(TAG, "NotificationListenerService created")
    }

    override fun onDestroy() {
        super.onDestroy()
        setInstance(null)
        Log.d(TAG, "NotificationListenerService destroyed")
    }
}
