# Fix: Vercel Build Error - Double Path Issue

## Problem

Vercel was looking for `/vercel/path0/backend/backend/package.json` (double `backend`), causing:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```

## Root Cause

The `npm run build --prefix backend` command doesn't work as expected in Vercel's environment. The `--prefix` flag can cause path resolution issues.

## Solution Applied

### 1. Updated Root `package.json` Build Scripts
Changed from:
```json
"build:backend": "npm install --prefix backend && npm run build --prefix backend"
```

To:
```json
"build:backend": "(cd backend && npm install && npm run build)"
```

Using parentheses `()` creates a subshell, so the `cd` command works correctly and doesn't affect the parent shell.

### 2. Updated `vercel.json`
- Uses `npm run build` which calls the root package.json scripts
- Uses `npm run install:all` for installation
- Scripts handle directory changes correctly

## Files Changed

✅ `package.json` - Updated build scripts to use subshells with `cd`  
✅ `vercel.json` - Uses root package.json scripts  

## Build Process

Vercel will now:
1. Run `npm run install:all` → installs dependencies for both backend and frontend
2. Run `npm run build` → which runs:
   - `build:backend` → `(cd backend && npm install && npm run build)`
   - `build:frontend` → `(cd frontend && npm install && npm run build)`
3. Deploy frontend from `frontend/dist`
4. Deploy API from `api/index.js` (serverless function)

## Why This Works

- Parentheses `()` create a subshell, so `cd` works without affecting the parent process
- Each build script runs in its own subshell context
- Paths are resolved correctly relative to the project root
- Works reliably in Vercel's build environment

## Next Steps

1. **Commit changes:**
   ```bash
   git add package.json vercel.json
   git commit -m "Fix Vercel build - use subshells for cd commands"
   ```

2. **Deploy again:**
   ```bash
   vercel --prod
   ```

The build should now succeed! 🎉
