package expo.modules.distractionguard

import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.content.ContextCompat

/**
 * Optional specialUse FGS for periodic UsageEvents reconciliation while Guard is enabled.
 * Also records USER_PRESENT for unlock→distraction associations without depending on
 * the unlock-prompt feature being enabled (same Android signal, Guard-owned log).
 */
class GuardMonitorService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var receiverRegistered = false

  private val unlockReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == Intent.ACTION_USER_PRESENT) {
        GuardPrefs.recordUnlockEvent(applicationContext)
      }
    }
  }

  private val tick = object : Runnable {
    override fun run() {
      try {
        GuardController.reconcile(applicationContext)
      } catch (_: Exception) {
      }
      handler.postDelayed(this, 20_000L)
    }
  }

  override fun onCreate() {
    super.onCreate()
    GuardNotifications.ensureChannels(this)
    val filter = IntentFilter(Intent.ACTION_USER_PRESENT)
    if (Build.VERSION.SDK_INT >= 33) {
      registerReceiver(unlockReceiver, filter, RECEIVER_NOT_EXPORTED)
    } else {
      registerReceiver(unlockReceiver, filter)
    }
    receiverRegistered = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    return try {
      val notification = GuardNotifications.ongoing(this)
      if (Build.VERSION.SDK_INT >= 34) {
        startForeground(
          GuardNotifications.MONITOR_ID,
          notification,
          ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
        )
      } else {
        startForeground(GuardNotifications.MONITOR_ID, notification)
      }
      handler.removeCallbacks(tick)
      handler.post(tick)
      START_STICKY
    } catch (_: Exception) {
      stopSelf()
      START_NOT_STICKY
    }
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
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
          Intent(context, GuardMonitorService::class.java)
        )
        true
      } catch (_: Exception) {
        false
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, GuardMonitorService::class.java))
    }
  }
}
