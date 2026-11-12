package com.pos.mobile

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * First-unlock gate. This is not a device-wide app locker.
 *
 * Supported when the foreground service is running:
 * ACTION_USER_PRESENT, persisted once-per-local-date, activity launch if
 * SYSTEM_ALERT_WINDOW is granted, otherwise a high-priority notification.
 *
 * Not possible without device-owner / kiosk privileges: blocking Instagram
 * or other apps, true lock-task, surviving force-stop until the user opens
 * the app again. Accessibility is not used.
 */
object NightModeLogic {
    const val TRIGGER_HOUR = 22
    const val TRIGGER_MINUTE = 0

    const val NOT_DUE = "NOT_DUE"
    const val WAITING = "WAITING_FOR_FIRST_UNLOCK"
    const val ACTIVE = "ACTIVE"
    const val PAUSED = "PAUSED"
    const val COMPLETED = "COMPLETED"
    const val ENDED_EARLY = "ENDED_EARLY"

    data class Gate(
        val localDate: String,
        val timezone: String,
        val status: String,
        val firstEligibleUnlockAtMs: Long?,
        val activationAtMs: Long?,
        val pinEnabled: Boolean,
    )

    data class Decision(
        val action: String,
        val gate: Gate,
    ) {
        val takeover: Boolean
            get() = action == "activate" || action == "resume"
    }

    fun localDate(nowMs: Long, timeZone: TimeZone = TimeZone.getDefault()): String {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        format.timeZone = timeZone
        return format.format(Date(nowMs))
    }

    fun isAtOrAfterTrigger(nowMs: Long, timeZone: TimeZone = TimeZone.getDefault()): Boolean {
        val calendar = Calendar.getInstance(timeZone)
        calendar.timeInMillis = nowMs
        val minutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        return minutes >= TRIGGER_HOUR * 60 + TRIGGER_MINUTE
    }

    fun waiting(nowMs: Long, timeZone: TimeZone = TimeZone.getDefault()): Gate {
        val today = localDate(nowMs, timeZone)
        return Gate(
            localDate = today,
            timezone = timeZone.id,
            status = if (isAtOrAfterTrigger(nowMs, timeZone)) WAITING else NOT_DUE,
            firstEligibleUnlockAtMs = null,
            activationAtMs = null,
            pinEnabled = false,
        )
    }

    fun onCivilDate(gate: Gate?, nowMs: Long, timeZone: TimeZone = TimeZone.getDefault()): Gate {
        val today = localDate(nowMs, timeZone)
        if (gate == null || gate.localDate != today) {
            return waiting(nowMs, timeZone).copy(pinEnabled = gate?.pinEnabled == true)
        }
        if (gate.status == NOT_DUE && isAtOrAfterTrigger(nowMs, timeZone)) {
            return gate.copy(status = WAITING, timezone = timeZone.id)
        }
        return gate.copy(timezone = timeZone.id)
    }

    fun onUnlock(
        gate: Gate?,
        nowMs: Long,
        fromUserPresent: Boolean,
        timeZone: TimeZone = TimeZone.getDefault(),
    ): Decision {
        val current = onCivilDate(gate, nowMs, timeZone)
        if (!fromUserPresent) {
            return Decision("ignore", current)
        }
        if (current.status == COMPLETED || current.status == ENDED_EARLY) {
            return Decision("skip_done", current)
        }
        if (!isAtOrAfterTrigger(nowMs, timeZone)) {
            return Decision("wait", current.copy(status = NOT_DUE, timezone = timeZone.id))
        }
        if (current.status == ACTIVE || current.status == PAUSED) {
            return Decision(
                "resume",
                current.copy(firstEligibleUnlockAtMs = current.firstEligibleUnlockAtMs ?: nowMs),
            )
        }
        return Decision(
            "activate",
            current.copy(
                status = ACTIVE,
                firstEligibleUnlockAtMs = current.firstEligibleUnlockAtMs ?: nowMs,
                activationAtMs = current.activationAtMs ?: nowMs,
                timezone = timeZone.id,
            ),
        )
    }
}
