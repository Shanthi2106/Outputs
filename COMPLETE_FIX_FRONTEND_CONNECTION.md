# Complete Fix: Frontend Cannot Connect to Backend

## Current Status

✅ Backend is running on port 3004  
✅ Backend is responding correctly  
✅ CORS is configured correctly  
✅ Frontend .env is configured correctly  

## The Problem

The frontend still shows "Network error: Unable to reach the server" even though everything is configured correctly.

## Most Likely Causes

### 1. Frontend Dev Server Not Restarted (90% of cases)

**Vite only reads `.env` files when it starts!**

**Fix:**
1. **Stop** frontend server (Ctrl+C)
2. **Start** it again:
   ```bash
   cd frontend
   npm run dev
   ```
3. **Hard refresh** browser (Ctrl+Shift+R)

### 2. Browser Cache

**Fix:**
- Hard refresh: `Ctrl+Shift+R` or `Ctrl+F5`
- Or clear browser cache
- Or open in incognito/private window

### 3. Browser Console Errors

**Check:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors (red text)
4. Go to **Network** tab
5. Refresh page
6. Look for request to `/api/v1/health`
7. Check if it's:
   - ❌ Failed (red)
   - ❌ Blocked by CORS
   - ❌ Timeout

## Step-by-Step Fix

### Step 1: Verify Backend is Running

```bash
# Check if backend is listening
netstat -ano | findstr ":3004"
```

Should show: `LISTENING`

### Step 2: Test Backend Directly

Open browser and go to:
```
http://localhost:3004/api/v1/health
```

Should show JSON: `{"status":"healthy",...}`

### Step 3: Restart Frontend

```bash
# Stop frontend (Ctrl+C in its terminal)
# Then start again:
cd frontend
npm run dev
```

### Step 4: Check Browser Console

1. Open browser DevTools (F12)
2. Check **Console** tab for:
   - `API Base URL: http://localhost:3004/api/v1` (should appear on page load)
   - Any red errors
3. Check **Network** tab:
   - Filter by "health"
   - Look for request to `/api/v1/health`
   - Check status (should be 200)

### Step 5: Test in Browser Console

Open browser console (F12) and run:

```javascript
// Test 1: Check API URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Test 2: Direct fetch test
fetch('http://localhost:3004/api/v1/health')
  .then(r => r.json())
  .then(data => console.log('✓ Backend connected:', data))
  .catch(err => console.error('✗ Backend error:', err));
```

## Debugging Checklist

- [ ] Backend is running (check terminal)
- [ ] Backend responds to `http://localhost:3004/api/v1/health`
- [ ] Frontend `.env` has `VITE_API_URL=http://localhost:3004/api/v1`
- [ ] Frontend dev server was restarted after .env changes
- [ ] Browser was refreshed (hard refresh: Ctrl+Shift+R)
- [ ] No browser extensions blocking requests
- [ ] Firewall is not blocking port 3004
- [ ] Browser console shows correct API URL
- [ ] Network tab shows request being made

## Quick Test File

I've created `test-browser-connection.html` in the root directory. Open it in your browser to test the connection directly.

## Still Not Working?

1. **Check exact error in browser console:**
   - Open DevTools (F12)
   - Console tab
   - Look for the exact error message

2. **Check Network tab:**
   - Open DevTools (F12)
   - Network tab
   - Refresh page
   - Find the `/health` request
   - Click on it
   - Check:
     - Status code
     - Response
     - Headers (especially CORS headers)

3. **Try different browser:**
   - Sometimes browser extensions or settings can block requests

4. **Check if localhost resolves:**
   - Try `127.0.0.1:3004` instead of `localhost:3004`
   - Update `frontend/.env`: `VITE_API_URL=http://127.0.0.1:3004/api/v1`
   - Restart frontend

## Common Error Messages

### "Failed to fetch" or "NetworkError"
- **Cause:** CORS issue or backend not running
- **Fix:** Check CORS_ORIGIN in backend/.env, restart backend

### "ECONNREFUSED"
- **Cause:** Backend not running
- **Fix:** Start backend server

### "Timeout"
- **Cause:** Backend is slow or not responding
- **Fix:** Check backend logs, increase timeout

### "CORS policy"
- **Cause:** CORS not configured correctly
- **Fix:** Verify `CORS_ORIGIN=http://localhost:5173` in backend/.env

## Next Steps

1. **Restart frontend dev server** (most important!)
2. **Hard refresh browser** (Ctrl+Shift+R)
3. **Check browser console** for exact error
4. **Share the exact error message** from browser console if still not working
