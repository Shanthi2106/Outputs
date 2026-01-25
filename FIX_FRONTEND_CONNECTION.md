# Fix: Frontend Cannot Connect to Backend

## Problem

Frontend shows "Network error: Unable to reach the server at http://localhost:3004/api/v1" even though the backend is running.

## Quick Fix

### Step 1: Restart Frontend Dev Server

**Vite (the frontend dev server) needs to be restarted after .env changes:**

1. **Stop** the frontend server (Ctrl+C in the terminal running it)
2. **Start** it again:
   ```bash
   cd frontend
   npm run dev
   ```

**Important:** Vite only reads `.env` files when it starts. Changes to `.env` require a restart!

### Step 2: Verify Configuration

Check that `frontend/.env` has:
```env
VITE_API_URL=http://localhost:3004/api/v1
```

### Step 3: Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab** - Look for any CORS errors
- **Network tab** - Check if requests to `http://localhost:3004` are being made

## Common Issues

### Issue 1: Frontend Not Restarted After .env Change

**Symptom:** Frontend still using old API URL

**Fix:** Restart frontend dev server

### Issue 2: CORS Error

**Symptom:** Browser console shows CORS error

**Fix:** Verify `backend/.env` has:
```env
CORS_ORIGIN=http://localhost:5173
```

Then restart backend server.

### Issue 3: Port Mismatch

**Symptom:** Backend on different port than frontend expects

**Check:**
- Backend port in `backend/.env`: `PORT=3004`
- Frontend API URL in `frontend/.env`: `VITE_API_URL=http://localhost:3004/api/v1`

### Issue 4: Backend Not Running

**Symptom:** No response from backend

**Fix:** Start backend:
```bash
cd backend
npm run dev
```

You should see: `Server running on port 3004`

## Verification Steps

1. **Backend is running:**
   ```bash
   # Check if port 3004 is listening
   netstat -ano | findstr ":3004"
   ```

2. **Backend responds:**
   ```bash
   # Test health endpoint
   curl http://localhost:3004/api/v1/health
   ```

3. **Frontend can reach backend:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Look for request to `/api/v1/health`
   - Check if it returns 200 OK

## Still Not Working?

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Check firewall** - Windows Firewall might be blocking
3. **Try different browser** - Rule out browser-specific issues
4. **Check both terminals:**
   - Backend terminal should show: `Server running on port 3004`
   - Frontend terminal should show: `Local: http://localhost:5173`

## Quick Test

Run this in browser console (F12):
```javascript
fetch('http://localhost:3004/api/v1/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

If this works, the issue is with the frontend code. If it fails, the issue is with the backend or network.
