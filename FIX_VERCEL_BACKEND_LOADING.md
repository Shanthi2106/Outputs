# Fix: Failed to Load Express App in Serverless Function

## Problem
The Vercel serverless function is unable to find and load `backend/dist/index.js`, resulting in the error: "Failed to load Express app in serverless function".

## Root Causes

1. **Backend not building correctly** - `backend/dist/index.js` doesn't exist after build
2. **Path resolution issues** - Serverless function can't find the file in Vercel's file structure
3. **Missing dependencies** - Backend node_modules not available to serverless function
4. **File inclusion issues** - `includeFiles` in vercel.json not working correctly

## Fixes Applied

### 1. Enhanced Path Resolution (`api/index.js`)
- Added comprehensive path searching with logging
- Checks multiple possible locations
- Lists directory contents for debugging
- Tries both file system checks and module resolution

### 2. Improved Error Handling
- Detailed logging of all attempted paths
- Shows which paths exist and which don't
- Lists directory contents when file not found
- Better error messages with context

### 3. Updated Vercel Configuration (`vercel.json`)
- Added function memory and timeout settings
- Ensured `includeFiles` includes backend/dist

## Debugging Steps

### Step 1: Check Vercel Build Logs
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check build logs for:
   - `cd backend && npm install && npm run build`
   - Should see: "Compiled successfully" or TypeScript errors
   - Verify `backend/dist/index.js` is created

**If build fails:**
- Fix TypeScript compilation errors
- Check for missing dependencies
- Verify `tsconfig.json` is correct

### Step 2: Check Function Logs
1. Vercel Dashboard → Functions → `api/index.js`
2. Click on a recent invocation
3. Look for logs starting with `[Vercel Function]`

**What to look for:**
```
[Vercel Function] Environment: { __dirname: ..., cwd: ... }
[Vercel Function] Searching for backend in paths:
  1. /path/to/backend/dist/index.js ✓ EXISTS
  2. /other/path ✗ NOT FOUND
...
[Vercel Function] ✓ Successfully loaded Express app from: ...
```

**If you see "✗ NOT FOUND" for all paths:**
- Backend didn't build correctly
- Check build logs
- Verify `backend/dist/index.js` exists after build

**If you see "Failed to load from" errors:**
- File exists but can't be required
- Check for missing dependencies
- Verify CommonJS exports are correct

### Step 3: Verify File Structure
The logs will show:
```
[Vercel Function] Checking directories:
  backend dir exists: true/false
  backend dir contents: dist, node_modules, ...
  dist dir exists: true/false
  dist dir contents: index.js, ...
```

**If backend dir doesn't exist:**
- Build didn't complete
- Check build command in vercel.json

**If dist dir doesn't exist:**
- TypeScript compilation failed
- Check for TypeScript errors in build logs

**If dist exists but index.js is missing:**
- Build output issue
- Check `tsconfig.json` outDir setting

## Common Issues & Solutions

### Issue 1: Backend Build Fails

**Symptoms:**
- Build logs show TypeScript errors
- `backend/dist/index.js` doesn't exist

**Solution:**
1. Fix TypeScript compilation errors
2. Check `backend/tsconfig.json`
3. Ensure all dependencies are in `package.json`
4. Test build locally: `cd backend && npm run build`

### Issue 2: Path Not Found

**Symptoms:**
- Function logs show all paths as "✗ NOT FOUND"
- But build succeeded

**Solution:**
1. Check `vercel.json` `includeFiles`:
   ```json
   "functions": {
     "api/index.js": {
       "includeFiles": "backend/dist/**"
     }
   }
   ```

2. Verify file structure in Vercel:
   - Files should be at root level
   - `backend/dist/index.js` should exist
   - `api/index.js` should exist

### Issue 3: Module Resolution Fails

**Symptoms:**
- File exists but `require()` fails
- Error: "Cannot find module" or "Module not found"

**Solution:**
1. Check backend exports in `backend/src/index.ts`:
   ```typescript
   // Should export Express app
   module.exports = app;
   ```

2. Verify CommonJS format (not ES modules)

3. Check for missing dependencies:
   - Backend dependencies might not be available
   - May need to include `backend/node_modules` in `includeFiles`

### Issue 4: Dependencies Missing

**Symptoms:**
- App loads but crashes on first request
- Error: "Cannot find module 'express'" or similar

**Solution:**
1. Update `vercel.json` to include node_modules:
   ```json
   "functions": {
     "api/index.js": {
       "includeFiles": [
         "backend/dist/**",
         "backend/node_modules/**"
       ]
     }
   }
   ```

2. Or ensure dependencies are installed at root level

## Testing Locally

Before deploying, test the build process:

```bash
# Build backend
cd backend
npm install
npm run build

# Verify dist exists
ls dist/index.js  # Should exist

# Test loading the compiled app
node -e "const app = require('./dist/index.js'); console.log('Loaded:', typeof app)"

# Test the serverless function locally
cd ../api
node -e "const handler = require('./index.js'); console.log('Handler:', typeof handler)"
```

## Verification Checklist

After deploying:

- [ ] Build logs show successful backend build
- [ ] `backend/dist/index.js` exists (check build logs)
- [ ] Function logs show "✓ Successfully loaded Express app"
- [ ] No "✗ NOT FOUND" errors for all paths
- [ ] API endpoint `/api/v1/health` returns 200 OK
- [ ] No "Cannot find module" errors

## Next Steps

1. **Deploy and check logs** - The enhanced logging will show exactly what's happening
2. **Review function logs** - Look for the path search results
3. **Fix the specific issue** - Based on what the logs reveal
4. **Test the endpoint** - Verify `/api/v1/health` works

## If Still Not Working

Share the function logs showing:
- All the path search results
- Directory listing results
- Any error messages

This will help identify the exact issue!
