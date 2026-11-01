# Running in Android Studio Emulator

## Step 1: Set Up Android Emulator

1. **Open Android Studio**
   - Launch Android Studio
   - If this is your first time, it will download Android SDK components

2. **Open AVD Manager** (Android Virtual Device Manager)
   - Click **Tools** → **Device Manager** (or **AVD Manager** in older versions)
   - Or click the device icon in the toolbar

3. **Create a Virtual Device**
   - Click **Create Device** (or **+ Create Virtual Device**)
   - Choose a device (e.g., **Pixel 5** or **Pixel 6**)
   - Click **Next**

4. **Select System Image**
   - Choose a recent Android version (e.g., **Android 13 (Tiramisu)** or **Android 14**)
   - If you see "Download" next to it, click to download first
   - Click **Next**

5. **Finish Setup**
   - Review the configuration
   - Click **Finish**

6. **Start the Emulator**
   - Click the **Play** button (▶) next to your device
   - Wait for the emulator to boot (may take 1-2 minutes first time)

## Step 2: Configure API for Emulator

The Android emulator uses a special IP address to access your computer:

- **`10.0.2.2`** = Your computer's `localhost` from the emulator's perspective
- If your backend runs on `localhost:5000`, the emulator should use `http://10.0.2.2:5000/api`

### Option A: Connect to Local Backend

If you're running the backend locally on your computer:

1. **Update API Config** (`mobile/constants/apiConfig.ts`):
   ```typescript
   const DEV_API_BASE_URL = 'http://10.0.2.2:5000/api';
   ```

2. **Start your backend**:
   ```powershell
   cd backend\src\POS.Api
   dotnet run
   ```

### Option B: Connect to Production Backend

The app is already configured to use the production backend by default. No changes needed!

The production URL (`http://185.193.66.50:31247/api`) works from anywhere, including the emulator.

## Step 3: Run the App in Emulator

### Method 1: Using Expo CLI (Recommended)

1. **Make sure the emulator is running** (you should see it on your screen)

2. **Start Expo**:
   ```powershell
   cd mobile
   npm start
   ```

3. **Press `a` in the terminal** to open on Android emulator
   - Or wait - Expo will automatically detect the emulator and ask if you want to open it

4. The app will build and launch in the emulator automatically!

### Method 2: Using Expo Run Command

```powershell
cd mobile
npm run android
```

This will:
- Build the native Android app
- Install it on the emulator
- Launch it automatically

**Note**: This method requires the Android SDK to be properly configured. If you get errors, use Method 1 instead.

## Step 4: Verify Connection

Once the app opens in the emulator:

1. **Check the console** - You should see:
   ```
   🔗 API Base URL: http://185.193.66.50:31247/api
   ```

2. **Test the app** - Navigate through the app and verify data loads from the backend

3. **Check for errors** - If you see "No discipline data available" or similar, check:
   - Is the backend running? (if using local backend)
   - Is the API URL correct in the console?
   - Are there any network errors in the terminal?

## Troubleshooting

### Emulator Not Detected

1. **Check ADB**:
   ```powershell
   adb devices
   ```
   You should see your emulator listed. If not:
   - Restart the emulator
   - Restart Android Studio
   - Check that Android SDK is installed

2. **Check PATH**:
   - Make sure Android SDK is in your PATH
   - Usually: `C:\Users\YourName\AppData\Local\Android\Sdk\platform-tools`

### App Won't Connect to Backend

1. **For Local Backend**:
   - Make sure backend is running: `dotnet run`
   - Use `10.0.2.2` not `localhost` in API config
   - Test in emulator browser: `http://10.0.2.2:5000/api/health`

2. **For Production Backend**:
   - The URL should be: `http://185.193.66.50:31247/api`
   - Test in emulator browser: `http://185.193.66.50:31247/api/health`
   - Check console logs for the actual URL being used

### "Cannot find Android SDK"

1. **Set ANDROID_HOME**:
   ```powershell
   # Find your SDK path (usually in Android Studio settings)
   # Then set:
   $env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
   ```

2. **Add to PATH**:
   - Add `%ANDROID_HOME%\platform-tools` to your system PATH
   - Restart terminal after changing PATH

### Build Errors

If `npm run android` fails:

1. **Use `npm start` instead** - This uses Expo's managed workflow
2. **Check Android Studio** - Make sure SDK is fully installed
3. **Check Java** - Android Studio should have installed JDK automatically

## Quick Reference

### Start Emulator
- Open Android Studio → Device Manager → Click Play button

### Run App
```powershell
cd mobile
npm start
# Then press 'a' when prompted
```

### API URLs for Emulator
- **Local backend**: `http://10.0.2.2:5000/api`
- **Production backend**: `http://185.193.66.50:31247/api` (already configured)

### Hot Reload
- Changes to code will automatically reload in the emulator
- Shake emulator (or press `Ctrl+M`) to open developer menu
- Press `r` in terminal to manually reload

## Next Steps

Once the app is running in the emulator:
- ✅ Make code changes and see them update instantly
- ✅ Test all features with the production backend
- ✅ Debug using Chrome DevTools (shake device → "Debug Remote JS")
- ✅ Test on physical device when ready (build APK or use Expo Go)
