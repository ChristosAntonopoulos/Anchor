package expo.modules.distractionguard

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Process
import org.json.JSONArray
import org.json.JSONObject

/**
 * Reconstructs verified foreground usage intervals for selected packages.
 * Screen-off time is excluded via SCREEN_NON_INTERACTIVE / INTERACTIVE events.
 * Ambiguous intervals are marked uncertain and not counted toward allowance.
 */
internal object UsageAssembler {

  data class AssembledSegment(
    val packageName: String,
    val startedAtMs: Long,
    val endedAtMs: Long,
    val durationMs: Long,
    val confidence: String,
    val dedupeKey: String
  )

  fun hasUsageAccess(context: Context): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= 29) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  fun querySegments(
    context: Context,
    targetPackages: Set<String>,
    startMs: Long,
    endMs: Long
  ): List<AssembledSegment> {
    if (!hasUsageAccess(context) || endMs <= startMs || targetPackages.isEmpty()) {
      return emptyList()
    }
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return emptyList()

    val events = usm.queryEvents(startMs, endMs)
    val event = UsageEvents.Event()

    var screenInteractive = true
    var currentPkg: String? = null
    var currentStart: Long? = null
    val out = mutableListOf<AssembledSegment>()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val ts = event.timeStamp
      when (event.eventType) {
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
          flush(currentPkg, currentStart, ts, screenInteractive, out)
          currentPkg = null
          currentStart = null
          screenInteractive = false
        }
        UsageEvents.Event.SCREEN_INTERACTIVE -> {
          screenInteractive = true
        }
        UsageEvents.Event.ACTIVITY_RESUMED,
        UsageEvents.Event.MOVE_TO_FOREGROUND -> {
          if (!screenInteractive) continue
          val pkg = event.packageName ?: continue
          if (pkg !in targetPackages) {
            flush(currentPkg, currentStart, ts, true, out)
            currentPkg = null
            currentStart = null
            continue
          }
          if (currentPkg != null && currentPkg != pkg) {
            flush(currentPkg, currentStart, ts, true, out)
          }
          if (currentPkg != pkg) {
            currentPkg = pkg
            currentStart = ts
          }
        }
        UsageEvents.Event.ACTIVITY_PAUSED,
        UsageEvents.Event.ACTIVITY_STOPPED,
        UsageEvents.Event.MOVE_TO_BACKGROUND -> {
          val pkg = event.packageName
          if (pkg != null && pkg == currentPkg) {
            flush(currentPkg, currentStart, ts, screenInteractive, out)
            currentPkg = null
            currentStart = null
          }
        }
      }
    }
    // Do not invent an end for an open interval at query end — mark unfinished as uncounted.
    // Open intervals are left out until a pause/stop/non-interactive closes them.
    return out.filter { it.durationMs > 0 }
  }

  private fun flush(
    pkg: String?,
    start: Long?,
    end: Long,
    interactive: Boolean,
    out: MutableList<AssembledSegment>
  ) {
    if (pkg == null || start == null || end <= start || !interactive) return
    val duration = end - start
    // Ignore tiny flicker transitions under 800ms
    if (duration < 800) return
    out.add(
      AssembledSegment(
        packageName = pkg,
        startedAtMs = start,
        endedAtMs = end,
        durationMs = duration,
        confidence = "verified",
        dedupeKey = "$pkg:$start:$end"
      )
    )
  }

  fun installedTargetApps(context: Context, packages: List<String>): List<Map<String, Any?>> {
    val pm = context.packageManager
    return packages.map { pkg ->
      try {
        val info = if (Build.VERSION.SDK_INT >= 33) {
          pm.getApplicationInfo(pkg, PackageManager.ApplicationInfoFlags.of(0))
        } else {
          @Suppress("DEPRECATION")
          pm.getApplicationInfo(pkg, 0)
        }
        mapOf(
          "packageName" to pkg,
          "label" to pm.getApplicationLabel(info).toString(),
          "installed" to true
        )
      } catch (_: Exception) {
        mapOf(
          "packageName" to pkg,
          "label" to pkg,
          "installed" to false
        )
      }
    }
  }

  fun toJsonArray(segments: List<AssembledSegment>): JSONArray {
    val arr = JSONArray()
    for (s in segments) {
      arr.put(
        JSONObject()
          .put("packageName", s.packageName)
          .put("startedAtMs", s.startedAtMs)
          .put("endedAtMs", s.endedAtMs)
          .put("durationMs", s.durationMs)
          .put("confidence", s.confidence)
          .put("dedupeKey", s.dedupeKey)
      )
    }
    return arr
  }
}
