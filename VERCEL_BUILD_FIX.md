# Fix: Vercel Build Command Error - "cd: backend: No such file or directory"

## Problem

Vercel build was failing with:
```
sh: line 1: cd: backend: No such file or directory
```

This happens because Vercel's build environment may run commands from a different context, and `cd` commands can fail.

## Solution Applied

### Updated `vercel.json`
- Changed from `cd backend && npm install` to `npm install --prefix backend`
- Changed from `cd frontend && npm install` to `npm install --prefix frontend`
- Uses `--prefix` flag which works without changing directories
- More reliable in Vercel's build environment

## New Build Command

```bash
npm install --prefix backend && npm run build --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
```

This approach:
- ✅ Doesn't require `cd` commands
- ✅ Works from any directory
- ✅ More reliable in CI/CD environments
- ✅ Uses npm's built-in `--prefix` flag

## Files Changed

✅ `vercel.json` - Uses `--prefix` instead of `cd` commands

## Build Process

Vercel will now:
1. Install backend dependencies: `npm install --prefix backend`
2. Build backend: `npm run build --prefix backend`
3. Install frontend dependencies: `npm install --prefix frontend`
4. Build frontend: `npm run build --prefix frontend`
5. Deploy frontend from `frontend/dist`
6. Deploy API from `api/index.js` (serverless function)

## Next Steps

1. **Commit changes:**
   ```bash
   git add vercel.json
   git commit -m "Fix Vercel build - use --prefix instead of cd"
   ```

2. **Deploy again:**
   ```bash
   vercel --prod
   ```

The build should now succeed! 🎉
