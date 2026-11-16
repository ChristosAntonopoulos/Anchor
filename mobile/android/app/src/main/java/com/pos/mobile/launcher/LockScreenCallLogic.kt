package com.pos.mobile.launcher

/**
 * Pure rules for the lock-face call strip.
 * Incoming → Answer / Decline; active → Hang up.
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

    /** [android.app.Notification.Action.SEMANTIC_ACTION_ANSWER] */
    const val SEMANTIC_ANSWER = 1

    fun isLikelyCallNotification(
        category: String?,
        packageName: String?,
        actions: List<ActionHint>,
        isOngoing: Boolean,
    ): Boolean {
        if (category.equals("call", ignoreCase = true)) return true
        if (actions.any { it.semanticAction == SEMANTIC_ANSWER }) return true
        if (!isDialerPackage(packageName)) return false
        return findAnswer(actions) != null ||
            findDeclineOrHangUp(actions) != null ||
            (isOngoing && actions.isNotEmpty())
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
        actions.firstOrNull { it.semanticAction == SEMANTIC_ANSWER }?.let { return it }
        return actions.firstOrNull { titleMatches(it.title, ANSWER_WORDS) }
    }

    fun findDecline(actions: List<ActionHint>): ActionHint? {
        return actions.firstOrNull { titleMatches(it.title, DECLINE_WORDS) }
    }

    fun findHangUp(actions: List<ActionHint>): ActionHint? {
        return actions.firstOrNull { titleMatches(it.title, HANGUP_WORDS) }
    }

    /** Decline while ringing; hang up once connected. */
    fun findDeclineOrHangUp(actions: List<ActionHint>): ActionHint? {
        return findDecline(actions) ?: findHangUp(actions)
    }

    private fun looksLikeCaller(value: String): Boolean {
        if (value.length > 64) return false
        val lower = value.lowercase()
        return !lower.contains("missed") &&
            !ANSWER_WORDS.contains(lower) &&
            !DECLINE_WORDS.contains(lower) &&
            !HANGUP_WORDS.contains(lower)
    }

    private fun titleMatches(title: String, words: Set<String>): Boolean {
        val normalized = title.trim().lowercase()
        if (normalized.isEmpty()) return false
        return words.any { word -> normalized == word || normalized.contains(word) }
    }

    private val ANSWER_WORDS = setOf(
        "answer", "accept", "pick up", "pickup", "απάντηση", "απαντηση", "λήψη", "ληψη",
    )
    private val DECLINE_WORDS = setOf(
        "decline", "reject", "dismiss", "ignore", "απόρριψη", "απορριψη", "άρνηση", "αρνηση",
    )
    private val HANGUP_WORDS = setOf(
        "hang up", "hangup", "end call", "end", "disconnect",
        "κλείσιμο", "κλεισιμο", "τερματισμός", "τερματισμος",
    )
}
