package com.pos.mobile

object PhoneUnlockResolution {
    data class Decision(
        val status: String,
        val action: String?,
        val intentionCode: String?,
        val triggerCode: String?,
        val feelingCode: String?,
        val note: String?,
        val contextExpanded: Boolean,
        val submissionPath: String?,
        val putDownExecution: String?,
    )

    fun fromUserChoice(
        skip: Boolean,
        keepContext: Boolean,
        contextExpanded: Boolean,
        intention: String?,
        trigger: String?,
        feeling: String?,
        note: String?,
        action: String?,
        status: String,
        path: String?,
        putDownExecution: String?,
    ): Decision {
        val discardDetails = skip ||
            status == PhoneUnlockPrompt.STATUS_DISMISSED ||
            status == PhoneUnlockPrompt.STATUS_INTERRUPTED
        return Decision(
            status = status,
            action = action,
            intentionCode = if (discardDetails) null else intention,
            triggerCode = if (discardDetails || !keepContext) null else trigger,
            feelingCode = if (discardDetails || !keepContext) null else feeling,
            note = if (discardDetails || !keepContext) null else sanitizeNote(note),
            contextExpanded = contextExpanded,
            submissionPath = path,
            putDownExecution = putDownExecution,
        )
    }

    fun sanitizeNote(note: String?): String? {
        return note?.trim()?.take(NOTE_MAX_LENGTH)?.ifBlank { null }
    }

    fun apply(prompt: PhoneUnlockPrompt, decision: Decision, resolvedAtUtc: String): Boolean {
        if (prompt.status != PhoneUnlockPrompt.STATUS_PENDING) {
            return false
        }
        prompt.status = decision.status
        prompt.action = decision.action
        prompt.intentionCode = decision.intentionCode
        prompt.triggerCode = decision.triggerCode
        prompt.feelingCode = decision.feelingCode
        prompt.note = decision.note
        prompt.contextExpanded = decision.contextExpanded
        prompt.submissionPath = decision.submissionPath
        prompt.putDownExecution = decision.putDownExecution
        prompt.resolvedAtUtc = resolvedAtUtc
        prompt.synced = false
        return true
    }

    const val NOTE_MAX_LENGTH = 200
}
