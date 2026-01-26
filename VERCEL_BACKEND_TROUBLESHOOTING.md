# Troubleshooting: Backend Not Connected on Vercel

## Quick Diagnosis Steps

### Step 1: Check Browser Console
1. Open your deployed app
2. Press F12 to open DevTools
3. Go to **Console** tab
4. Look for:
   - `[API Config]` logs - Should show `isProduction: true` and `Final API Base URL: /api/v1`
   - Any red error messages
   - Network errors

### Step 2: Check Network Tab
1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for request to `/api/v1/health` or `/api/health`
4. Check the status:
   - **200 OK** = Backend is working ✅
   - **404 Not Found** = Route not found ❌
   - **500 Internal Server Error** = Backend error ❌
   - **Network Error / Failed** = Function not responding ❌
   - **CORS Error** = CORS configuration issue ❌

### Step 3: Test API Directly
Open in browser or use curl:
```
https://your-app.vercel.app/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-26T...",
  "version": "1.0.0"
}
```

**If you get 404:**
- Backend routes not set up correctly
- Check `vercel.json` rewrite rules

**If you get 500:**
- Backend code error
- Check Vercel function logs

**If you get timeout:**
- Function taking too long
- Check for slow initialization

---

## Common Issues & Fixes

### Issue 1: "Function Not Found" or 404

**Symptoms:**
- Network tab shows 404
- Browser console shows "Not Found"

**Causes:**
1. `api/index.js` not found
2. Rewrite rule not working
3. Backend not built correctly

**Fixes:**

1. **Verify `api/index.js` exists:**
   ```bash
   ls api/index.js  # Should exist
   ```

2. **Check `vercel.json` rewrite:**
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "/api/index.js"
       }
     ]
   }
   ```

3. **Verify backend build:**
   - Check Vercel build logs
   - Should see: `backend/dist/index.js` created
   - If build fails, fix TypeScript errors

---

### Issue 2: "Function Timeout" or 504

**Symptoms:**
- Request hangs then times out
- Network tab shows timeout error

**Causes:**
1. Backend initialization too slow
2. Database connection hanging
3. AI service initialization blocking

**Fixes:**

1. **Check Vercel function logs:**
   - Vercel Dashboard → Functions → `api/index.js` → Logs
   - Look for initialization errors

2. **Optimize initialization:**
   - Make database connections lazy (connect on first use)
   - Don't block on vector service initialization
   - Use async initialization

3. **Check for infinite loops:**
   - Look for repeated log messages
   - Check for circular dependencies

---

### Issue 3: "500 Internal Server Error"

**Symptoms:**
- Network tab shows 500 status
- Error response from backend

**Causes:**
1. Missing environment variables
2. Database connection error
3. Code error in backend

**Fixes:**

1. **Check environment variables in Vercel:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Required:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`
     - `AI_PROVIDER=openai`
     - `AI_MODEL=gpt-4o`
     - `NODE_ENV=production`

2. **Check Vercel function logs:**
   - Look for error stack traces
   - Check for missing dependencies

3. **Test locally first:**
   ```bash
   cd backend
   npm run build
   node dist/index.js
   # Test: curl http://localhost:3004/api/v1/health
   ```

---

### Issue 4: "CORS Error"

**Symptoms:**
- Browser console shows CORS error
- Network tab shows CORS preflight failure

**Causes:**
- CORS not allowing Vercel domain
- CORS configuration incorrect

**Fixes:**

1. **Check backend CORS config:**
   - Should allow `*.vercel.app` domains
   - Check `backend/src/index.ts` CORS configuration

2. **Set CORS_ORIGIN in Vercel:**
   - Environment Variable: `CORS_ORIGIN=https://your-app.vercel.app`
   - Or leave unset (code allows all Vercel domains automatically)

---

### Issue 5: "Cold Start Too Slow"

**Symptoms:**
- First request takes 3-10 seconds
- Subsequent requests are fast

