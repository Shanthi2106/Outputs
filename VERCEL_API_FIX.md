# Fix: Vercel Production API Connection Issue

## Problem
Frontend deployed on Vercel is trying to connect to `http://localhost:3004/api/v1` instead of using the relative path `/api/v1`.

## Root Cause
The frontend's API service was using the `VITE_API_URL` from `.env` file even in production builds, which contained `localhost:3004`.

## Solution Applied

### 1. Enhanced Production Detection
Updated `frontend/src/services/api.ts` to:
- Check multiple production indicators (PROD flag, MODE, hostname)
- Always ignore localhost URLs in production, even if set in `.env`
- Use relative path `/api/v1` in production
- Added comprehensive logging for debugging

### 2. Vercel Configuration
The `vercel.json` is configured to:
- Route `/api/:path*` requests to `/api/index.js` serverless function
- The serverless function exports the Express app from `backend/dist/index.js`

## Verification Steps

### Step 1: Check Browser Console
After deployment, open browser DevTools (F12) and check the Console tab. You should see:
```
[API Config] { PROD: true, MODE: 'production', ... }
[API Service] Final API Base URL: /api/v1
```

If you see `http://localhost:3004/api/v1`, the changes haven't been deployed yet.

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Make an API request (e.g., load the app)
3. Check the request URL - it should be relative like `/api/v1/health`, not `http://localhost:3004/api/v1/health`

### Step 3: Test API Endpoint Directly
Try accessing your API directly in the browser:
```
https://your-app.vercel.app/api/v1/health
```

This should return a JSON response. If it doesn't work, the serverless function might not be set up correctly.

## Deployment Checklist

1. ✅ **Commit the changes:**
   ```bash
   git add frontend/src/services/api.ts
   git commit -m "Fix: Use relative API path in production"
   git push
   ```

2. ✅ **Wait for Vercel deployment** - Check Vercel dashboard for build completion

3. ✅ **Clear browser cache** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

4. ✅ **Check Vercel environment variables** (optional but recommended):
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `VITE_VERCEL=1` (helps with production detection)

## If Still Not Working

### Option 1: Force API URL via Vercel Environment Variable
In Vercel Dashboard → Environment Variables, set:
```
VITE_API_URL=/api/v1
```

This will override any `.env` file values.

### Option 2: Check Serverless Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Check `/api/index.js` function logs
3. Look for any errors or issues

### Option 3: Verify Build Output
1. Check Vercel build logs
2. Verify `backend/dist/index.js` exists after build
3. Verify `api/index.js` can require the backend

### Option 4: Test Locally with Production Build
```bash
cd frontend
npm run build
npm run preview
```

Then check if it uses `/api/v1` (it should, since preview mode is production-like).

## Expected Behavior

- **Local Development:** Uses `http://localhost:3004/api/v1`
- **Vercel Production:** Uses `/api/v1` (relative path)
- **Vercel Preview:** Uses `/api/v1` (relative path)

## Debugging Commands

Check what API URL is being used:
```javascript
// In browser console
console.log('API URL:', window.location.origin + '/api/v1');
```

Check if production mode is detected:
```javascript
// In browser console (after app loads)
// Look for [API Config] logs in console
```
