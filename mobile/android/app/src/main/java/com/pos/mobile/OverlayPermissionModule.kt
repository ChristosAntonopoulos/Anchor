package com.pos.mobile

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*

class OverlayPermissionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val reactApplicationContext: ReactApplicationContext = reactContext
    private val TAG = "OverlayPermissionModule"

    override fun getName(): String {
        return "OverlayPermissionModule"
    }

    @ReactMethod
    fun isOverlayPermissionGranted(promise: Promise) {
        try {
            val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactApplicationContext)
            } else {
                // For API < 23, overlay permission is granted by default
                true
            }
            
            android.util.Log.d(TAG, "Overlay permission granted: $granted")
            promise.resolve(granted)
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error checking overlay permission", e)
            promise.reject("ERROR", "Failed to check overlay permission: ${e.message}", e)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactApplicationContext)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${reactApplicationContext.packageName}")
                    ).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    
                    reactApplicationContext.startActivity(intent)
                    android.util.Log.d(TAG, "Opened overlay permission settings")
                    promise.resolve(true)
                } else {
                    android.util.Log.d(TAG, "Overlay permission already granted")
                    promise.resolve(true)
                }
            } else {
                // For API < 23, permission is granted by default
                promise.resolve(true)
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error requesting overlay permission", e)
            promise.reject("ERROR", "Failed to request overlay permission: ${e.message}", e)
        }
    }
}
