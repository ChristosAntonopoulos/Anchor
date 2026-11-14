package com.pos.mobile.launcher

import android.media.session.PlaybackState
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LockScreenSpotifyLogicTest {
    @Test
    fun onlySpotifyPackagesCount() {
        assertTrue(LockScreenSpotifyLogic.isSpotifyPackage("com.spotify.music"))
        assertTrue(LockScreenSpotifyLogic.isSpotifyPackage("com.spotify.lite"))
        assertFalse(LockScreenSpotifyLogic.isSpotifyPackage("com.google.android.apps.youtube.music"))
        assertFalse(LockScreenSpotifyLogic.isSpotifyPackage(null))
    }

    @Test
    fun showWhilePlayingOrPaused() {
        assertTrue(
            LockScreenSpotifyLogic.shouldShow("com.spotify.music", PlaybackState.STATE_PLAYING),
        )
        assertTrue(
            LockScreenSpotifyLogic.shouldShow("com.spotify.music", PlaybackState.STATE_PAUSED),
        )
        assertTrue(
            LockScreenSpotifyLogic.shouldShow("com.spotify.lite", PlaybackState.STATE_BUFFERING),
        )
    }

    @Test
    fun hideWhenStoppedOrIdle() {
        assertFalse(
            LockScreenSpotifyLogic.shouldShow("com.spotify.music", PlaybackState.STATE_STOPPED),
        )
        assertFalse(
            LockScreenSpotifyLogic.shouldShow("com.spotify.music", PlaybackState.STATE_NONE),
        )
        assertFalse(LockScreenSpotifyLogic.shouldShow("com.spotify.music", null))
        assertFalse(
            LockScreenSpotifyLogic.shouldShow("com.other.app", PlaybackState.STATE_PLAYING),
        )
    }

    @Test
    fun lineJoinsTitleAndArtistWithMiddleDot() {
        assertEquals("Nightcall · Kavinsky", LockScreenSpotifyLogic.line("Nightcall", "Kavinsky"))
        assertEquals("Nightcall", LockScreenSpotifyLogic.line("Nightcall", ""))
        assertEquals("Spotify", LockScreenSpotifyLogic.line("", ""))
    }
}
