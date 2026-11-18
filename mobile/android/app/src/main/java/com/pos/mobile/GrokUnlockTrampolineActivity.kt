package com.pos.mobile

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.pos.mobile.launcher.InstalledApps

/**
 * Transparent show-when-locked trampoline: dismiss keyguard, then open Grok (`ai.x.grok`).
 *
 * Android will not render a third-party app *over* a secure keyguard. On a PIN/pattern/biometric
 * lock, [KeyguardManager.requestDismissKeyguard] still surfaces the credential UI; after success
 * (or when already unlocked) we launch Grok and finish. Best-effort — not a silent bypass.
 */
class GrokUnlockTrampolineActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(false)
        }
        @Suppress("DEPRECATION")
        window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED)

        val keyguard = getSystemService(KeyguardManager::class.java)
        if (keyguard?.isKeyguardLocked == true && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            keyguard.requestDismissKeyguard(this, object : KeyguardManager.KeyguardDismissCallback() {
                override fun onDismissSucceeded() {
                    launchGrokAndFinish()
                }

                override fun onDismissCancelled() {
                    finish()
                }

                override fun onDismissError() {
                    // Best-effort: still try to open; credential UI may already be up.
                    launchGrokAndFinish()
                }
            })
        } else {
            launchGrokAndFinish()
        }
    }

    private fun launchGrokAndFinish() {
        if (!InstalledApps.openDock(this, InstalledApps.GROK_APP)) {
            Toast.makeText(this, "Couldn’t open Grok", Toast.LENGTH_SHORT).show()
        }
        finish()
    }

    companion object {
        fun intent(context: Context): Intent {
            return Intent(context, GrokUnlockTrampolineActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_ANIMATION)
            }
        }
    }
}
