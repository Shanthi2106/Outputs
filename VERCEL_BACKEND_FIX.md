# Fix: Backend Not Working in Vercel

## Problem
The backend serverless function is not working in Vercel deployment.

## Root Causes
1. **Path Resolution**: The serverless function might not find `backend/dist/index.js`
2. **Dependencies**: Backend dependencies might not be available to the serverless function
3. **Build Output**: The backend might not be building correctly

## Fixes Applied

### 1. Enhanced Serverless Function (`api/index.js`)
- Added multiple path resolution attempts
- Added comprehensive error handling and logging
- Falls back to error handler if backend can't be loaded

### 2. Added API Package.json
- Created `api/package.json` to ensure Express is available
- This ensures the error handler can work even if backend fails

### 3. Improved Error Messages
- Serverless function now logs detailed error information
- Returns helpful error responses if backend can't be loaded

## Verification Steps

### Step 1: Check Vercel Build Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the build logs for:
   - `[Vercel Function] Loading Express app from: ...`
   - Any errors about missing files

### Step 2: Check Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `api/index.js`
3. Check the runtime logs for:
   - Path resolution attempts
   - Any errors loading the backend

### Step 3: Test API Endpoint
Try accessing:
```
https://your-app.vercel.app/api/v1/health
```

Expected responses:
- **Success**: `{"status":"healthy",...}`
- **Backend not found**: `{"error":"Backend not available",...}`

## Troubleshooting

### Issue: "Backend not available" error

**Check 1: Backend Build**
- Verify `backend/dist/index.js` exists after build
- Check build logs for TypeScript compilation errors

**Check 2: File Structure**
In Vercel, the structure should be:
```
/
├── api/
│   └── index.js
├── backend/
│   └── dist/
│       └── index.js
└── frontend/
    └── dist/
```

**Check 3: Dependencies**
- Backend dependencies should be installed during build
- Check if `backend/node_modules` exists after build

### Issue: Module not found errors

**Solution**: Ensure backend dependencies are installed:
```bash
# In build command, verify:
cd backend && npm install && npm run build
```

### Issue: Path resolution fails

**Solution**: The serverless function tries multiple paths:
1. `../backend/dist/index.js` (relative to api/)
2. `backend/dist/index.js` (from project root)
3. `dist/index.js` (alternative)

Check Vercel function logs to see which path was attempted.

## Alternative Solution: Copy Backend to API

If path resolution continues to fail, you can modify the build command to copy the backend:

```json
"buildCommand": "[ -d backend ] && (cd backend && npm install && npm run build && cp -r dist ../api/backend-dist) || exit 1; ..."
```

Then update `api/index.js` to require from `./backend-dist/index.js`.

## Expected Behavior

After deployment:
1. ✅ Backend builds successfully (`backend/dist/index.js` exists)
2. ✅ Serverless function loads backend from correct path
3. ✅ API endpoints respond correctly
4. ✅ Health check returns `{"status":"healthy"}`

## Next Steps

1. **Deploy the changes:**
   ```bash
   git add api/index.js api/package.json vercel.json
   git commit -m "Fix: Enhanced Vercel serverless function with better error handling"
   git push
   ```

2. **Monitor Vercel logs** after deployment

3. **Test the API** endpoints to verify they're working

4. **Check function logs** if issues persist
