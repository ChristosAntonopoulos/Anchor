# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Notification Listener Native Module
# Keep all notification listener classes to prevent ProGuard from stripping them
-keep class com.pos.mobile.NotificationListenerModule { *; }
-keep class com.pos.mobile.NotificationListenerPackage { *; }
-keep class com.pos.mobile.POSNotificationListenerService { *; }

# Keep all React Native bridge methods
-keepclassmembers class com.pos.mobile.NotificationListenerModule {
    @com.facebook.react.bridge.ReactMethod *;
}

# Keep the service and its methods
-keepclassmembers class com.pos.mobile.POSNotificationListenerService {
    *;
}

# Add any project specific keep options here:
