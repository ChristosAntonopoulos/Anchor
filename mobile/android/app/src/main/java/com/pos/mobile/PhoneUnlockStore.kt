package com.pos.mobile

import android.content.Context
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class UnlockStats(
    val todayCount: Int,
    val totalCount: Int,
    val averageDurationMs: Long?,
    val todayDurationMs: Long?,
    val mostCommonIntention: String?,
)

object PhoneUnlockStore {
    private const val TAG = "PhoneUnlockStore"
    private const val PREFS = "pos_unlock"
    private const val KEY_PROMPTS = "promptRecords"
    private const val KEY_PENDING_CHECK_IN = "pendingCheckInUnlockId"
    private const val KEY_SESSION_START = "sessionStartMs"
    private const val MIN_DURATION_MS = 1_000L
    private const val MAX_DURATION_MS = 12 * 60 * 60 * 1000L

    @Synchronized
    fun interruptStalePending(context: Context, exceptId: String? = null) {
        val records = load(context)
        var changed = false
        records.forEach { prompt ->
            if (prompt.status == PhoneUnlockPrompt.STATUS_PENDING && prompt.id != exceptId) {
                prompt.status = PhoneUnlockPrompt.STATUS_INTERRUPTED
                prompt.resolvedAtUtc = PhoneUnlockApi.isoUtc(System.currentTimeMillis())
                prompt.synced = false
                changed = true
                android.util.Log.d(TAG, "Pending prompt ${prompt.id} marked interrupted")
            }
        }
        if (changed) {
            save(context, records)
        }
    }

    @Synchronized
    fun createPending(context: Context, unlockTimeMs: Long): PhoneUnlockPrompt {
        val eventId = "unlock-$unlockTimeMs"
        val records = load(context)
        val existing = records.find {
            it.unlockEventId == eventId && it.status == PhoneUnlockPrompt.STATUS_PENDING
        }
        if (existing != null) {
            return existing
        }
        var changed = false
        records.forEach { prompt ->
            if (prompt.status == PhoneUnlockPrompt.STATUS_PENDING) {
                prompt.status = PhoneUnlockPrompt.STATUS_INTERRUPTED
                prompt.resolvedAtUtc = PhoneUnlockApi.isoUtc(System.currentTimeMillis())
                prompt.synced = false
                changed = true
            }
        }
        val prompt = PhoneUnlockPrompt.createPending(unlockTimeMs)
        records.add(prompt)
        save(context, records)
        if (changed) {
            android.util.Log.d(TAG, "Created prompt ${prompt.id} after interrupting stale pending records")
        }
        return prompt
    }

    @Synchronized
    fun recordWalletUnlock(context: Context, unlockTimeMs: Long): Boolean {
        val prompt = createPending(context, unlockTimeMs)
        return resolve(
            context = context,
            prompt = prompt,
            status = PhoneUnlockPrompt.STATUS_ANSWERED,
            action = PhoneUnlockPrompt.ACTION_CONTINUE,
            intentionCode = "pay",
            triggerCode = null,
            feelingCode = null,
            note = null,
            contextExpanded = false,
            submissionPath = PhoneUnlockPrompt.PATH_WALLET,
            putDownExecution = null,
        )
    }

    @Synchronized
    fun getById(context: Context, id: String): PhoneUnlockPrompt? {
        return load(context).find { it.id == id }
    }

    @Synchronized
    fun update(context: Context, prompt: PhoneUnlockPrompt) {
        val records = load(context)
        val index = records.indexOfFirst { it.id == prompt.id }
        if (index >= 0) {
            records[index] = prompt
        } else {
            records.add(prompt)
        }
        save(context, records)
    }

    @Synchronized
    fun resolve(
        context: Context,
        prompt: PhoneUnlockPrompt,
        status: String,
        action: String?,
        intentionCode: String?,
        triggerCode: String?,
        feelingCode: String?,
        note: String?,
        contextExpanded: Boolean,
        submissionPath: String?,
        putDownExecution: String?,
    ): Boolean {
        return try {
            val decision = PhoneUnlockResolution.Decision(
                status = status,
                action = action,
                intentionCode = intentionCode,
                triggerCode = triggerCode,
                feelingCode = feelingCode,
                note = PhoneUnlockResolution.sanitizeNote(note),
                contextExpanded = contextExpanded,
                submissionPath = submissionPath,
                putDownExecution = putDownExecution,
            )
            val applied = PhoneUnlockResolution.apply(
                prompt,
                decision,
                PhoneUnlockApi.isoUtc(System.currentTimeMillis()),
            )
            if (!applied) {
                android.util.Log.d(TAG, "Ignored duplicate resolve for prompt ${prompt.id} status=${prompt.status}")
                return false
            }
            update(context, prompt)
            PhoneUnlockApi.enqueueSync(context)
            true
        } catch (error: Exception) {
            android.util.Log.e(
                TAG,
                "Could not persist unlock prompt ${prompt.id} status=$status action=$action",
                error,
            )
            false
        }
    }

    @Synchronized
    fun unsynced(context: Context): List<PhoneUnlockPrompt> {
        return load(context).filter { !it.synced && it.status != PhoneUnlockPrompt.STATUS_PENDING }
    }

    @Synchronized
    fun markSynced(context: Context, id: String) {
        val records = load(context)
        records.find { it.id == id }?.synced = true
        save(context, records)
    }

    @Synchronized
    fun setPendingCheckInOffer(context: Context, unlockEventId: String) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PENDING_CHECK_IN, unlockEventId)
            .apply()
    }

    @Synchronized
    fun consumePendingCheckInOffer(context: Context): String? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val value = prefs.getString(KEY_PENDING_CHECK_IN, null)
        if (value != null) {
            prefs.edit().remove(KEY_PENDING_CHECK_IN).apply()
        }
        return value
    }

    @Synchronized
    fun openSession(context: Context, unlockTimeMs: Long) {
        closeSession(context)
        prefs(context).edit().putLong(KEY_SESSION_START, unlockTimeMs).apply()
    }

    @Synchronized
    fun closeSession(context: Context) {
        val stored = prefs(context)
        if (!stored.contains(KEY_SESSION_START)) {
            return
        }
        val start = stored.getLong(KEY_SESSION_START, 0L)
        stored.edit().remove(KEY_SESSION_START).apply()
        if (start <= 0L) {
            return
        }
        val now = System.currentTimeMillis()
        val duration = (now - start).coerceIn(MIN_DURATION_MS, MAX_DURATION_MS)
        attachDuration(context, start, duration, now)
    }

    @Synchronized
    fun summary(context: Context): UnlockStats {
        val records = load(context)
        val today = localDate()
        val todayRecords = records.filter { localDate(it.unlockedAtMs) == today }
        val durations = records.mapNotNull { it.unlockedDurationMs }
        val todayDurations = todayRecords.mapNotNull { it.unlockedDurationMs }
        val mostCommon = records
            .mapNotNull { it.intentionCode }
            .groupingBy { it }
            .eachCount()
            .maxByOrNull { it.value }
            ?.key
        return UnlockStats(
            todayCount = todayRecords.size,
            totalCount = records.size,
            averageDurationMs = if (durations.isEmpty()) null else durations.average().toLong(),
            todayDurationMs = if (todayDurations.isEmpty()) null else todayDurations.sum(),
            mostCommonIntention = mostCommon,
        )
    }

    @Synchronized
    private fun attachDuration(context: Context, unlockTimeMs: Long, durationMs: Long, lockedAtMs: Long) {
        val records = load(context)
        val prompt = records.find { it.unlockedAtMs == unlockTimeMs }
            ?: records.lastOrNull { it.unlockedAtMs in 1..unlockTimeMs }
            ?: return
        prompt.unlockedDurationMs = durationMs
        prompt.lockedAtUtc = PhoneUnlockApi.isoUtc(lockedAtMs)
        if (prompt.status != PhoneUnlockPrompt.STATUS_PENDING) {
            prompt.synced = false
        }
        save(context, records)
        if (prompt.status != PhoneUnlockPrompt.STATUS_PENDING) {
            PhoneUnlockApi.enqueueSync(context)
        }
    }

    private fun prefs(context: Context) =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun localDate(atMs: Long = System.currentTimeMillis()): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(atMs))
    }

    @Synchronized
    private fun load(context: Context): MutableList<PhoneUnlockPrompt> {
        val raw = context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_PROMPTS, "[]")
            ?: "[]"
        return try {
            val array = JSONArray(raw)
            MutableList(array.length()) { index ->
                PhoneUnlockPrompt.fromJson(array.getJSONObject(index))
            }
        } catch (error: Exception) {
            android.util.Log.e(TAG, "Could not read local unlock prompts", error)
            mutableListOf()
        }
    }

    @Synchronized
    private fun save(context: Context, records: List<PhoneUnlockPrompt>) {
        val array = JSONArray()
        records.takeLast(200).forEach { array.put(it.toJson()) }
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PROMPTS, array.toString())
            .apply()
    }
}
