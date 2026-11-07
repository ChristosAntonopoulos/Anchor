# How to Rebuild the Project After Native Code Changes

## Quick Rebuild (Android Studio)

### Step 1: Open Android Studio
1. Open Android Studio
2. Open the project: `C:\Repos\Anchor\mobile\android`

### Step 2: Rebuild Project
1. Click **Build** → **Rebuild Project**
   - Or press `Ctrl+Shift+F9` (Windows) / `Cmd+Shift+F9` (Mac)
2. Wait for build to complete (may take 1-2 minutes)

### Step 3: Run the App
1. Click the **Run** button (green play icon) or press `Shift+F10`
2. Select your device/emulator
3. App will install and launch

---

## Alternative: Command Line Rebuild

### Using Expo CLI (Recommended for React Native)

```powershell
cd C:\Repos\Anchor\mobile

# Clean and rebuild
npx expo run:android
```

This will:
- Clean the build
- Rebuild native code
- Install on connected device/emulator
- Start the app

### Using Gradle Directly

```powershell
cd C:\Repos\Anchor\mobile\android

# Clean build
.\gradlew clean

# Build debug APK
.\gradlew assembleDebug

# Install on connected device
.\gradlew installDebug
```

---

## Important Notes

### Why Rebuild is Needed
- **Native code changes** (Kotlin/Java files) require a full rebuild
- **Hot reload won't work** for native module changes
- **Manifest changes** require rebuild
- **New native modules** require rebuild

### What Requires Rebuild vs Reload

**Requires Rebuild:**
- ✅ Changes to `.kt` or `.java` files
- ✅ Changes to `AndroidManifest.xml`
- ✅ Adding new native modules
- ✅ Changing native module methods
- ✅ Adding new permissions

**Just Reload (Hot Reload):**
- ✅ Changes to `.tsx` or `.ts` files (React Native)
- ✅ Changes to styles
- ✅ Changes to component logic

---

## Troubleshooting

### "Build Failed" Error
1. **Clean build folder:**
   ```powershell
   cd C:\Repos\Anchor\mobile\android
   .\gradlew clean
   ```

2. **Invalidate caches in Android Studio:**
   - File → Invalidate Caches → Invalidate and Restart

3. **Check for syntax errors:**
   - Look at the Build output window
   - Fix any Kotlin/Java compilation errors

### "Module Not Found" Error
- Make sure you've registered new packages in `MainApplication.kt`
- Rebuild after adding new native modules

### App Crashes on Launch
- Check Logcat for errors: `adb logcat | grep -i error`
- Verify all native modules are properly registered
- Check AndroidManifest.xml for missing declarations

---

## Quick Reference

### Android Studio
```
Build → Rebuild Project
```

### Command Line
```powershell
cd mobile
npx expo run:android
```

### Check if Rebuild Worked
After rebuild, check console logs:
- Should see: `[PhoneUnlockListener] Native module available: true`
- Should see: `[OverlayPermission] Native module available: true`

If you see `false`, the rebuild didn't work - try again!
