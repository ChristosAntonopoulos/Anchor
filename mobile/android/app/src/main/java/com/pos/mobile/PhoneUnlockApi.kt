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
import java.util.concurrent.Executors

object PhoneUnlockApi {
    private const val TAG = "PhoneUnlockApi"
    private const val PREFS = "pos_unlock"
    private const val KEY_URL = "apiUrl"
    private const val DEFAULT_URL = "http://185.193.66.50:31247/api"
    private val executor = Executors.newSingleThreadExecutor()

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

    fun isoUtc(atMs: Long): String {
        val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        format.timeZone = TimeZone.getTimeZone("UTC")
        return format.format(Date(atMs))
    }

    fun enqueueSync(context: Context) {
        val appContext = context.applicationContext
        executor.execute {
            PhoneUnlockStore.unsynced(appContext).forEach { prompt ->
                try {
                    post(appContext, prompt)
                    PhoneUnlockStore.markSynced(appContext, prompt.id)
                    android.util.Log.d(TAG, "Synced unlock prompt ${prompt.id} status=${prompt.status}")
                } catch (error: Exception) {
                    android.util.Log.e(
                        TAG,
                        "Could not sync unlock prompt ${prompt.id} status=${prompt.status}",
                        error,
                    )
                }
            }
        }
    }

    private fun post(context: Context, prompt: PhoneUnlockPrompt) {
        val base = context
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_URL, DEFAULT_URL)
            ?: DEFAULT_URL
        val endpoint = "${base.trimEnd('/')}/phone-unlock"
        val body = JSONObject().apply {
            put("promptId", prompt.id)
            put("schemaVersion", prompt.schemaVersion)
            putNullable("unlockEventId", prompt.unlockEventId)
            put("shownAtUtc", prompt.shownAtUtc)
            put("utcOffsetMinutesAtShown", prompt.utcOffsetMinutesAtShown)
            putNullable("resolvedAtUtc", prompt.resolvedAtUtc)
            put("status", prompt.status)
            putNullable("action", prompt.action)
            putNullable("intentionCode", prompt.intentionCode)
            putNullable("triggerCode", prompt.triggerCode)
            putNullable("feelingCode", prompt.feelingCode)
            putNullable("note", prompt.note)
            put("contextExpanded", prompt.contextExpanded)
            putNullable("submissionPath", prompt.submissionPath)
            putNullable("putDownExecution", prompt.putDownExecution)
            put("unlockedAt", prompt.shownAtUtc)
        }
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 15_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
        }
        try {
            OutputStreamWriter(connection.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(body.toString())
            }
            val code = connection.responseCode
            if (code !in 200..299) {
                throw IllegalStateException("Unlock prompt POST returned HTTP $code")
            }
        } finally {
            connection.disconnect()
        }
    }
}

private fun JSONObject.putNullable(key: String, value: String?) {
    if (value == null) {
        put(key, JSONObject.NULL)
    } else {
        put(key, value)
    }
}
