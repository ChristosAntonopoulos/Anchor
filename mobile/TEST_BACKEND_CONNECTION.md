# Testing Backend Connection from Mobile Device

## Quick Test Steps

### Step 1: Start Backend

```powershell
cd backend\src\POS.Api
dotnet run
```

You should see:
```
Now listening on: http://0.0.0.0:5000
```

### Step 2: Test from Mobile Browser (Easiest Method)

1. **Make sure your phone is on the same Wi-Fi network as your computer**

2. **Open browser on your phone** (Safari on iOS, Chrome on Android)

3. **Navigate to:**
   ```
   http://192.168.1.43:5000/api/health
   ```

4. **Expected Result:**
   - ✅ **Success**: You should see JSON response like:
     ```json
     {
       "status": "healthy",
       "timestamp": "2026-01-XX...",
       "database": "connected"
     }
     ```
   - ❌ **Failure**: Connection error, timeout, or "This site can't be reached"

### Step 3: Test from Mobile App

1. **Update mobile app config** (`mobile/constants/apiConfig.ts`):
   ```typescript
   const DEV_API_BASE_URL = 'http://192.168.1.43:5000/api';
   ```

2. **Start mobile app:**
   ```powershell
   cd mobile
   npm start
   ```

3. **Open app on your device** and check if data loads

4. **Check for errors** in the app or Expo console

---

## Troubleshooting

### ❌ "This site can't be reached" or "Connection refused"

**Possible causes:**

1. **Backend not running**
   - Check: Is `dotnet run` still running?
   - Solution: Start backend again

2. **Wrong IP address**
   - Check: Run `ipconfig` on your computer
   - Look for "IPv4 Address" under Wi-Fi adapter
   - Update the URL with correct IP

3. **Different Wi-Fi networks**
   - Check: Phone and computer must be on **same Wi-Fi**
   - Solution: Connect both to same network

4. **Windows Firewall blocking**
   - Check: Windows Firewall may block port 5000
   - Solution: 
     - Open Windows Defender Firewall
     - Click "Allow an app through firewall"
     - Add exception for port 5000
     - Or temporarily disable firewall for testing

5. **Backend binding to localhost only**
   - Check: `launchSettings.json` should have `http://0.0.0.0:5000`
   - Solution: Already configured ✅

### ❌ "Network Error" in Mobile App

1. **Check API config** - Make sure IP is correct in `apiConfig.ts`
2. **Check backend is running** - Verify `dotnet run` is active
3. **Check browser test** - If browser test fails, app will also fail
4. **Check console logs** - Look for specific error messages

### ✅ Browser Works, But App Doesn't

1. **Check CORS** - Backend CORS is configured, but verify in browser console
2. **Check API endpoint** - Make sure app is calling correct endpoint
3. **Check network logs** - Use Expo DevTools or React Native Debugger

---

## Alternative Test Methods

### Method 1: Use curl on Phone (Advanced)

If you have terminal access on your phone:
```bash
curl http://192.168.1.43:5000/api/health
```

### Method 2: Use Postman/Insomnia on Phone

1. Install Postman mobile app
2. Create GET request to: `http://192.168.1.43:5000/api/health`
3. Send request

### Method 3: Test from Another Computer

1. Connect another computer to same Wi-Fi
2. Open browser: `http://192.168.1.43:5000/api/health`
3. If this works, mobile should also work

---

## Quick Checklist

Before testing, verify:

- [ ] Backend is running (`dotnet run` shows "Now listening on: http://0.0.0.0:5000")
- [ ] Phone and computer on same Wi-Fi network
- [ ] Correct IP address (run `ipconfig` to verify)
- [ ] Port 5000 is not blocked by firewall
- [ ] Browser test works first (before testing app)

---

## Expected Test Results

### ✅ Success Indicators

**Browser Test:**
- Page loads and shows JSON response
- No error messages
- Response includes `"status": "healthy"`

**Mobile App Test:**
- App loads data from backend
- No "Network Error" messages
- Data appears in app (tasks, schedule, etc.)

### ❌ Failure Indicators

**Browser Test:**
- "This site can't be reached"
- "Connection refused"
- Timeout error
- Blank page

**Mobile App Test:**
- "Network Error" message
- "Failed to fetch" error
- App shows empty/loading state indefinitely
- Console shows connection errors

---

## Next Steps After Successful Test

Once browser test works:

1. ✅ Update `mobile/constants/apiConfig.ts` with your IP
2. ✅ Start mobile app
3. ✅ Test full app functionality
4. ✅ Verify data loads from backend
