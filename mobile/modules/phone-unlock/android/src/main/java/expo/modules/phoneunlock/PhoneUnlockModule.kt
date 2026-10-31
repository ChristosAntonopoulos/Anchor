package expo.modules.phoneunlock

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PhoneUnlockModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PhoneUnlock")

    Function("getStatus") {
      val context = appContext.reactContext?.applicationContext
      if (context == null) {
        mapOf(
          "enabled" to false,
          "overlayGranted" to false,
          "notificationsGranted" to false,
          "lastChoice" to ""
        )
      } else {
        mapOf(
          "enabled" to Prefs.isEnabled(context),
          "overlayGranted" to Settings.canDrawOverlays(context),
          "notificationsGranted" to notificationsGranted(context),
          "lastChoice" to Prefs.lastChoice(context)
        )
      }
    }

    Function("setEnabled") { enabled: Boolean ->
      val context = appContext.reactContext?.applicationContext
      if (context == null) {
        false
      } else {
        Prefs.setEnabled(context, enabled)
        if (!enabled) {
          context.stopService(Intent(context, UnlockWatchService::class.java))
          true
        } else {
          UnlockWatchService.start(context)
        }
      }
    }

    Function("ensureRunning") {
      val context = appContext.reactContext?.applicationContext
      if (context != null && Prefs.isEnabled(context)) {
        UnlockWatchService.start(context)
      }
    }

    Function("openOverlaySettings") {
      val context = appContext.reactContext?.applicationContext
      if (context != null) {
        val packageUri = Uri.parse("package:${context.packageName}")
        val overlay = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, packageUri).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
          context.startActivity(overlay)
        } catch (_: Exception) {
          val details = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(details)
        }
      }
    }

    Function("requestNotificationPermission") {
      val activity = appContext.currentActivity
      if (Build.VERSION.SDK_INT >= 33 && activity != null) {
        val granted = ContextCompat.checkSelfPermission(
          activity,
          Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
          activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4101)
        }
      }
    }
  }

  private fun notificationsGranted(context: android.content.Context): Boolean {
    if (Build.VERSION.SDK_INT < 33) {
      return true
    }
    return ContextCompat.checkSelfPermission(
      context,
      Manifest.permission.POST_NOTIFICATIONS
    ) == PackageManager.PERMISSION_GRANTED
  }
}
