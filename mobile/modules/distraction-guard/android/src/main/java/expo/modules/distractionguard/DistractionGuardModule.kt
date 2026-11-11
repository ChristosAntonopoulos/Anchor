package expo.modules.distractionguard

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

class DistractionGuardModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DistractionGuard")

    Function("getCapabilities") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      GuardController.capabilities(context)
    }

    Function("getStatus") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      GuardController.status(context)
    }

    Function("reconcile") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      GuardController.reconcile(context)
    }

    Function("getSettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      GuardController.jsonToMap(GuardPrefs.settings(context))
    }

    Function("saveSettings") { raw: Map<String, Any?> ->
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      val json = mapToJson(raw)
      val existing = GuardPrefs.settings(context)
      val keys = json.keys()
      while (keys.hasNext()) {
        val k = keys.next()
        existing.put(k, json.get(k))
      }
      GuardPrefs.saveSettings(context, existing)
      syncMonitoring(context, existing)
      true
    }

    Function("resetSettingsKeepHistory") {
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      GuardPrefs.resetSettingsKeepHistory(context)
      GuardMonitorService.stop(context)
      true
    }

    Function("openUsageAccessSettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function
      context.startActivity(
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    Function("openOverlaySettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function
      val packageUri = Uri.parse("package:${context.packageName}")
      context.startActivity(
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, packageUri)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
    }

    Function("requestNotificationPermission") {
      val activity = appContext.currentActivity
      if (Build.VERSION.SDK_INT >= 33 && activity != null) {
        val granted = ContextCompat.checkSelfPermission(
          activity,
          Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
          activity.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4201)
        }
      }
    }

    Function("getInstalledTargets") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyList<Map<String, Any?>>()
      val settings = GuardPrefs.settings(context)
      val list = mutableListOf<String>()
      val arr = settings.optJSONArray("targetPackages") ?: JSONArray()
      for (i in 0 until arr.length()) list.add(arr.optString(i))
      if ("com.instagram.android" !in list) list.add("com.instagram.android")
      if ("com.google.android.youtube" !in list) list.add("com.google.android.youtube")
      val browsers = settings.optJSONArray("browserPackages") ?: JSONArray()
      for (i in 0 until browsers.length()) list.add(browsers.optString(i))
      UsageAssembler.installedTargetApps(context, list)
    }

    Function("startBypass") { durationSeconds: Int, endRestriction: Boolean ->
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      val settings = GuardPrefs.settings(context)
      val now = System.currentTimeMillis()
      val elapsed = GuardPrefs.elapsedRealtime()
      val cycle = PolicyEngine.ensureCycle(context, settings, now, elapsed)
      val updated = PolicyEngine.startBypass(context, cycle, durationSeconds, now, elapsed, endRestriction)
      if (endRestriction && settings.optBoolean("enabled", false) &&
        PolicyEngine.isWithinSchedule(settings, now)
      ) {
        return@Function GuardController.jsonToMap(
          PolicyEngine.startFreshAllowance(context, settings, now, elapsed)
        )
      }
      GuardController.jsonToMap(updated)
    }

    Function("saveIntentionalUse") { raw: Map<String, Any?> ->
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      val settings = GuardPrefs.settings(context)
      val now = System.currentTimeMillis()
      val elapsed = GuardPrefs.elapsedRealtime()
      val shared = settings.optBoolean("intentionalUsesSharedAllowance", true)
      val durationSeconds = (raw["durationSeconds"] as? Number)?.toInt()?.coerceIn(30, 3600) ?: 300
      val cycle = PolicyEngine.ensureCycle(context, settings, now, elapsed)

      if (settings.optBoolean("trackIntentionalSessions", true)) {
        val session = mapToJson(raw)
          .put("id", GuardPrefs.newCycleId())
          .put("startedAtMs", now)
          .put("durationSeconds", durationSeconds)
          .put("cycleId", cycle.optString("id"))
          .put("exceptionMode", if (shared) "shared_allowance" else "separate_exception")
        GuardPrefs.appendIntentional(context, session)
      }

      // Separate exception: suppress interventions for the planned window without wiping cooldown.
      if (!shared) {
        PolicyEngine.startBypass(context, cycle, durationSeconds, now, elapsed, endRestriction = false)
      }
      true
    }

    Function("recordFrictionResult") { result: String, packageName: String ->
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      GuardPrefs.appendFrictionEvent(
        context,
        JSONObject()
          .put("type", "opening_friction_result")
          .put("result", result)
          .put("packageName", packageName)
          .put("atMs", System.currentTimeMillis())
      )
      true
    }

    Function("getRecentUnlockEvents") { limit: Int ->
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyList<Map<String, Any?>>()
      GuardPrefs.unlockEvents(context, limit.coerceIn(1, 200))
    }

    Function("disableImmediately") {
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      val settings = GuardPrefs.settings(context)
      settings.put("enabled", false)
      GuardPrefs.saveSettings(context, settings)
      GuardMonitorService.stop(context)
      true
    }

    Function("clearHistory") {
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      GuardPrefs.clearHistory(context)
      true
    }

    Function("getRecentSegments") { limit: Int ->
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyList<Map<String, Any?>>()
      val arr = GuardPrefs.segments(context)
      val out = mutableListOf<Map<String, Any?>>()
      val count = minOf(limit.coerceAtLeast(1), arr.length())
      for (i in arr.length() - count until arr.length()) {
        out.add(GuardController.jsonToMap(arr.getJSONObject(i)))
      }
      out
    }

    Function("getFrictionStats") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      val events = GuardPrefs.frictionEvents(context)
      var presented = 0
      var returned = 0
      for (i in 0 until events.length()) {
        val e = events.getJSONObject(i)
        if (e.optString("type") == "opening_friction" && e.optBoolean("presented")) presented += 1
        if (e.optString("type") == "opening_friction_result" && e.optString("result") == "return") returned += 1
      }
      mapOf("presented" to presented, "returned" to returned)
    }

    Function("ensureMonitoring") {
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      syncMonitoring(context, GuardPrefs.settings(context))
    }
  }

  private fun syncMonitoring(context: android.content.Context, settings: JSONObject): Boolean {
    return if (settings.optBoolean("enabled", false) && settings.optBoolean("setupComplete", false)) {
      GuardMonitorService.start(context)
    } else {
      GuardMonitorService.stop(context)
      false
    }
  }

  private fun mapToJson(map: Map<String, Any?>): JSONObject {
    val json = JSONObject()
    for ((k, v) in map) {
      json.put(k, anyToJson(v))
    }
    return json
  }

  private fun anyToJson(value: Any?): Any {
    return when (value) {
      null -> JSONObject.NULL
      is Map<*, *> -> {
        val obj = JSONObject()
        for ((k, v) in value) {
          if (k is String) obj.put(k, anyToJson(v))
        }
        obj
      }
      is List<*> -> {
        val arr = JSONArray()
        for (item in value) arr.put(anyToJson(item))
        arr
      }
      is Int, is Long, is Double, is Float, is Boolean, is String -> value
      else -> value.toString()
    }
  }
}
