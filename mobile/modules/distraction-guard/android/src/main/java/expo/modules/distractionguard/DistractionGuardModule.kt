package expo.modules.distractionguard

import android.content.Intent
import android.net.Uri
import android.provider.Settings
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
      GuardController.reconcile(context)
    }

    Function("reconcile") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      GuardController.reconcile(context)
    }

    Function("getSettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      jsonToMap(GuardPrefs.settings(context))
    }

    Function("saveSettings") { raw: Map<String, Any?> ->
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      val json = mapToJson(raw)
      // Preserve unknown keys from existing
      val existing = GuardPrefs.settings(context)
      val keys = json.keys()
      while (keys.hasNext()) {
        val k = keys.next()
        existing.put(k, json.get(k))
      }
      GuardPrefs.saveSettings(context, existing)
      if (existing.optBoolean("enabled", false) && existing.optBoolean("setupComplete", false)) {
        GuardMonitorService.start(context)
      } else {
        GuardMonitorService.stop(context)
      }
      true
    }

    Function("openUsageAccessSettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function
      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("openOverlaySettings") {
      val context = appContext.reactContext?.applicationContext ?: return@Function
      val packageUri = Uri.parse("package:${context.packageName}")
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, packageUri)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("getInstalledTargets") {
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyList<Map<String, Any?>>()
      val settings = GuardPrefs.settings(context)
      val arr = settings.optJSONArray("targetPackages") ?: JSONArray()
      val list = mutableListOf<String>()
      for (i in 0 until arr.length()) list.add(arr.optString(i))
      // Always include defaults for discovery
      if ("com.instagram.android" !in list) list.add("com.instagram.android")
      if ("com.google.android.youtube" !in list) list.add("com.google.android.youtube")
      UsageAssembler.installedTargetApps(context, list)
    }

    Function("startBypass") { durationSeconds: Int, endRestriction: Boolean ->
      val context = appContext.reactContext?.applicationContext ?: return@Function emptyMap<String, Any?>()
      val settings = GuardPrefs.settings(context)
      val now = System.currentTimeMillis()
      val elapsed = GuardPrefs.elapsedRealtime()
      val cycle = PolicyEngine.ensureCycle(context, settings, now, elapsed)
      val updated = PolicyEngine.startBypass(context, cycle, durationSeconds, now, elapsed, endRestriction)
      if (endRestriction && settings.optBoolean("enabled", false)) {
        PolicyEngine.startFreshAllowance(context, settings, now, elapsed)
      }
      jsonToMap(updated)
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
        out.add(jsonToMap(arr.getJSONObject(i)))
      }
      out
    }

    Function("ensureMonitoring") {
      val context = appContext.reactContext?.applicationContext ?: return@Function false
      val settings = GuardPrefs.settings(context)
      if (settings.optBoolean("enabled", false) && settings.optBoolean("setupComplete", false)) {
        GuardMonitorService.start(context)
      } else {
        false
      }
    }
  }

  private fun jsonToMap(json: JSONObject): Map<String, Any?> {
    val map = mutableMapOf<String, Any?>()
    val keys = json.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = json.get(key)
      map[key] = when (value) {
        is JSONObject -> jsonToMap(value)
        is JSONArray -> {
          val list = mutableListOf<Any?>()
          for (i in 0 until value.length()) {
            val item = value.get(i)
            list.add(if (item is JSONObject) jsonToMap(item) else if (item == JSONObject.NULL) null else item)
          }
          list
        }
        JSONObject.NULL -> null
        else -> value
      }
    }
    return map
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
