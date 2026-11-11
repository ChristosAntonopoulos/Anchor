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
 * Screen-off time is excluded. Open intervals are returned separately as provisional.
 */
internal object UsageAssembler {

  data class AssembledSegment(
    val packageName: String,
    val startedAtMs: Long,
    val endedAtMs: Long,
    val durationMs: Long,
    val confidence: String,
    val dedupeKey: String,
    val closed: Boolean
  )

  data class QueryResult(
    val closedSegments: List<AssembledSegment>,
    val openProvisional: AssembledSegment?
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
  ): QueryResult {
    if (!hasUsageAccess(context) || endMs <= startMs || targetPackages.isEmpty()) {
      return QueryResult(emptyList(), null)
    }
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
      ?: return QueryResult(emptyList(), null)

    // Seed screen/foreground state from a lookback so mid-window SCREEN_NON_INTERACTIVE is correct.
    val seedStart = (startMs - 120_000L).coerceAtLeast(endMs - 6 * 60 * 60 * 1000L)
    val seedEvents = usm.queryEvents(seedStart, startMs)
    val seedEvent = UsageEvents.Event()
    var screenInteractive = true
    var currentPkg: String? = null
    var currentStart: Long? = null
    while (seedEvents.hasNextEvent()) {
      seedEvents.getNextEvent(seedEvent)
      when (seedEvent.eventType) {
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
          screenInteractive = false
          currentPkg = null
          currentStart = null
        }
        UsageEvents.Event.SCREEN_INTERACTIVE -> screenInteractive = true
        UsageEvents.Event.ACTIVITY_RESUMED,
        UsageEvents.Event.MOVE_TO_FOREGROUND -> {
          val pkg = seedEvent.packageName
          if (screenInteractive && pkg != null && pkg in targetPackages) {
            currentPkg = pkg
            currentStart = seedEvent.timeStamp.coerceAtLeast(startMs)
          } else {
            currentPkg = null
            currentStart = null
          }
        }
        UsageEvents.Event.ACTIVITY_PAUSED,
        UsageEvents.Event.ACTIVITY_STOPPED,
        UsageEvents.Event.MOVE_TO_BACKGROUND -> {
          if (seedEvent.packageName == currentPkg) {
            currentPkg = null
            currentStart = null
          }
        }
      }
    }

    val events = usm.queryEvents(startMs, endMs)
    val event = UsageEvents.Event()
    val out = mutableListOf<AssembledSegment>()

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val ts = event.timeStamp
      when (event.eventType) {
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
          flush(currentPkg, currentStart, ts, screenInteractive, out, closed = true)
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
            flush(currentPkg, currentStart, ts, true, out, closed = true)
            currentPkg = null
            currentStart = null
            continue
          }
          if (currentPkg != null && currentPkg != pkg) {
            flush(currentPkg, currentStart, ts, true, out, closed = true)
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
            flush(currentPkg, currentStart, ts, screenInteractive, out, closed = true)
            currentPkg = null
            currentStart = null
          }
        }
      }
    }

    val open = if (currentPkg != null && currentStart != null && screenInteractive) {
      val duration = endMs - currentStart
      if (duration >= 800) {
        AssembledSegment(
          packageName = currentPkg,
          startedAtMs = currentStart,
          endedAtMs = endMs,
          durationMs = duration,
          confidence = "provisional",
          dedupeKey = "$currentPkg:$currentStart:open",
          closed = false
        )
      } else null
    } else null

    return QueryResult(out.filter { it.durationMs > 0 }, open)
  }

  private fun flush(
    pkg: String?,
    start: Long?,
    end: Long,
    interactive: Boolean,
    out: MutableList<AssembledSegment>,
    closed: Boolean
  ) {
    if (pkg == null || start == null || end <= start || !interactive) return
    val duration = end - start
    if (duration < 800) return
    out.add(
      AssembledSegment(
        packageName = pkg,
        startedAtMs = start,
        endedAtMs = end,
        durationMs = duration,
        confidence = "verified",
        dedupeKey = "$pkg:$start:$end",
        closed = closed
      )
    )
  }

  fun installedTargetApps(context: Context, packages: List<String>): List<Map<String, Any?>> {
    val pm = context.packageManager
    return packages.distinct().map { pkg ->
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

  fun toJson(segment: AssembledSegment): JSONObject =
    JSONObject()
      .put("packageName", segment.packageName)
      .put("startedAtMs", segment.startedAtMs)
      .put("endedAtMs", segment.endedAtMs)
      .put("durationMs", segment.durationMs)
      .put("confidence", segment.confidence)
      .put("dedupeKey", segment.dedupeKey)
      .put("closed", segment.closed)
}
