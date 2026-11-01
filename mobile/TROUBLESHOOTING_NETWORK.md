# Troubleshooting Network Connection Issues

## Problem: "Network error. Cannot reach backend at http://185.193.66.50:31247/api"

### Common Causes

1. **Android Blocks HTTP (Cleartext Traffic)**
   - ✅ **Fixed**: Added `usesCleartextTraffic: true` to `app.json`
   - **Action**: Restart Expo Go or rebuild the app

2. **Phone Cannot Reach Server IP**
   - The server IP `185.193.66.50` must be accessible from your phone's network
   - Check if you can access it from a browser on your phone: `http://185.193.66.50:31247/api/health`
   - If it doesn't work in browser, the phone can't reach the server

3. **Firewall or Network Restrictions**
   - Corporate/school networks often block external IPs
   - Try using mobile data instead of Wi-Fi
   - Check if your network allows connections to port 31247

4. **Server Not Running**
   - Verify backend is running: `curl http://185.193.66.50:31247/api/health`
   - Should return: `{"status":"healthy",...}`

### Quick Tests

#### Test 1: Check Backend from Phone Browser
1. Open browser on your phone
2. Go to: `http://185.193.66.50:31247/api/health`
3. If you see JSON response → Backend is reachable
4. If you see error/timeout → Network issue

#### Test 2: Check from Computer
```powershell
curl.exe http://185.193.66.50:31247/api/health
```
Should return: `{"status":"healthy",...}`

#### Test 3: Check API URL in App
1. Open Expo Go
2. Check console logs for: `🔗 API Base URL: http://185.193.66.50:31247/api`
3. If URL is wrong, check `mobile/constants/apiConfig.ts`

### Solutions

#### Solution 1: Use Mobile Data
If Wi-Fi blocks the server, try:
1. Disconnect from Wi-Fi
2. Use mobile data
3. Restart Expo Go
4. Try again

#### Solution 2: Check Network Security Config
The app now has `usesCleartextTraffic: true` in `app.json`. If still not working:
1. Close Expo Go completely
2. Restart Expo dev server: `npm start`
3. Reconnect to Expo Go

#### Solution 3: Verify Server is Accessible
Test from your phone's browser:
- Open: `http://185.193.66.50:31247/api/health`
- If it works → App should work too
- If it doesn't → Server/network issue

#### Solution 4: Check Console Logs
In Expo Go, check the console for:
- `🔗 API Base URL: http://185.193.66.50:31247/api` (should show correct URL)
- `🌐 API Request: GET /today` (should show request)
- `❌ API Error: ...` (will show detailed error)

### Expected Console Output (Success)
```
🔗 API Base URL: http://185.193.66.50:31247/api
🌐 API Request: GET /today
🌐 Base URL: http://185.193.66.50:31247/api
✅ API Response: 200 /today
✅ Today data received: { hasDiscipline: true, ... }
```

### Expected Console Output (Failure)
```
🔗 API Base URL: http://185.193.66.50:31247/api
🌐 API Request: GET /today
🌐 Base URL: http://185.193.66.50:31247/api
❌ API Error: { code: 'ERR_NETWORK', message: 'Network Error', ... }
```

### Still Not Working?

1. **Check if server is accessible from phone browser**
2. **Try using mobile data instead of Wi-Fi**
3. **Check firewall/network settings**
4. **Verify the server IP is correct**: `185.193.66.50:31247`
5. **Check Expo Go console for detailed error messages**
