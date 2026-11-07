# Phone Unlock Detection Troubleshooting

## Problem: Modal Doesn't Popup When Phone is Unlocked

### Common Causes

1. **Native Module Not Loaded** (Most Common)
   - Native modules require a **full rebuild**, not just a reload
   - Hot reload won't work for native code changes
   - Solution: Rebuild the app in Android Studio

2. **App Not Running in Background**
   - The broadcast receiver needs the app to be running
   - Solution: Keep the app running (foreground service helps)

3. **Android Version Restrictions**
   - On Android 10+, background broadcast receivers have restrictions
   - `ACTION_USER_PRESENT` may not fire if app is in background
   - Solution: Ensure app is running or use foreground service

## Quick Fixes

### Step 1: Check if Native Module is Loaded

Check the console logs when the app starts. You should see:
```
[PhoneUnlockListener] Platform: android
[PhoneUnlockListener] Native module available: true
[PhoneUnlockListener] Module name: PhoneUnlockModule
```

If you see `Native module available: false`, the module is not loaded.

### Step 2: Rebuild the App (Not Just Reload)

**In Android Studio:**
1. Click **Build** → **Rebuild Project**
2. Wait for build to complete
3. Run the app again (not just reload)

**OR using command line:**
```bash
cd mobile
npx expo run:android
```

### Step 3: Check Android Logs

Connect your device and check logs:
```bash
adb logcat | grep PhoneUnlockModule
```

You should see:
```
PhoneUnlockModule: PhoneUnlockModule initialized
PhoneUnlockModule: startListening() called
PhoneUnlockModule: Successfully registered unlock receiver
```

When you unlock the phone, you should see:
```
PhoneUnlockModule: Phone unlock detected - ACTION_USER_PRESENT
PhoneUnlockModule: Unlock event sent to React Native: [timestamp]
```

### Step 4: Test Manually

The app now includes better debugging. Check console for:
- `[RootLayout] PhoneUnlockModule available: true/false`
- `[RootLayout] Available native modules: [...]`

## Verification Checklist

- [ ] App was rebuilt (not just reloaded) after native code changes
- [ ] Console shows `Native module available: true`
- [ ] Android logs show `Successfully registered unlock receiver`
- [ ] App is running (not force-stopped)
- [ ] Testing on physical device (not emulator - unlock detection may not work in emulator)

## Testing in Emulator

Phone unlock detection may not work properly in Android emulator because:
- Emulator doesn't have a real lock screen
- `ACTION_USER_PRESENT` may not fire correctly
- Test on a **physical device** for best results

## Still Not Working?

1. **Check MainApplication.kt** - Ensure `PhoneUnlockPackage()` is added to packages
2. **Check PhoneUnlockPackage.kt** - Ensure it returns `PhoneUnlockModule(reactContext)`
3. **Check AndroidManifest.xml** - No special permissions needed for `ACTION_USER_PRESENT`
4. **Check Logs** - Look for errors in `adb logcat`
5. **Try Clean Build** - In Android Studio: Build → Clean Project, then Rebuild

## Expected Behavior

1. User locks phone
2. User unlocks phone
3. App receives `ACTION_USER_PRESENT` broadcast
4. Native module sends event to React Native
5. Modal appears asking for unlock reason

## Debug Mode

The app now logs detailed information:
- Module availability check
- Event subscription status
- Unlock event reception
- Modal state changes

Check the console/Logcat for these messages to diagnose issues.
