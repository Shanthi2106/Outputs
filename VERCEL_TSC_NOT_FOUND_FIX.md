# Fix: "tsc: command not found" on Vercel Build

## Problem
Vercel build is failing with:
```
sh: line 1: tsc: command not found
Error: Command "[ -d backend ] && (cd backend && npm install && npm run build) || exit 1; ..." exited with 1
```

## Root Cause
TypeScript (`tsc`) is in `devDependencies`, and Vercel might skip installing devDependencies in production builds. When `NODE_ENV=production` is set (which Vercel does by default), `npm install` skips devDependencies.

## Solution Applied

### Updated `vercel.json` Build Command
Changed from:
```json
"buildCommand": "[ -d backend ] && (cd backend && npm install && npm run build) || exit 1; ..."
```

To:
```json
"buildCommand": "[ -d backend ] && (cd backend && npm install --include=dev && npm run build) || exit 1; [ -d frontend ] && (cd frontend && npm install --include=dev && npm run build) || exit 1"
```

### Why `--include=dev` Works
- **Explicitly installs devDependencies**: Even if `NODE_ENV=production` is set, `--include=dev` forces npm to install devDependencies
- **Required for build**: TypeScript, build tools, and type definitions are needed to compile the code
- **Only affects build time**: devDependencies are not included in the final deployment

## Alternative Solutions

If `--include=dev` doesn't work, you can also try:

### Option 1: Use `npm ci` (if package-lock.json exists)
```json
"buildCommand": "[ -d backend ] && (cd backend && npm ci && npm run build) || exit 1; ..."
```

### Option 2: Set NODE_ENV explicitly
```json
"buildCommand": "[ -d backend ] && (cd backend && NODE_ENV=development npm install && npm run build) || exit 1; ..."
```

### Option 3: Move TypeScript to dependencies (not recommended)
This would increase the deployment size unnecessarily.

## Verification

After deploying, check Vercel build logs:
1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Check build logs for:
   ```
   ✓ Installing backend dependencies...
   ✓ Building backend...
   ✓ Compiled successfully
   ```

## Files Changed

✅ `vercel.json` - Updated build command to use `npm install --include=dev`

## Next Steps

1. **Commit the fix:**
   ```bash
   git add vercel.json
   git commit -m "Fix: Install devDependencies for Vercel build (tsc not found)"
   git push
   ```

2. **Monitor the deployment:**
   - Check Vercel build logs
   - Verify TypeScript compilation succeeds
   - Confirm `backend/dist/index.js` is created

3. **If still failing:**
   - Check if `package-lock.json` exists in backend folder
   - Verify TypeScript version in `backend/package.json`
   - Check for any other missing build dependencies

## Summary

The build command now explicitly installs devDependencies, ensuring TypeScript and other build tools are available during the Vercel build process. This should resolve the "tsc: command not found" error.
