# Hot Reload / Fast Refresh Guide

## What is Hot Reload?

When you edit code in your mobile app, **Expo Go automatically updates the app on your phone** without you having to:
- ❌ Rebuild the app
- ❌ Reinstall the app
- ❌ Restart the dev server
- ❌ Rescan the QR code

**Just save your file and watch it update on your phone!** 🚀

## Setup (One Time)

1. **Install Expo Go** on your phone
2. **Start the dev server**:
   ```bash
   cd mobile
   npm start
   ```
3. **Scan QR code** with Expo Go
4. **Keep both running**:
   - Terminal with `npm start` running
   - Expo Go app open on your phone

## How to Use

### Step 1: Make a Change

Edit any file in the `mobile/` directory. For example:

```typescript
// mobile/app/(tabs)/index.tsx
export default function HomeScreen() {
  return (
    <View>
      <Text>Hello World! 👋</Text>  // ← Change this text
    </View>
  );
}
```

### Step 2: Save the File

Press `Ctrl+S` (or `Cmd+S` on Mac) to save.

### Step 3: Watch Your Phone

Within **1-2 seconds**, you'll see:
- The terminal shows: `Fast Refresh: 1 module updated`
- Your phone screen updates automatically!

## What Updates Automatically?

### ✅ These Update Instantly:

- **React Components** - UI changes
- **Styles** - Colors, fonts, spacing
- **Text content** - Any strings or labels
- **Logic** - Functions, calculations, conditionals
- **API calls** - Service methods, endpoints
- **State management** - Zustand stores, React state
- **Navigation** - Routes, screens

### ❌ These Require Manual Reload:

- **app.json** changes - Press `r` in terminal to reload
- **Native modules** - Shake device → "Reload"
- **Package.json** changes - Restart dev server

## Developer Menu

**Shake your phone** (or press `Cmd+D` on iOS simulator) to open the developer menu:

- **Reload** - Manually reload the app
- **Debug Remote JS** - Open Chrome DevTools
- **Show Element Inspector** - Inspect UI elements
- **Performance Monitor** - See FPS and memory

## Terminal Commands

While `npm start` is running, you can press:

- **`r`** - Reload the app
- **`m`** - Open Expo DevTools in browser
- **`j`** - Open debugger
- **`a`** - Open on Android emulator
- **`i`** - Open on iOS simulator
- **`w`** - Open in web browser
- **`?`** - Show all commands

## Troubleshooting

### Changes Not Appearing?

1. **Check terminal** - Is the dev server still running?
2. **Check phone** - Is Expo Go still connected? (Look for "Connected" status)
3. **Save the file** - Make sure you actually saved (`Ctrl+S`)
4. **Check for errors** - Look at terminal for error messages
5. **Manual reload** - Shake device → "Reload"

### App Disconnected?

1. **Check Wi-Fi** - Phone and computer on same network?
2. **Rescan QR code** - The connection might have dropped
3. **Restart dev server** - Stop (`Ctrl+C`) and run `npm start` again

### Fast Refresh Not Working?

1. **Check for syntax errors** - Fix any red errors in terminal
2. **Check file saved** - Make sure changes are actually saved
3. **Try manual reload** - Shake device → "Reload"
4. **Restart dev server** - Sometimes a fresh start helps

## Best Practices

1. **Keep dev server running** - Don't close the terminal
2. **Keep app open** - Don't close Expo Go (minimize is OK)
3. **Save frequently** - Get instant feedback on changes
4. **Watch terminal** - See Fast Refresh confirmations
5. **Use TypeScript** - Catch errors before they reach your phone

## Example Workflow

```bash
# Terminal 1: Start backend (if testing locally)
cd backend/src/POS.Api
dotnet run

# Terminal 2: Start mobile app
cd mobile
npm start

# Scan QR code with Expo Go (one time)

# Now edit files and watch them update!
# Edit: mobile/app/(tabs)/index.tsx
# Save: Ctrl+S
# Watch: Phone updates automatically! ✨
```

## Pro Tips

- **Two monitors?** Keep code on one, phone on the other for instant feedback
- **Test on multiple devices** - Scan QR code on multiple phones to test different screen sizes
- **Use tunnel mode** - `npm run start:tunnel` to test from anywhere
- **Check network tab** - Use Expo DevTools to see API calls in real-time

Enjoy instant feedback! 🎉
