# Fix Android "Network request failed" Error

## The Problem
Android 9+ blocks HTTP connections for security. Your backend is HTTP, so the app can't connect.

## The Solution: Use ngrok HTTPS Tunnel

### Step 1: Open the ngrok window
Look for a PowerShell window that just opened with ngrok running.

### Step 2: Find the HTTPS URL
In the ngrok window, you'll see something like:
```
Forwarding    https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:5002
```

Copy the HTTPS URL (starts with https://)

### Step 3: Update your .env file
Replace this line in `.env`:
```
EXPO_PUBLIC_API_URL=http://192.168.10.186:5002
```

With your ngrok URL:
```
EXPO_PUBLIC_API_URL=https://xxxx-xx-xx-xx-xx.ngrok-free.app
```

### Step 4: Restart Expo
Press Ctrl+C in the Expo terminal, then run:
```
npx expo start --go --clear
```

### Step 5: Reload the app
Scan the QR code again or press 'r' in the Expo terminal.

Now the admin login will work!

## Alternative: Test on Web
The web version works fine with HTTP:
1. Open http://localhost:8081 in your browser
2. Test all features there

## Keep Backend and ngrok Running
You need TWO terminals running:
1. Backend: `cd backend && node server.js`
2. ngrok: `ngrok http 5002`
