# Fix: Vercel Double Path Issue (`backend/backend/package.json`)

## Problem

Vercel was looking for `/vercel/path0/backend/backend/package.json` (double `backend`), causing:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

## Root Cause

The `--prefix` flag in npm commands can cause path resolution issues when Vercel runs from a different directory context. The error suggests Vercel might be running from a subdirectory or the paths are being resolved incorrectly.

## Solution Applied

### 1. Created `build-vercel.sh` Script
- Uses absolute paths based on script location
- Changes to project root directory first
- Verifies directories exist before building
- Handles both backend and frontend builds in sequence

### 2. Updated `vercel.json`
- Uses `buildCommand: "bash build-vercel.sh"` instead of inline commands
- Added `rootDirectory: "."` to ensure Vercel uses project root
- Installation handled in build script

## Files Changed

✅ `build-vercel.sh` - New build script with proper path handling  
✅ `vercel.json` - Uses build script and sets root directory  

## Build Process

The `build-vercel.sh` script:
1. Gets the script's directory (project root)
2. Changes to project root
3. Verifies `package.json` exists
4. Builds backend: `cd backend && npm install && npm run build`
5. Builds frontend: `cd frontend && npm install && npm run build`

## Why This Works

- **Absolute paths**: Script uses `$(pwd)` to get actual directory
- **Directory verification**: Checks if directories exist before building
- **Explicit navigation**: Uses `cd` commands that work reliably
- **Error handling**: `set -e` exits on any error

## Next Steps

1. **Make script executable** (if needed):
   ```bash
   chmod +x build-vercel.sh
   ```

2. **Commit changes:**
   ```bash
   git add build-vercel.sh vercel.json
   git commit -m "Fix Vercel build - use build script with proper paths"
   ```

3. **Deploy again:**
   ```bash
   vercel --prod
   ```

The build should now succeed! 🎉

## Alternative: Check Vercel Dashboard Settings

If this still doesn't work, check in Vercel Dashboard:
1. Go to Project Settings → General
2. Check "Root Directory" - should be empty or set to `.` (project root)
3. If it's set to `backend` or another subdirectory, clear it or set to `.`
