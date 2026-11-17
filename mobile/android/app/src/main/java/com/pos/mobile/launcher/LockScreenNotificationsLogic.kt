package com.pos.mobile.launcher

/**
 * Pure helpers for lock-screen notification badge + mute/DND state.
 * Counting filters live in [com.pos.mobile.LockScreenNotifications]; this stays unit-testable.
 */
object LockScreenNotificationsLogic {
    /** Cap the visible badge so the lock face stays calm. */
    fun badgeLabel(count: Int): String? {
        if (count <= 0) return null
        if (count > 9) return "9+"
        return count.toString()
    }

    /**
     * Treat total silence and alarms-only as muted. PRIORITY (Focus) stays "on"
     * so the icon can mean “notifications are reaching you” vs hard mute.
     */
    fun isMuted(interruptionFilter: Int): Boolean {
        // Mirror NotificationManager constants without importing Android here.
        // NONE = 3, ALARMS = 4, ALL = 1, PRIORITY = 2, UNKNOWN = 0
        return interruptionFilter == 3 || interruptionFilter == 4
    }

    /**
     * Toggle target: muted → ALL (1); unmuted → NONE (3).
     * Hard mute matches “notifications off” better than PRIORITY for a one-tap control.
     */
    fun nextInterruptionFilter(currentlyMuted: Boolean): Int {
        return if (currentlyMuted) 1 else 3
    }

    fun countsTowardBadge(
        packageName: String?,
        ownPackage: String,
        isGroupSummary: Boolean,
        isClearable: Boolean,
    ): Boolean {
        val pkg = packageName.orEmpty()
        if (pkg.isEmpty() || pkg == ownPackage) {
            return false
        }
        if (isGroupSummary) {
            return false
        }
        return isClearable
    }
}
