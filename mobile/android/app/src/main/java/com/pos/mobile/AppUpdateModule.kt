package com.pos.mobile

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

class AppUpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AppUpdateModule"

    @ReactMethod
    fun getInstalledVersionCode(promise: Promise) {
        try {
            promise.resolve(installedVersionCode().toDouble())
        } catch (error: Exception) {
            promise.reject("VERSION_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun canRequestPackageInstalls(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.resolve(true)
            return
        }
        promise.resolve(reactApplicationContext.packageManager.canRequestPackageInstalls())
    }

    @ReactMethod
    fun openInstallPermissionSettings(promise: Promise) {
        try {
            val settings = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                data = Uri.parse("package:${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startOnUi(settings)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SETTINGS_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun installApk(url: String, promise: Promise) {
        val context = reactApplicationContext
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !context.packageManager.canRequestPackageInstalls()
        ) {
            val settings = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                data = Uri.parse("package:${context.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startOnUi(settings)
            promise.reject(
                "INSTALL_PERMISSION",
                "Allow installs from this app, then the update continues."
            )
            return
        }

        Thread {
            try {
                val apk = download(url)
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    apk
                )
                val install = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startOnUi(install)
                promise.resolve(true)
            } catch (error: Exception) {
                promise.reject("DOWNLOAD_FAILED", error.message, error)
            }
        }.start()
    }

    private fun installedVersionCode(): Long {
        val pm = reactApplicationContext.packageManager
        val pkg = reactApplicationContext.packageName
        val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageInfo(pkg, 0)
        }
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            info.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            info.versionCode.toLong()
        }
    }

    private fun startOnUi(intent: Intent) {
        val context = reactApplicationContext
        context.runOnUiQueueThread {
            val host = context.currentActivity ?: context
            host.startActivity(intent)
        }
    }

    private fun download(url: String): File {
        val context = reactApplicationContext
        val partial = File(context.cacheDir, "pos-update.apk.part")
        val destination = File(context.cacheDir, "pos-update.apk")
        if (partial.exists()) {
            partial.delete()
        }

        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            connectTimeout = 20_000
            readTimeout = 300_000
            requestMethod = "GET"
        }

        try {
            connection.connect()
            if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                throw IllegalStateException("Update download returned HTTP ${connection.responseCode}")
            }

            connection.inputStream.use { input ->
                FileOutputStream(partial).use { output ->
                    input.copyTo(output)
                }
            }
        } finally {
            connection.disconnect()
        }

        if (partial.length() < 1024L || !partial.startsWithZipHeader()) {
            partial.delete()
            throw IllegalStateException("Downloaded file was not an APK")
        }

        if (destination.exists()) {
            destination.delete()
        }
        if (!partial.renameTo(destination)) {
            partial.delete()
            throw IllegalStateException("Could not store the update")
        }
        return destination
    }

    private fun File.startsWithZipHeader(): Boolean {
        return inputStream().use { input ->
            val header = ByteArray(2)
            input.read(header) == 2 && header[0] == 0x50.toByte() && header[1] == 0x4B.toByte()
        }
    }
}
