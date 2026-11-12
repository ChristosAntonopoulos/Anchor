package com.pos.mobile

import android.content.Context
import org.json.JSONObject

object MorningModeStore {
    private const val PREFS = "pos_morning_mode"
    private const val KEY_GATE = "gate"
    private const val KEY_SESSION = "sessionJson"
    private const val KEY_PENDING = "pendingOpen"
    private const val KEY_PIN = "pinEnabled"

    @Synchronized
    fun gate(context: Context): MorningModeLogic.Gate? {
        val raw = prefs(context).getString(KEY_GATE, null) ?: return null
        return try {
            val json = JSONObject(raw)
            MorningModeLogic.Gate(
                localDate = json.optString("localDate"),
                timezone = json.optString("timezone"),
                status = json.optString("status"),
                firstEligibleUnlockAtMs = json.optLong("firstEligibleUnlockAtMs").takeIf { json.has("firstEligibleUnlockAtMs") && !json.isNull("firstEligibleUnlockAtMs") },
                activationAtMs = json.optLong("activationAtMs").takeIf { json.has("activationAtMs") && !json.isNull("activationAtMs") },
                pinEnabled = json.optBoolean("pinEnabled", prefs(context).getBoolean(KEY_PIN, false)),
            )
        } catch (_: Exception) {
            null
        }
    }

    @Synchronized
    fun saveGate(context: Context, gate: MorningModeLogic.Gate) {
        val json = JSONObject()
            .put("localDate", gate.localDate)
            .put("timezone", gate.timezone)
            .put("status", gate.status)
            .put("pinEnabled", gate.pinEnabled)
        if (gate.firstEligibleUnlockAtMs != null) json.put("firstEligibleUnlockAtMs", gate.firstEligibleUnlockAtMs)
        if (gate.activationAtMs != null) json.put("activationAtMs", gate.activationAtMs)
        prefs(context).edit()
            .putString(KEY_GATE, json.toString())
            .putBoolean(KEY_PIN, gate.pinEnabled)
            .apply()
    }

    @Synchronized
    fun sessionJson(context: Context): String? {
        return prefs(context).getString(KEY_SESSION, null)
    }

    @Synchronized
    fun saveSessionJson(context: Context, json: String?) {
        prefs(context).edit().putString(KEY_SESSION, json).apply()
        if (json.isNullOrBlank()) return
        try {
            val parsed = JSONObject(json)
            val current = gate(context)
            saveGate(
                context,
                MorningModeLogic.Gate(
                    localDate = parsed.optString("localDate", current?.localDate ?: MorningModeLogic.localDate(System.currentTimeMillis())),
                    timezone = parsed.optString("timezone", current?.timezone ?: java.util.TimeZone.getDefault().id),
                    status = parsed.optString("status", current?.status ?: MorningModeLogic.WAITING),
                    firstEligibleUnlockAtMs = current?.firstEligibleUnlockAtMs,
                    activationAtMs = current?.activationAtMs,
                    pinEnabled = parsed.optBoolean("pinEnabled", current?.pinEnabled == true),
                ),
            )
        } catch (_: Exception) {
        }
    }

    @Synchronized
    fun markPending(context: Context, pending: Boolean) {
        prefs(context).edit().putBoolean(KEY_PENDING, pending).apply()
    }

    @Synchronized
    fun consumePending(context: Context): Boolean {
        val pending = prefs(context).getBoolean(KEY_PENDING, false)
        if (pending) {
            prefs(context).edit().putBoolean(KEY_PENDING, false).apply()
        }
        return pending
    }

    @Synchronized
    fun peekPending(context: Context): Boolean {
        return prefs(context).getBoolean(KEY_PENDING, false)
    }

    fun pinEnabled(context: Context): Boolean {
        return gate(context)?.pinEnabled == true || prefs(context).getBoolean(KEY_PIN, false)
    }

    fun setPinEnabled(context: Context, enabled: Boolean) {
        val current = gate(context) ?: MorningModeLogic.waiting(System.currentTimeMillis())
        saveGate(context, current.copy(pinEnabled = enabled))
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
