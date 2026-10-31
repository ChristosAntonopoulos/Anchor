package com.pos.mobile

object PhoneUnlockLegacy {
    const val LEGACY_TASK = "A task"
    const val LEGACY_MESSAGE = "A message"
    const val LEGACY_NO_REASON = "No reason"

    /**
     * Analysis-only mapping. Historical documents keep their original stored value.
     * "No reason" is never treated as an automatic check.
     */
    fun analysisIntentionCode(
        storedReason: String?,
        intentionCode: String?,
        schemaVersion: Int,
    ): String? {
        if (!intentionCode.isNullOrBlank()) {
            return intentionCode
        }
        if (schemaVersion >= PhoneUnlockPrompt.SCHEMA_VERSION) {
            return null
        }
        return when (storedReason) {
            LEGACY_TASK -> "specific_task"
            LEGACY_MESSAGE -> "connection"
            LEGACY_NO_REASON -> null
            else -> null
        }
    }

    fun displayHeadline(
        storedReason: String?,
        intentionCode: String?,
        schemaVersion: Int,
        status: String?,
        action: String?,
    ): String? {
        if (!intentionCode.isNullOrBlank()) {
            return intentionCode
        }
        if (schemaVersion >= PhoneUnlockPrompt.SCHEMA_VERSION) {
            return when {
                status == PhoneUnlockPrompt.STATUS_SKIPPED -> PhoneUnlockPrompt.ACTION_SKIP
                action == PhoneUnlockPrompt.ACTION_PUT_DOWN -> PhoneUnlockPrompt.ACTION_PUT_DOWN
                status == PhoneUnlockPrompt.STATUS_DISMISSED -> PhoneUnlockPrompt.STATUS_DISMISSED
                status == PhoneUnlockPrompt.STATUS_INTERRUPTED -> PhoneUnlockPrompt.STATUS_INTERRUPTED
                else -> null
            }
        }
        return storedReason
    }
}
