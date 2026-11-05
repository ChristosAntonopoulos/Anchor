# Android Notification Listener Setup

## Overview

The POS app can now access notifications from all Android apps using the `NotificationListenerService`. This allows the app to automatically detect task-relevant information from notifications (meetings, reminders, emails, etc.) and help create tasks automatically.

## How It Works

1. **User enables notification access** in Android Settings
2. **Service listens** to all app notifications in real-time
3. **Notifications are processed** and checked for task-relevant keywords
4. **Task-relevant notifications** can be automatically submitted to AI for processing

## Setup Instructions

### For Users

1. **Open the app** - You'll see a prompt on the Dashboard
2. **Tap "Open Settings"** button
3. **Find "Personal Operating System"** in the notification access list
4. **Toggle it ON**
5. **Return to the app** - The prompt will show "Notification access enabled"

### For Developers

The implementation includes:

- **Native Android Service** (`POSNotificationListenerService.kt`)
- **React Native Bridge** (`NotificationListenerModule.kt`)
- **TypeScript Service** (`services/notificationListener.ts`)
- **UI Component** (`components/notifications/NotificationAccessPrompt.tsx`)
- **Zustand Store** (`store/useNotificationStore.ts`)

## What Data is Captured

For each notification, the app captures:
- **Title** - Notification title
- **Text** - Notification content
- **SubText** - Additional text (if available)
- **Package Name** - Which app sent the notification
- **Timestamp** - When the notification was posted
- **Tag** - Notification tag (if available)

## Task Detection

The app automatically detects task-relevant notifications by checking for keywords:
- meeting, call, deadline, due, reminder, task, todo
- appointment, event, schedule, meet, conference
- zoom, teams, calendar, email, message
- urgent, important

When a task-relevant notification is detected, it's logged and can be automatically submitted to the AI input processor.

## Privacy & Security

- **User Control**: Users must explicitly enable notification access
- **No Data Storage**: Notifications are processed in real-time, not stored permanently
- **App Filtering**: Notifications from the POS app itself are ignored
- **Android Permissions**: Requires `BIND_NOTIFICATION_LISTENER_SERVICE` permission

## Limitations

- **Android Only**: This feature only works on Android devices
- **User Permission Required**: Users must manually enable in Settings
- **Encrypted Apps**: Cannot read full content from encrypted messaging apps (WhatsApp, Signal)
- **Notification Previews Only**: For encrypted apps, only notification previews are available

## Testing

1. Build the Android app: `cd mobile && npx expo run:android`
2. Enable notification access in Settings
3. Send a test notification from another app
4. Check logs: `adb logcat | grep POSNotificationListener`
5. Verify notifications appear in the store

## Future Enhancements

- Auto-submit task-relevant notifications to AI input
- Filter notifications by app (e.g., only calendar, email)
- Notification history view
- Smart task extraction using AI
- Integration with schedule blocks
