package com.pos.mobile

import org.json.JSONObject
import java.util.TimeZone
import java.util.UUID

data class PhoneUnlockPrompt(
    val id: String,
    val schemaVersion: Int = SCHEMA_VERSION,
    val unlockEventId: String?,
    val shownAtUtc: String,
    val utcOffsetMinutesAtShown: Int,
    var resolvedAtUtc: String? = null,
    var status: String = STATUS_PENDING,
    var action: String? = null,
    var intentionCode: String? = null,
    var triggerCode: String? = null,
    var feelingCode: String? = null,
    var note: String? = null,
    var contextExpanded: Boolean = false,
    var submissionPath: String? = null,
    var putDownExecution: String? = null,
    val unlockedAtMs: Long,
    var synced: Boolean = false,
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("id", id)
            put("schemaVersion", schemaVersion)
            putNullable("unlockEventId", unlockEventId)
            put("shownAtUtc", shownAtUtc)
            put("utcOffsetMinutesAtShown", utcOffsetMinutesAtShown)
            putNullable("resolvedAtUtc", resolvedAtUtc)
            put("status", status)
            putNullable("action", action)
            putNullable("intentionCode", intentionCode)
            putNullable("triggerCode", triggerCode)
            putNullable("feelingCode", feelingCode)
            putNullable("note", note)
            put("contextExpanded", contextExpanded)
            putNullable("submissionPath", submissionPath)
            putNullable("putDownExecution", putDownExecution)
            put("unlockedAtMs", unlockedAtMs)
            put("synced", synced)
        }
    }

    companion object {
        const val SCHEMA_VERSION = 2
        const val STATUS_PENDING = "pending"
        const val STATUS_ANSWERED = "answered"
        const val STATUS_SKIPPED = "skipped"
        const val STATUS_DISMISSED = "dismissed"
        const val STATUS_INTERRUPTED = "interrupted"
        const val ACTION_CONTINUE = "continue"
        const val ACTION_PUT_DOWN = "put_down"
        const val ACTION_SKIP = "skip"
        const val PATH_QUICK = "quick_choice"
        const val PATH_CONTEXT = "context_form"
        const val PATH_DIRECT = "direct_action"
        const val PUT_DOWN_OVERLAY = "overlay_dismissed"

        val INTENTIONS = listOf(
            "specific_task",
            "connection",
            "intentional_break",
            "automatic_check",
            "unsure",
            "other",
        )
        val TRIGGERS = listOf(
            "notification",
            "task_cue",
            "boredom_waiting",
            "difficult_moment",
            "connection_need",
            "curiosity_updates",
            "habit_no_clear_cue",
            "other",
            "unsure",
        )
        val FEELINGS = listOf(
            "calm",
            "bored",
            "stressed",
            "low",
            "lonely",
            "restless",
            "tired",
            "okay",
            "other",
            "unsure",
        )

        fun createPending(unlockTimeMs: Long): PhoneUnlockPrompt {
            return PhoneUnlockPrompt(
                id = UUID.randomUUID().toString(),
                unlockEventId = "unlock-$unlockTimeMs",
                shownAtUtc = PhoneUnlockApi.isoUtc(unlockTimeMs),
                utcOffsetMinutesAtShown = TimeZone.getDefault().getOffset(unlockTimeMs) / 60000,
                unlockedAtMs = unlockTimeMs,
            )
        }

        fun fromJson(raw: JSONObject): PhoneUnlockPrompt {
            return PhoneUnlockPrompt(
                id = raw.getString("id"),
                schemaVersion = raw.optInt("schemaVersion", SCHEMA_VERSION),
                unlockEventId = raw.nullableString("unlockEventId"),
                shownAtUtc = raw.getString("shownAtUtc"),
                utcOffsetMinutesAtShown = raw.optInt("utcOffsetMinutesAtShown"),
                resolvedAtUtc = raw.nullableString("resolvedAtUtc"),
                status = raw.optString("status", STATUS_PENDING),
                action = raw.nullableString("action"),
                intentionCode = raw.nullableString("intentionCode"),
                triggerCode = raw.nullableString("triggerCode"),
                feelingCode = raw.nullableString("feelingCode"),
                note = raw.nullableString("note"),
                contextExpanded = raw.optBoolean("contextExpanded", false),
                submissionPath = raw.nullableString("submissionPath"),
                putDownExecution = raw.nullableString("putDownExecution"),
                unlockedAtMs = raw.optLong("unlockedAtMs"),
                synced = raw.optBoolean("synced", false),
            )
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

private fun JSONObject.nullableString(key: String): String? {
    if (!has(key) || isNull(key)) {
        return null
    }
    val value = optString(key, "")
    return value.ifBlank { null }
}
