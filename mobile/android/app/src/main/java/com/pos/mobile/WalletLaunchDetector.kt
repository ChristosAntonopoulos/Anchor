package com.pos.mobile

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings

object WalletLaunchDetector {
    private const val TAG = "WalletLaunchDetector"

    fun isUsageAccessGranted(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName,
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun requestUsageAccess(context: Context) {
        val flags = Intent.FLAG_ACTIVITY_NEW_TASK
        val targeted = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            data = Uri.parse("package:${context.packageName}")
            addFlags(flags)
        }
        try {
            context.startActivity(targeted)
        } catch (_: Exception) {
            context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(flags))
        }
    }

    fun isWalletLaunch(context: Context, sinceMs: Long): Boolean {
        if (!isUsageAccessGranted(context)) {
            return false
        }
        return try {
            val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val now = System.currentTimeMillis()
            val events = manager.queryEvents((sinceMs - 2_000L).coerceAtLeast(0L), now + 50L)
            val event = UsageEvents.Event()
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (!isResumeEvent(event.eventType)) {
                    continue
                }
                if (isWallet(event.packageName, event.className)) {
                    android.util.Log.d(
                        TAG,
                        "Wallet/Cards launch ${event.packageName} ${event.className}",
                    )
                    return true
                }
            }
            false
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not read usage events", error)
            false
        }
    }

    fun isWallet(packageName: String?, className: String?): Boolean {
        val pkg = packageName.orEmpty().lowercase()
        val cls = className.orEmpty().lowercase()
        if (pkg.contains("walletnfcrel") ||
            pkg.contains("tapandpay") ||
            pkg.contains("nbu.paisa") ||
            pkg.contains("quickaccesswallet") ||
            pkg.contains("nothing.wallet") ||
            pkg.contains("nothing.cards") ||
            pkg.endsWith(".spay") ||
            pkg.contains("spaylite")
        ) {
            return true
        }
        if (cls.contains("wallet") ||
            cls.contains("tapandpay") ||
            cls.contains("quickaccesswallet") ||
            cls.contains("paymentcard")
        ) {
            return true
        }
        return false
    }

    private fun isResumeEvent(type: Int): Boolean {
        if (type == UsageEvents.Event.MOVE_TO_FOREGROUND) {
            return true
        }
        return Build.VERSION.SDK_INT >= 29 && type == UsageEvents.Event.ACTIVITY_RESUMED
    }
}
