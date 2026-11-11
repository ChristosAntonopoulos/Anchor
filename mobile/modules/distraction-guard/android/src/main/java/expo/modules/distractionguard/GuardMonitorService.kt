package expo.modules.distractionguard

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.content.ContextCompat

/**
 * Optional specialUse FGS for periodic UsageEvents reconciliation while Guard is enabled.
 * Honest limitation: not second-perfect; uses bounded polling.
 */
class GuardMonitorService : Service() {
  private val handler = Handler(Looper.getMainLooper())
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
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  companion object {
    fun start(context: android.content.Context): Boolean {
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

    fun stop(context: android.content.Context) {
      context.stopService(Intent(context, GuardMonitorService::class.java))
    }
  }
}
