package com.pos.mobile.launcher

/**
 * Pure rules for the lock-face call strip.
 * Incoming → Answer / Decline; active → Hang up.
 *
 * Important: Android has no SEMANTIC_ACTION_ANSWER. Value 1 is
 * [android.app.Notification.Action.SEMANTIC_ACTION_REPLY] — never treat it as a call.
 */
object LockScreenCallLogic {
    enum class Phase {
        Incoming,
        Active,
    }

    data class ActionHint(
        val title: String,
        /** android.app.Notification.Action.semanticAction, or null when unknown. */
        val semanticAction: Int?,
    )

    /** Known dialer packages — weak signal when category is missing. */
    val DIALER_PACKAGES = setOf(
        "com.google.android.dialer",
        "com.google.android.apps.dialer",
        "com.samsung.android.dialer",
        "com.android.dialer",
        "com.android.phone",
        "com.android.server.telecom",
        "com.google.android.apps.tachyon",
    )

    /** [android.app.Notification.Action.SEMANTIC_ACTION_CALL] — dial/call, not Reply. */
    const val SEMANTIC_CALL = 10

    /** [android.app.Notification.CATEGORY_CALL] */
    const val CATEGORY_CALL = "call"

    fun isLikelyCallNotification(
        category: String?,
        packageName: String?,
        actions: List<ActionHint>,
        isOngoing: Boolean,
    ): Boolean {
        if (category.equals(CATEGORY_CALL, ignoreCase = true)) return true

        val answer = findAnswer(actions)
        val decline = findDecline(actions)
        val hangUp = findHangUp(actions)
        // Real call chrome usually exposes answer+decline, or hang up while connected.
        if (answer != null && (decline != null || hangUp != null)) return true
        if (hangUp != null && (isOngoing || isDialerPackage(packageName))) return true

        if (!isDialerPackage(packageName)) return false
        // Dialer-only: need an explicit answer or hang-up affordance — never "any ongoing action".
        return answer != null || hangUp != null
    }

    fun isDialerPackage(packageName: String?): Boolean {
        val pkg = packageName?.trim().orEmpty()
        if (pkg.isEmpty()) return false
        if (DIALER_PACKAGES.any { it.equals(pkg, ignoreCase = true) }) return true
        return pkg.contains("dialer", ignoreCase = true) ||
            pkg.endsWith(".telecom", ignoreCase = true)
    }

    fun phase(actions: List<ActionHint>, isOngoing: Boolean): Phase {
        if (findAnswer(actions) != null) return Phase.Incoming
        if (findHangUp(actions) != null) return Phase.Active
        if (findDecline(actions) != null) return Phase.Incoming
        return if (isOngoing) Phase.Active else Phase.Incoming
    }

    fun callerLine(title: String?, text: String?, subText: String?): String {
        val t = title?.trim().orEmpty()
        val body = text?.trim().orEmpty()
        val sub = subText?.trim().orEmpty()
        return when {
            t.isNotEmpty() && looksLikeCaller(t) -> t
            body.isNotEmpty() && looksLikeCaller(body) -> body
            t.isNotEmpty() -> t
            body.isNotEmpty() -> body
            sub.isNotEmpty() -> sub
            else -> "Call"
        }
    }

    fun eyebrow(phase: Phase): String = when (phase) {
        Phase.Incoming -> "Incoming"
        Phase.Active -> "On call"
    }

    fun findAnswer(actions: List<ActionHint>): ActionHint? {
        // Prefer title match — SEMANTIC_ACTION_CALL (10) is "place a call", not answer.
        return actions.firstOrNull { titleMatches(it.title, ANSWER_PHRASES) }
    }

    fun findDecline(actions: List<ActionHint>): ActionHint? {
        return actions.firstOrNull { titleMatches(it.title, DECLINE_PHRASES) }
    }

    fun findHangUp(actions: List<ActionHint>): ActionHint? {
        return actions.firstOrNull { titleMatches(it.title, HANGUP_PHRASES) }
    }

    /** Decline while ringing; hang up once connected. */
    fun findDeclineOrHangUp(actions: List<ActionHint>): ActionHint? {
        return findDecline(actions) ?: findHangUp(actions)
    }

    private fun looksLikeCaller(value: String): Boolean {
        if (value.length > 64) return false
        val lower = value.lowercase()
        return !lower.contains("missed") &&
            !titleMatches(lower, ANSWER_PHRASES) &&
            !titleMatches(lower, DECLINE_PHRASES) &&
            !titleMatches(lower, HANGUP_PHRASES)
    }

    /**
     * Phrase match with word boundaries so "end" does not hit "Send",
     * and "dismiss" alone is not enough unless the whole title is that control.
     */
    private fun titleMatches(title: String, phrases: Set<String>): Boolean {
        val normalized = title.trim().lowercase().replace(Regex("\\s+"), " ")
        if (normalized.isEmpty()) return false
        return phrases.any { phrase ->
            if (normalized == phrase) return@any true
            // Multi-word phrases may appear inside longer labels ("End the call").
            if (phrase.contains(' ')) return@any normalized.contains(phrase)
            // Single tokens: whole-word only.
            Regex("\\b${Regex.escape(phrase)}\\b").containsMatchIn(normalized)
        }
    }

    private val ANSWER_PHRASES = setOf(
        "answer", "accept", "pick up", "pickup", "απάντηση", "απαντηση", "λήψη", "ληψη",
    )
    private val DECLINE_PHRASES = setOf(
        "decline", "reject", "ignore", "απόρριψη", "απορριψη", "άρνηση", "αρνηση",
        // "dismiss" is too common on non-call notifs — only exact title.
    )
    private val HANGUP_PHRASES = setOf(
        "hang up", "hangup", "end call", "end the call", "disconnect",
        "κλείσιμο", "κλεισιμο", "τερματισμός", "τερματισμος",
        // bare "end" omitted — it matches "Send".
    )
}
