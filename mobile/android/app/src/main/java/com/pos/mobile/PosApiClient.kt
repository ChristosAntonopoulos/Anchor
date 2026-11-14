package com.pos.mobile

import android.content.Context
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.concurrent.Executors

/**
 * Shared Anchor API access for native launcher cards (same base URL as unlock sync).
 */
object PosApiClient {
    private const val PREFS = "pos_unlock"
    private const val KEY_URL = "apiUrl"
    const val DEFAULT_URL = "http://185.193.66.50:31247/api"
    private val executor = Executors.newSingleThreadExecutor()

    fun apiBase(context: Context): String {
        return context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_URL, DEFAULT_URL)
            ?: DEFAULT_URL
    }

    fun enqueue(work: () -> Unit) {
        executor.execute {
            try {
                work()
            } catch (_: Exception) {
            }
        }
    }

    fun getJson(context: Context, path: String, connectTimeoutMs: Int = 8_000, readTimeoutMs: Int = 8_000): JSONObject {
        val endpoint = "${apiBase(context).trimEnd('/')}/${path.trimStart('/')}"
        val connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = connectTimeoutMs
            readTimeout = readTimeoutMs
            setRequestProperty("Accept", "application/json")
        }
        return try {
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val body = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                throw IllegalStateException("GET $path returned HTTP $code")
            }
            JSONObject(body)
        } finally {
            connection.disconnect()
        }
    }

    fun parseUtcMillis(raw: String?): Long? {
        if (raw.isNullOrBlank()) return null
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
        )
        for (pattern in patterns) {
            try {
                val format = SimpleDateFormat(pattern, Locale.US)
                format.timeZone = TimeZone.getTimeZone("UTC")
                return format.parse(raw)?.time
            } catch (_: Exception) {
            }
        }
        return null
    }
}
