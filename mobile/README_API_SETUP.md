# Connecting Mobile App to Local Backend

## The Problem

When running the backend on your local machine (Visual Studio), the mobile app needs to connect to it. However:

- **`localhost`** on a physical device refers to the device itself, not your computer
- **iOS Simulator** can use `localhost` (it shares the host network)
- **Android Emulator** needs `10.0.2.2` instead of `localhost`
- **Physical Device** needs your computer's IP address

## Quick Setup Guide

### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

### Step 2: Update API Configuration

Edit `mobile/constants/apiConfig.ts`:

```typescript
// Replace this line:
const DEV_API_BASE_URL = 'http://localhost:5000/api';

// With your IP address:
const DEV_API_BASE_URL = 'http://192.168.1.100:5000/api';
```

### Step 3: Check Backend Port

The backend runs on:
- **HTTP**: Port `5000` (check `backend/src/POS.Api/Properties/launchSettings.json`)
- **HTTPS**: Port `7246`

Make sure the port in `apiConfig.ts` matches your backend port.

### Step 4: Ensure Same Network

- Your computer and phone must be on the **same Wi-Fi network**
- Firewall must allow connections on the backend port

### Step 5: Test Connection

1. Start backend: `cd backend/src/POS.Api && dotnet run`
2. Verify backend is accessible: Open browser to `http://YOUR_IP:5000/api/health`
3. Start mobile app: `cd mobile && npm start`
4. Test in app - data should load from backend

## Platform-Specific Notes

### iOS Simulator
- Can use `localhost:5000/api` directly
- Shares host network

### Android Emulator
- Use `10.0.2.2:5000/api` instead of `localhost`
- `10.0.2.2` is a special alias for the host machine

### Physical Device (iOS/Android)
- Must use your computer's IP address
- Example: `http://192.168.1.100:5000/api`
- Both devices must be on same Wi-Fi network

## Troubleshooting

### "Network Error" or "Connection Refused"

1. **Check IP Address**: Make sure you're using the correct IP
2. **Check Port**: Verify backend is running on the expected port
3. **Check Firewall**: Windows Firewall may be blocking the connection
   - Add exception for port 5000
   - Or temporarily disable firewall for testing
4. **Check Network**: Ensure phone and computer are on same Wi-Fi
5. **Check Backend**: Verify backend is running and accessible from browser

### "CORS Error"

- Backend CORS is already configured for Expo ports
- If you see CORS errors, check `backend/src/POS.Api/Program.cs` CORS settings

### Backend Not Accessible

1. Check backend is running: `dotnet run` in `backend/src/POS.Api`
2. Test in browser: `http://localhost:5000/api/health`
3. Test with IP: `http://YOUR_IP:5000/api/health`
4. If browser works but app doesn't, check firewall settings

## Alternative: Using ngrok (For Testing)

If you can't use local IP (e.g., different networks), you can use ngrok:

1. Install ngrok: `npm install -g ngrok`
2. Start backend: `dotnet run`
3. Create tunnel: `ngrok http 5000`
4. Use ngrok URL in `apiConfig.ts`: `https://xxxx.ngrok.io/api`

## Development vs Production

- **Development**: Uses local IP or localhost
- **Production**: Uses `EXPO_PUBLIC_API_URL` environment variable or default production URL