**Causes:**
- Normal for serverless functions
- Backend initialization on first request

**Fixes:**

1. **This is normal** - cold starts are expected
2. **Keep function warm:**
   - Set up periodic health checks
   - Use a service like UptimeRobot to ping every 5 minutes
3. **Optimize initialization:**
   - Lazy load heavy dependencies
   - Cache database connections
   - Use Vercel Pro for better performance

---

## Debugging Checklist

### ✅ Pre-Deployment
- [ ] Backend builds successfully locally: `cd backend && npm run build`
- [ ] `backend/dist/index.js` exists after build
- [ ] `api/index.js` exists and is correct
- [ ] `vercel.json` is configured correctly

### ✅ Vercel Configuration
- [ ] Environment variables set in Vercel Dashboard
- [ ] Build command works in Vercel
- [ ] Output directory is `frontend/dist`
- [ ] Functions configuration includes `backend/dist/**`

### ✅ Post-Deployment
- [ ] Can access `https://your-app.vercel.app/api/v1/health` directly
- [ ] Browser console shows correct API URL (`/api/v1`)
- [ ] Network tab shows requests to `/api/v1/*`
- [ ] Vercel function logs show successful invocations

---

## Testing Commands

### Test Health Endpoint
```bash
# Direct URL test
curl https://your-app.vercel.app/api/v1/health

# Should return:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Test API Root
```bash
curl https://your-app.vercel.app/api/v1

# Should return API info
```

### Check Function Logs
1. Go to Vercel Dashboard
2. Your Project → Functions → `api/index.js`
3. Click on a recent invocation
4. Check logs for errors

---

## Still Not Working?

### Step 1: Check Build Logs
1. Vercel Dashboard → Deployments
2. Click latest deployment
3. Check build logs for:
   - TypeScript compilation errors
   - Missing dependencies
   - Build failures

### Step 2: Check Function Logs
1. Vercel Dashboard → Functions
2. Click `api/index.js`
3. Check runtime logs for:
   - `[Vercel Function] Loading Express app from: ...`
   - Any error messages
   - Path resolution issues

### Step 3: Verify File Structure
After deployment, verify:
- `backend/dist/index.js` exists
- `api/index.js` exists
- All dependencies are installed

### Step 4: Test Locally First
```bash
# Build backend
cd backend
npm run build

# Test the compiled code
node dist/index.js

# In another terminal, test:
curl http://localhost:3004/api/v1/health
```

If this works locally but not on Vercel, it's a deployment/configuration issue.

---

## Quick Fixes

### Fix 1: Rebuild and Redeploy
```bash
git commit -am "Fix backend connection"
git push
# Wait for Vercel to rebuild
```

### Fix 2: Clear Vercel Cache
1. Vercel Dashboard → Settings → Clear Build Cache
2. Redeploy

### Fix 3: Check Environment Variables
1. Vercel Dashboard → Settings → Environment Variables
2. Verify all required variables are set
3. Redeploy after adding variables

### Fix 4: Simplify for Testing
Temporarily create a simple test endpoint:
```javascript
// api/test.js
module.exports = (req, res) => {
  res.json({ status: 'ok', message: 'Function works' });
};
```

Then test: `https://your-app.vercel.app/api/test`

If this works, the issue is with your Express app loading, not Vercel configuration.

---

## Getting Help

If none of these work:

1. **Check Vercel Status:** https://vercel-status.com
2. **Vercel Community:** https://github.com/vercel/vercel/discussions
3. **Share these details:**
   - Vercel function logs
   - Browser console errors
   - Network tab screenshots
   - Build logs from Vercel

---

## Prevention

To avoid these issues:

1. ✅ Test locally before deploying
2. ✅ Set up proper error handling
3. ✅ Use environment variables (never hardcode)
4. ✅ Monitor Vercel function logs regularly
5. ✅ Set up health check monitoring
6. ✅ Keep dependencies up to date
