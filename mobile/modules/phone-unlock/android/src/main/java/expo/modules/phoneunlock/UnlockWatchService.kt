package expo.modules.phoneunlock

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.content.ContextCompat

class UnlockWatchService : Service() {
  private var receiverRegistered = false

  private val unlockReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == Intent.ACTION_USER_PRESENT) {
        UnlockPrompter.show(applicationContext)
      }
    }
  }

  override fun onCreate() {
    super.onCreate()
    Notifications.ensureChannels(this)
    val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
    if (Build.VERSION.SDK_INT >= 33) {
      registerReceiver(unlockReceiver, filter, RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(unlockReceiver, filter)
    }
    receiverRegistered = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    Notifications.ensureChannels(this)
    return try {
      val notification = Notifications.ongoing(this)
      if (Build.VERSION.SDK_INT >= 34) {
        startForeground(
          Notifications.ONGOING_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )
      } else {
        startForeground(Notifications.ONGOING_ID, notification)
      }
      START_STICKY
    } catch (_: Exception) {
      stopSelf()
      START_NOT_STICKY
    }
  }

  override fun onDestroy() {
    if (receiverRegistered) {
      unregisterReceiver(unlockReceiver)
      receiverRegistered = false
    }
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  companion object {
    fun start(context: Context): Boolean {
      return try {
        ContextCompat.startForegroundService(
          context,
          Intent(context, UnlockWatchService::class.java)
        )
        true
      } catch (_: Exception) {
        false
      }
    }
  }
}
