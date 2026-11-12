package com.pos.mobile.launcher

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.LauncherApps
import android.graphics.drawable.Drawable
import android.os.Process
import android.os.UserHandle
import android.os.UserManager

data class LaunchableApp(
    val label: String,
    val packageName: String,
    val className: String,
    val user: UserHandle,
    val userSerial: Long,
) {
    fun component() = ComponentName(packageName, className)
    fun asFavorite() = FavoriteApp(packageName, className, userSerial, label)
}

data class DockApp(
    val label: String,
    val mark: DockMark,
    val packages: List<String>,
    val names: List<String> = listOf(label),
)

object InstalledApps {
    const val WALLET = "com.google.android.apps.walletnfcrel"
    const val CHATGPT = "com.openai.chatgpt"
    const val SPOTIFY = "com.spotify.music"
    val WALLET_APP = DockApp("Wallet", DockMark.WALLET, listOf(WALLET, "com.google.android.apps.nbu.paisa.user", "com.samsung.android.spay", "com.samsung.android.spaylite"), listOf("Wallet", "Google Wallet", "GPay", "Samsung Pay"))
    val CHATGPT_APP = DockApp("ChatGPT", DockMark.CHAT, listOf(CHATGPT), listOf("ChatGPT"))
    val CURSOR_APP = DockApp("Cursor", DockMark.CURSOR, listOf("com.anysphere.cursor", "com.todesktop.20100701"), listOf("Cursor"))
    val SPOTIFY_APP = DockApp("Spotify", DockMark.SPOTIFY, listOf(SPOTIFY, "com.spotify.lite"), listOf("Spotify"))

    fun list(context: Context): List<LaunchableApp> {
        val launcherApps = context.getSystemService(LauncherApps::class.java) ?: return emptyList()
        val users = context.getSystemService(UserManager::class.java)
        val profiles = launcherApps.profiles ?: listOf(Process.myUserHandle())
        val apps = mutableListOf<LaunchableApp>()
        profiles.forEach { profile ->
            val serial = try {
                users?.getSerialNumberForUser(profile) ?: 0L
            } catch (_: Exception) {
                0L
            }
            val activities = try {
                launcherApps.getActivityList(null, profile)
            } catch (_: Exception) {
                emptyList()
            }
            activities.forEach { info ->
                val component = info.componentName ?: return@forEach
                apps.add(
                    LaunchableApp(
                        label = info.label?.toString().orEmpty().ifBlank { component.packageName },
                        packageName = component.packageName,
                        className = component.className,
                        user = profile,
                        userSerial = serial,
                    )
                )
            }
        }
        return apps.distinctBy { "${it.userSerial}/${it.packageName}/${it.className}" }
            .sortedBy { it.label.lowercase() }
    }

    fun matchRank(label: String, packageName: String, query: String): Int? {
        val needle = query.trim().lowercase()
        if (needle.isEmpty()) return 0
        val name = label.lowercase()
        return when {
            name.startsWith(needle) -> 0
            name.contains(needle) -> 1
            packageName.lowercase().contains(needle) -> 2
            else -> null
        }
    }

    fun search(apps: List<LaunchableApp>, query: String): List<LaunchableApp> {
        val needle = query.trim()
        if (needle.isEmpty()) return apps
        return apps.mapNotNull { app ->
            val rank = matchRank(app.label, app.packageName, needle) ?: return@mapNotNull null
            rank to app
        }.sortedWith(compareBy({ it.first }, { it.second.label.lowercase() })).map { it.second }
    }

    fun launch(context: Context, app: LaunchableApp): Boolean {
        val launched = start(context, app)
        if (launched) RecentApps.remember(context, app)
        return launched
    }

    private fun start(context: Context, app: LaunchableApp): Boolean {
        val launcherApps = context.getSystemService(LauncherApps::class.java)
        if (launcherApps != null) {
            try {
                launcherApps.startMainActivity(app.component(), app.user, null, null)
                return true
            } catch (_: Exception) {
            }
        }
        return try {
            val intent = context.packageManager.getLaunchIntentForPackage(app.packageName) ?: return false
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
            context.startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    fun launchFavorite(context: Context, favorite: FavoriteApp): Boolean {
        val match = resolve(context, favorite) ?: return false
        return launch(context, match)
    }

    fun resolve(context: Context, favorite: FavoriteApp): LaunchableApp? {
        return list(context).find {
            it.packageName == favorite.packageName &&
                it.className == favorite.className &&
                it.userSerial == favorite.userSerial
        } ?: list(context).find {
            it.packageName == favorite.packageName && it.className == favorite.className
        }
    }

    fun findPackage(context: Context, packageName: String): LaunchableApp? {
        return list(context).find { it.packageName == packageName }
    }

    fun resolveDock(context: Context, target: DockApp): LaunchableApp? {
        target.packages.forEach { pkg ->
            findPackage(context, pkg)?.let { return it }
        }
        val apps = list(context)
        target.names.forEach { name ->
            apps.find { it.label.equals(name, ignoreCase = true) }?.let { return it }
        }
        return apps.find { app ->
            target.names.any { name -> app.label.contains(name, ignoreCase = true) }
        }
    }

    fun icon(context: Context, app: LaunchableApp): Drawable? {
        return try {
            val launcherApps = context.getSystemService(LauncherApps::class.java)
            if (launcherApps != null) {
                val match = launcherApps.getActivityList(app.packageName, app.user)
                    .find { it.componentName?.className == app.className }
                    ?: launcherApps.getActivityList(app.packageName, app.user).firstOrNull()
                match?.getBadgedIcon(0)?.let { return it }
            }
            context.packageManager.getApplicationIcon(app.packageName)
        } catch (_: Exception) {
            null
        }
    }

    fun openDock(context: Context, target: DockApp): Boolean {
        val app = resolveDock(context, target)
        if (app != null && launch(context, app)) return true
        if (target === WALLET_APP) {
            return try {
                val intent = Intent(Intent.ACTION_MAIN).addCategory("android.intent.category.APP_WALLET")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
                context.startActivity(intent)
                true
            } catch (_: Exception) {
                false
            }
        }
        return false
    }

    fun openWallet(context: Context): Boolean = openDock(context, WALLET_APP)
}
