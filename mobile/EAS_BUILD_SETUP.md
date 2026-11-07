# EAS Build Setup Guide

## Overview

The mobile app is configured to automatically build Android APK files using Expo's EAS Build service whenever code is pushed to the repository. The APK will be available as a downloadable artifact in Azure DevOps.

## Prerequisites

1. **Expo Account** (free): https://expo.dev/signup
2. **EAS Build Access Token**: Required for automated builds

## Step 1: Create Expo Account

If you don't have an Expo account:

1. Go to https://expo.dev/signup
2. Sign up with your email or GitHub account
3. Verify your email address

## Step 2: Generate EAS Access Token

1. **Login to Expo**: https://expo.dev/login
2. **Go to Account Settings**: 
   - Click your profile icon (top right)
   - Select "Account Settings"
   - Or go directly to: https://expo.dev/accounts/[your-username]/settings/access-tokens
3. **Create Access Token**:
   - Click "Create Token"
   - Name it: `Azure Pipeline` (or any name you prefer)
   - Select scope: `Build` (or `Full Access` for simplicity)
   - Click "Create"
   - **Copy the token immediately** (you won't be able to see it again!)

## Step 3: Add Token to Azure DevOps

1. **Go to Azure DevOps**:
   - Navigate to your project
   - Go to **Pipelines** → **Library**
2. **Open Variable Group**:
   - Click on `POS-Secrets` variable group
   - (If it doesn't exist, create it first)
3. **Add EXPO_TOKEN**:
   - Click **+ Add** to add a new variable
   - **Name**: `EXPO_TOKEN`
   - **Value**: Paste the token you copied from Expo
   - **Mark as secret**: ✅ Check this box (important!)
   - Click **Save**

## Step 4: Grant Pipeline Access

1. In the `POS-Secrets` variable group, click **Pipeline permissions**
2. Click **+** to add pipeline
3. Select your pipeline (or allow all pipelines)
4. Click **Save**

## Step 5: Test the Build

1. **Push code to repository** (or manually trigger pipeline)
2. **Pipeline will automatically**:
   - Build the backend
   - Deploy to Kubernetes
   - Build Android APK using EAS
3. **Wait for build** (~15 minutes for first build)
4. **Download APK**:
   - Go to Azure DevOps → Pipelines → Latest run
   - Click on **Artifacts**
   - Download `mobile-apk` artifact
   - Transfer to your Android phone
   - Install the APK

## Build Configuration

The build is configured in `mobile/eas.json`:

- **Profile**: `production`
- **Platform**: Android
- **Build Type**: APK (installable file)
- **API URL**: Automatically set to `http://185.193.66.50:31247/api`

## Troubleshooting

### Build Fails with "EXPO_TOKEN not set"

- Verify `EXPO_TOKEN` is added to `POS-Secrets` variable group
- Check that the variable is marked as **secret**
- Verify pipeline has access to the variable group (Pipeline permissions)

### Build Fails with "Authentication failed"

- Token may have expired or been revoked
- Generate a new token from Expo dashboard
- Update `EXPO_TOKEN` in Azure DevOps variable group

### Build Takes Too Long

- First build: ~20 minutes (downloads dependencies)
- Subsequent builds: ~10-15 minutes
- Check build status at: https://expo.dev/accounts/[username]/projects/pos-mobile/builds

### APK Not Available in Artifacts

- Build may still be in progress (check pipeline logs)
- Build may have failed (check Expo dashboard)
- Check pipeline logs for error messages

## Free Tier Limits

EAS Build free tier includes:
- **30 builds per month** (plenty for development)
- **Build time**: Up to 30 minutes per build
- **Storage**: 1 GB

For more builds, consider upgrading to a paid plan.

## Manual Build (Alternative)

If you want to build manually instead of using the pipeline:

```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

Then download from: https://expo.dev/accounts/[username]/projects/pos-mobile/builds

## Next Steps

After setup:
1. Push code to trigger automatic build
2. Download APK from Azure DevOps artifacts
3. Install on your phone
4. App automatically connects to production API

No terminal needed! 🎉
