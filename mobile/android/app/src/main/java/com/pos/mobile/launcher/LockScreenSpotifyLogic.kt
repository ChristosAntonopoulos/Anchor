package com.pos.mobile.launcher

/**
 * Pure rules for when the lock-face Spotify strip should appear.
 * Playing or paused mid-session → show; stopped / idle / unknown → hide.
 */
object LockScreenSpotifyLogic {
    const val PKG_MUSIC = "com.spotify.music"
    const val PKG_LITE = "com.spotify.lite"

    fun isSpotifyPackage(packageName: String?): Boolean {
        val pkg = packageName?.trim().orEmpty()
        return pkg.equals(PKG_MUSIC, ignoreCase = true) ||
            pkg.equals(PKG_LITE, ignoreCase = true)
    }

    /**
     * @param playbackStateCode android.media.session.PlaybackState state int, or null
     */
    fun shouldShow(packageName: String?, playbackStateCode: Int?): Boolean {
        if (!isSpotifyPackage(packageName)) return false
        return when (playbackStateCode) {
            android.media.session.PlaybackState.STATE_PLAYING,
            android.media.session.PlaybackState.STATE_PAUSED,
            android.media.session.PlaybackState.STATE_BUFFERING,
            android.media.session.PlaybackState.STATE_FAST_FORWARDING,
            android.media.session.PlaybackState.STATE_REWINDING,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_NEXT,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_PREVIOUS,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_QUEUE_ITEM,
            -> true
            else -> false
        }
    }

    fun isPlaying(playbackStateCode: Int?): Boolean {
        return when (playbackStateCode) {
            android.media.session.PlaybackState.STATE_PLAYING,
            android.media.session.PlaybackState.STATE_BUFFERING,
            android.media.session.PlaybackState.STATE_FAST_FORWARDING,
            android.media.session.PlaybackState.STATE_REWINDING,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_NEXT,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_PREVIOUS,
            android.media.session.PlaybackState.STATE_SKIPPING_TO_QUEUE_ITEM,
            -> true
            else -> false
        }
    }

    fun line(title: String?, artist: String?): String {
        val t = title?.trim().orEmpty()
        val a = artist?.trim().orEmpty()
        return when {
            t.isNotEmpty() && a.isNotEmpty() && !t.equals(a, ignoreCase = true) -> "$t · $a"
            t.isNotEmpty() -> t
            a.isNotEmpty() -> a
            else -> "Spotify"
        }
    }
}
