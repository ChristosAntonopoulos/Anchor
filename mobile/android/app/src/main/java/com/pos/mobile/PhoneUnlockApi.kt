package com.pos.mobile

import android.content.Context
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object PhoneUnlockApi {
    private const val TAG = "PhoneUnlockApi"
    private const val PREFS = "pos_unlock"
    private const val KEY_URL = "apiUrl"
    private const val DEFAULT_URL = "http://185.193.66.50:31247/api"

    fun setApiUrl(context: Context, url: String) {
        val trimmed = url.trim().trimEnd('/')
        if (trimmed.isEmpty()) {
            return
        }
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_URL, trimmed)
            .apply()
    }

    fun submit(context: Context, reason: String, unlockedAtMs: Long) {
        val appContext = context.applicationContext
        Thread {
            try {
                val base = appContext
                    .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                    .getString(KEY_URL, DEFAULT_URL)
                    ?: DEFAULT_URL
                val endpoint = "${base.trimEnd('/')}/phone-unlock"
                val iso = isoUtc(unlockedAtMs)
                val body = JSONObject()
                    .put("reason", reason)
                    .put("unlockedAt", iso)
                    .toString()
                val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 15_000
                    readTimeout = 15_000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Accept", "application/json")
                }
                OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                    writer.write(body)
                }
                val code = connection.responseCode
                android.util.Log.d(TAG, "Unlock reason POST $code to $endpoint")
                connection.disconnect()
            } catch (error: Exception) {
                android.util.Log.e(TAG, "Could not save unlock reason", error)
            }
        }.start()
    }

    private fun isoUtc(unlockedAtMs: Long): String {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        format.timeZone = TimeZone.getTimeZone("UTC")
        return format.format(Date(unlockedAtMs))
    }
}
