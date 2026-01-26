# Fix: "Checking backend connection..." Error on Vercel

## Problem
The frontend shows "Checking backend connection..." indefinitely when deployed to Vercel, indicating the health check endpoint is not responding.

## Root Causes Identified

1. **Path Routing Issue**: When Vercel rewrites `/api/:path*` to the serverless function, the path might not be preserved correctly
2. **CORS Configuration**: CORS might be blocking requests from Vercel domains
3. **Serverless Function Handler**: The Express app needs proper wrapping for Vercel's serverless environment

## Fixes Applied

### 1. Updated Serverless Function (`api/index.js`)
- Added proper request handler wrapper
- Ensures `/api` prefix is preserved in the path
- Added comprehensive logging for debugging
- Handles path adjustments when Vercel strips the prefix

### 2. Updated CORS Configuration (`backend/src/index.ts`)
- Now dynamically allows any `*.vercel.app` domain in production
- Maintains backward compatibility with configured CORS_ORIGIN
- Allows requests with no origin (for serverless-to-serverless calls)

### 3. Updated Vercel Configuration (`vercel.json`)
- Added `functions` configuration to include backend dist files
- Maintained rewrite rules for proper routing

## Deployment Steps

### Step 1: Commit and Push Changes
```bash
git add api/index.js backend/src/index.ts vercel.json
git commit -m "Fix: Vercel backend connection and CORS issues"
git push
```

### Step 2: Verify Environment Variables in Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `AI_PROVIDER` - Set to `openai`
- `AI_MODEL` - Set to `gpt-4o`
- `NODE_ENV` - Set to `production`

**Optional (but recommended):**
- `CORS_ORIGIN` - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
  - Note: This is now optional since CORS allows all Vercel domains automatically

### Step 3: Wait for Deployment
Vercel will automatically rebuild and deploy. Check the deployment logs for any errors.

### Step 4: Test the Fix

1. **Test Health Endpoint Directly:**
   Open in browser:
   ```
   https://your-app.vercel.app/api/v1/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for `[API Config]` logs showing production mode
   - Look for `[Vercel Function]` logs (if function logs are visible)
   - Check for any CORS errors

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Refresh the page
   - Look for request to `/api/v1/health`
   - Should return 200 OK with JSON response

## Troubleshooting

### Issue: Still showing "Checking backend connection..."

**Check 1: Serverless Function Logs**
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/index.js`
3. Check runtime logs for:
   - `[Vercel Function] Loading Express app from: ...`
   - `[Vercel Function] Incoming request: ...`
   - Any error messages

**Check 2: Backend Build**
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment
3. Check build logs for:
   - `backend/dist/index.js` being created
   - TypeScript compilation success
   - No build errors

**Check 3: Environment Variables**
- Verify all required environment variables are set
- Check that `DATABASE_URL` is correct and accessible
- Verify `OPENAI_API_KEY` is valid

**Check 4: Direct API Test**
Try accessing the API directly:
```bash
curl https://your-app.vercel.app/api/v1/health
```

If this fails, the serverless function isn't working correctly.

### Issue: CORS Error in Browser Console

If you see CORS errors:
1. Check that `CORS_ORIGIN` is set to your Vercel frontend URL
2. Or remove `CORS_ORIGIN` - the code now allows all Vercel domains automatically
3. Redeploy after changing environment variables

### Issue: 500 Error from API

If the API returns 500 errors:
1. Check Vercel function logs for detailed error messages
2. Verify `DATABASE_URL` is accessible from Vercel
3. Check that all required environment variables are set
4. Look for initialization errors in the logs

## What Changed

### Files Modified:
1. `api/index.js` - Enhanced serverless function handler
2. `backend/src/index.ts` - Updated CORS configuration
3. `vercel.json` - Added functions configuration

### Key Improvements:
- ✅ Proper path handling in serverless function
- ✅ Dynamic CORS for Vercel domains
- ✅ Better error logging and debugging
- ✅ Automatic Vercel domain detection

## Next Steps

After deployment:
1. Monitor Vercel function logs for any errors
2. Test all API endpoints to ensure they work
3. Check browser console for any remaining issues
4. Verify the frontend can successfully connect to the backend

If issues persist, check the Vercel function logs for detailed error messages that will help identify the specific problem.
