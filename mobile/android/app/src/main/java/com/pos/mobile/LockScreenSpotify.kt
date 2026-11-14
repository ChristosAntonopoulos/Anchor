package com.pos.mobile

import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import com.pos.mobile.launcher.InstalledApps
import com.pos.mobile.launcher.LockScreenSpotifyLogic

data class SpotifyLockSnapshot(
    val title: String,
    val artist: String,
    val line: String,
    val playing: Boolean,
    val packageName: String,
)

/**
 * Reads Spotify's active [MediaController] via the notification-listener component
 * (same entitlement used for Notification access). Quiet lock-face transport only.
 */
object LockScreenSpotify {
    private const val TAG = "LockScreenSpotify"
    private val mainHandler = Handler(Looper.getMainLooper())

    @Volatile
    private var controller: MediaController? = null

    fun snapshot(context: Context): SpotifyLockSnapshot? {
        return try {
            val mgr = context.getSystemService(MediaSessionManager::class.java) ?: return null
            val listener = ComponentName(context, POSNotificationListenerService::class.java)
            val sessions = mgr.getActiveSessions(listener)
            pickSpotify(sessions)?.let { toSnapshot(it) }
        } catch (error: SecurityException) {
            android.util.Log.d(TAG, "Notification listener not enabled for media sessions")
            null
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not read media sessions", error)
            null
        }
    }

    /**
     * Observe Spotify session changes. Returns an unsubscribe that must run on the main thread.
     */
    fun observe(context: Context, onChange: (SpotifyLockSnapshot?) -> Unit): () -> Unit {
        val app = context.applicationContext
        val mgr = app.getSystemService(MediaSessionManager::class.java)
        if (mgr == null) {
            onChange(null)
            return {}
        }
        val listenerComponent = ComponentName(app, POSNotificationListenerService::class.java)
        val callback = object : MediaController.Callback() {
            override fun onPlaybackStateChanged(state: PlaybackState?) = publish(app, onChange)
            override fun onMetadataChanged(metadata: MediaMetadata?) = publish(app, onChange)
            override fun onSessionDestroyed() = publish(app, onChange)
        }
        val sessionsListener = MediaSessionManager.OnActiveSessionsChangedListener {
            attachController(app, mgr, listenerComponent, callback)
            publish(app, onChange)
        }
        return try {
            mgr.addOnActiveSessionsChangedListener(sessionsListener, listenerComponent, mainHandler)
            attachController(app, mgr, listenerComponent, callback)
            publish(app, onChange)
            {
                try {
                    controller?.unregisterCallback(callback)
                } catch (_: Exception) {
                }
                controller = null
                try {
                    mgr.removeOnActiveSessionsChangedListener(sessionsListener)
                } catch (_: Exception) {
                }
            }
        } catch (error: SecurityException) {
            android.util.Log.d(TAG, "Cannot observe sessions without notification access")
            onChange(null)
            {}
        } catch (error: Exception) {
            android.util.Log.w(TAG, "Could not observe media sessions", error)
            onChange(null)
            {}
        }
    }

    fun playPause() {
        val controls = controller?.transportControls ?: return
        val state = controller?.playbackState?.state
        if (LockScreenSpotifyLogic.isPlaying(state)) {
            controls.pause()
        } else {
            controls.play()
        }
    }

    fun skipNext() {
        controller?.transportControls?.skipToNext()
    }

    fun skipPrevious() {
        controller?.transportControls?.skipToPrevious()
    }

    fun openSpotify(context: Context): Boolean {
        val session = controller?.sessionActivity
        if (session != null) {
            return try {
                session.send()
                true
            } catch (error: PendingIntent.CanceledException) {
                android.util.Log.w(TAG, "Spotify session activity canceled", error)
                InstalledApps.openDock(context, InstalledApps.SPOTIFY_APP)
            } catch (error: Exception) {
                android.util.Log.w(TAG, "Could not send Spotify session activity", error)
                InstalledApps.openDock(context, InstalledApps.SPOTIFY_APP)
            }
        }
        return InstalledApps.openDock(context, InstalledApps.SPOTIFY_APP)
    }

    private fun publish(context: Context, onChange: (SpotifyLockSnapshot?) -> Unit) {
        val snap = snapshot(context)
        if (Looper.myLooper() == Looper.getMainLooper()) {
            onChange(snap)
        } else {
            mainHandler.post { onChange(snap) }
        }
    }

    private fun attachController(
        context: Context,
        mgr: MediaSessionManager,
        listener: ComponentName,
        callback: MediaController.Callback,
    ) {
        try {
            controller?.unregisterCallback(callback)
        } catch (_: Exception) {
        }
        val next = pickSpotify(mgr.getActiveSessions(listener))
        controller = next
        try {
            next?.registerCallback(callback, mainHandler)
        } catch (_: Exception) {
        }
    }

    private fun pickSpotify(sessions: List<MediaController>): MediaController? {
        return sessions.firstOrNull { session ->
            LockScreenSpotifyLogic.shouldShow(
                packageName = session.packageName,
                playbackStateCode = session.playbackState?.state,
            )
        } ?: sessions.firstOrNull { LockScreenSpotifyLogic.isSpotifyPackage(it.packageName) }?.takeIf {
            LockScreenSpotifyLogic.shouldShow(it.packageName, it.playbackState?.state)
        }
    }

    private fun toSnapshot(session: MediaController): SpotifyLockSnapshot? {
        val state = session.playbackState?.state
        if (!LockScreenSpotifyLogic.shouldShow(session.packageName, state)) {
            return null
        }
        val meta = session.metadata
        val title = meta?.getString(MediaMetadata.METADATA_KEY_TITLE)
            ?: meta?.getString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE)
        val artist = meta?.getString(MediaMetadata.METADATA_KEY_ARTIST)
            ?: meta?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
            ?: meta?.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)
        return SpotifyLockSnapshot(
            title = title?.trim().orEmpty(),
            artist = artist?.trim().orEmpty(),
            line = LockScreenSpotifyLogic.line(title, artist),
            playing = LockScreenSpotifyLogic.isPlaying(state),
            packageName = session.packageName,
        )
    }
}
