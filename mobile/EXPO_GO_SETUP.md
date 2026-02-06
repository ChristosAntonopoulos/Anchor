# Running Mobile App with Expo Go

## Quick Start

The mobile app can be run on your phone using **Expo Go** without building a native app. This is perfect for development and testing.

## Prerequisites

1. **Install Expo Go** on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Install dependencies** (if not already done):
   ```bash
   cd mobile
   npm install
   ```

## Running the App

### Option 1: Local Network (Same Wi-Fi)

1. **Start the Expo development server**:
   ```bash
   cd mobile
   npm start
   ```

2. **Scan the QR code**:
   - **iOS**: Open Camera app and scan the QR code
   - **Android**: Open Expo Go app and tap "Scan QR code"

3. The app will load on your phone and connect to the backend API.

### Option 2: Tunnel Mode (Access from Anywhere)

If you want to access the app from anywhere (not just same Wi-Fi):

```bash
cd mobile
npm run start:tunnel
```

This uses Expo's tunnel service to make your dev server accessible from anywhere. Scan the QR code as above.

### Option 3: Use Production API

To test against the deployed production API:

```bash
cd mobile
npm run start:production
```

This will:
- Use the production API at `http://185.193.66.50:31247/api`
- Still run the app in development mode (hot reload, etc.)
- Allow you to test with real production data

## API Configuration

The app automatically uses:
- **Development mode**: Local API (if running backend locally) or production API
- **Production mode**: Production API at `http://185.193.66.50:31247/api`

You can override the API URL by setting the `EXPO_PUBLIC_API_URL` environment variable:

```bash
EXPO_PUBLIC_API_URL=http://185.193.66.50:31247/api npm start
```

## Troubleshooting

### Can't Connect to Backend

1. **Check API URL**: Make sure the API URL in `mobile/constants/apiConfig.ts` is correct
2. **Check Backend Status**: Verify the backend is running and accessible
3. **Network Issues**: 
   - For local network: Ensure phone and computer are on same Wi-Fi
   - For tunnel: Check internet connection on both devices

### QR Code Not Working

1. **Update Expo Go**: Make sure you have the latest version
2. **Try Manual Connection**: In Expo Go, tap "Enter URL manually" and enter the URL shown in terminal
3. **Check Firewall**: Ensure your firewall isn't blocking Expo

### App Shows "Network Error"

1. **Verify Backend**: Check that the backend API is accessible:
   ```bash
   curl http://185.193.66.50:31247/api/health
   ```
2. **Check API Config**: Verify `mobile/constants/apiConfig.ts` has the correct URL
3. **Check CORS**: Ensure backend allows requests from your device

## Development Workflow

1. **Start Backend** (if testing locally):
   ```bash
   cd backend/src/POS.Api
   dotnet run
   ```

2. **Start Mobile App**:
   ```bash
   cd mobile
   npm start
   ```

3. **Scan QR Code** with Expo Go

4. **Make Changes**: Edit code and see changes instantly (hot reload)

## Production Builds

For production builds (not Expo Go), you'll need to:
1. Build with EAS Build or Expo CLI
2. Set `EXPO_PUBLIC_API_URL` during build
3. Distribute via App Store / Play Store

See Expo documentation for production build instructions.
