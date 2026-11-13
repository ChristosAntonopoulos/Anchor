package com.pos.mobile.launcher

import android.app.Activity
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.pos.mobile.HomeActivity
import com.pos.mobile.MainActivity
import com.pos.mobile.MorningModeLauncher

object LauncherIntents {
    const val EXTRA_PREVIEW = "previewHome"
    const val EXTRA_FROM_UNLOCK = "fromUnlock"
    const val REQUEST_HOME_ROLE = 7101

    fun preview(context: Context) {
        context.startActivity(
            Intent(context, HomeActivity::class.java).apply {
                putExtra(EXTRA_PREVIEW, true)
                if (context !is Activity) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        )
    }

    fun revealHome(context: Context) {
        context.startActivity(
            Intent(context, HomeActivity::class.java).apply {
                putExtra(EXTRA_FROM_UNLOCK, true)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT or
                    Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
            }
        )
    }

    fun requestHomeRole(activity: Activity): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roles = activity.getSystemService(RoleManager::class.java)
            if (roles != null && !roles.isRoleHeld(RoleManager.ROLE_HOME)) {
                activity.startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_HOME), REQUEST_HOME_ROLE)
                return true
            }
        }
        openHomeSettings(activity)
        return false
    }

    fun isDefaultHome(context: Context): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roles = context.getSystemService(RoleManager::class.java)
            if (roles != null) return roles.isRoleHeld(RoleManager.ROLE_HOME)
        }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        val resolved = intent.resolveActivity(context.packageManager) ?: return false
        return resolved.packageName == context.packageName && resolved.className.contains("HomeActivity")
    }

    fun openHomeSettings(context: Context) {
        val direct = Intent(Settings.ACTION_HOME_SETTINGS)
        try {
            if (context !is Activity) direct.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(direct)
        } catch (_: Exception) {
            val fallback = Intent(Settings.ACTION_SETTINGS)
            if (context !is Activity) fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(fallback)
        }
    }

    fun openPersonalAi(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url), context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            if (url.contains("morning")) putExtra(MorningModeLauncher.EXTRA, true)
        }
        context.startActivity(intent)
    }

    fun openExternalUrl(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            if (context !is Activity) addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }

    fun openCapture(context: Context) {
        openPersonalAi(context, "pos://os/capture")
    }
}
