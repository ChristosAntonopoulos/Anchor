# Quick Start: Connect Mobile App to Backend

## Your Setup

- **Your Computer IP**: `192.168.1.43`
- **Backend Port**: `5000` (HTTP)
- **Backend URL**: `http://192.168.1.43:5000/api`

## Step-by-Step Setup

### 1. Update Mobile App Configuration

Edit `mobile/constants/apiConfig.ts` line 19:

```typescript
// For Physical Device (use your IP):
const DEV_API_BASE_URL = 'http://192.168.1.43:5000/api';
```

### 2. Start Backend

```powershell
cd backend\src\POS.Api
dotnet run
```

The backend will start on `http://0.0.0.0:5000` (accessible from network).

### 3. Test Backend is Accessible

Open in browser on your computer:
- `http://localhost:5000/api/health` ✅ Should work
- `http://192.168.1.43:5000/api/health` ✅ Should work

### 4. Start Mobile App

```powershell
cd mobile
npm start
```

### 5. Test on Device

- **iOS Simulator**: Works with `localhost:5000/api`
- **Android Emulator**: Use `10.0.2.2:5000/api`
- **Physical Device**: Use `192.168.1.43:5000/api` (must be on same Wi-Fi)

## Important Notes

### ✅ Local Network Access (What You Need)

- `192.168.1.43` works when:
  - Phone and computer are on **same Wi-Fi network**
  - Backend is running
  - Firewall allows port 5000

### ❌ Internet Access (NOT What You Need)

- `192.168.1.43` is a **private IP** - NOT accessible from internet
- This is **good for security** - only devices on your network can access it
- For internet access, you'd need ngrok or similar (not needed for development)

## Troubleshooting

### "Network Error" on Phone

1. **Check Same Wi-Fi**: Phone and computer must be on same network
2. **Check Backend Running**: `dotnet run` should show "Now listening on: http://0.0.0.0:5000"
3. **Test in Browser**: `http://192.168.1.43:5000/api/health` should work
4. **Check Firewall**: Windows Firewall may block port 5000
   - Add exception or temporarily disable for testing

### "Connection Refused"

- Backend might be binding to `localhost` only
- Solution: Use `http://0.0.0.0:5000` in `launchSettings.json` (already updated)

### CORS Errors

- Backend CORS is configured for Expo
- If you see CORS errors, check `Program.cs` CORS settings

## Summary

**For Local Development:**
- ✅ Use `192.168.1.43:5000/api` in mobile app
- ✅ Both devices on same Wi-Fi
- ✅ Backend binds to `0.0.0.0:5000` (already configured)
- ✅ Works on local network only (secure)

**For Internet Access (Not Needed):**
- Would require ngrok or similar tunneling service
- Not necessary for development
