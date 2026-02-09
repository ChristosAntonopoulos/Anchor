# Build APK Locally with EAS

## Quick Build (Recommended)

Build the APK directly from your local machine:

```powershell
# Navigate to mobile directory
cd mobile

# Build Android APK (use npx to avoid PowerShell execution policy issues)
npx eas-cli build --platform android --profile production
```

This will:
- Build the APK in Expo's cloud (takes ~10-15 minutes)
- Show you a build URL to track progress
- Make the APK available for download when complete

## Download the APK

After the build completes:

```powershell
# Download the latest Android build
npx eas-cli build:download --latest --platform android
```

Or download from Expo dashboard:
1. Visit: https://expo.dev/accounts/botsyst3m/projects/pos-mobile/builds
2. Find your latest Android build
3. Click "Download" to get the APK

## Install on Your Phone

1. **Transfer APK to phone**:
   - Email it to yourself
   - Use cloud storage (Google Drive, Dropbox, etc.)
   - Use USB cable
   - Use ADB: `adb install pos-mobile.apk`

2. **Enable installation from unknown sources** (Android):
   - Settings → Security → Enable "Install from unknown sources"
   - Or Settings → Apps → Special access → Install unknown apps

3. **Install the APK**:
   - Open the APK file on your phone
   - Tap "Install"
   - The app will connect to: `http://185.193.66.50:31247/api`

## Build Options

### Build and Wait for Completion

```powershell
npx eas-cli build --platform android --profile production --wait
```

This will wait for the build to complete and show you when it's done.

### Build Without Waiting

```powershell
npx eas-cli build --platform android --profile production
```

This starts the build and returns immediately. Check status at:
https://expo.dev/accounts/botsyst3m/projects/pos-mobile/builds

### Build for Development

```powershell
npx eas-cli build --platform android --profile development
```

## Check Build Status

```powershell
# List recent builds
npx eas-cli build:list --platform android

# View specific build details
npx eas-cli build:view --latest --platform android
```

## Troubleshooting

### "Not authenticated"
```powershell
npx eas-cli login
```

### "Project not configured"
```powershell
npx eas-cli init
```

### "Credentials not set up"
```powershell
npx eas-cli credentials
# Select Android → Set up credentials → Let Expo manage
```

## Quick Reference

```powershell
# Login
npx eas-cli login

# Build APK
npx eas-cli build --platform android --profile production --wait

# Download APK
npx eas-cli build:download --latest --platform android

# View builds
npx eas-cli build:list --platform android
```

## What Gets Built

- **Platform**: Android
- **Build Type**: APK (installable file)
- **Profile**: Production
- **API URL**: `http://185.193.66.50:31247/api` (automatically configured)
- **Output**: `pos-mobile.apk` (or similar name)

The APK will be ~20-30 MB and ready to install on any Android device!
