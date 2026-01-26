# Fix: "build-vercel.sh: No such file or directory"

## Problem

Vercel couldn't find the `build-vercel.sh` script even though it exists in the repository. This can happen when:
- Vercel runs from a different directory context
- The script isn't in the expected location
- File permissions or path resolution issues

## Solution Applied

### Changed to Inline Commands with Subshells

Instead of using a separate bash script, I've updated `vercel.json` to use inline commands with subshells:

```json
"buildCommand": "(cd backend && npm install && npm run build) && (cd frontend && npm install && npm run build)"
```

### Why This Works

- **Subshells `()`**: Each `(cd ... && ...)` creates a subshell that:
  - Changes to the directory
  - Runs the commands
  - Returns to the original directory
  - Doesn't affect the parent shell

- **No external files**: Everything is inline, so no path resolution issues
- **Reliable**: Works regardless of where Vercel starts the build

## Files Changed

✅ `vercel.json` - Uses inline subshell commands instead of bash script

## Build Process

Vercel will now:
1. Run `installCommand` → echo message (installation in buildCommand)
2. Run `buildCommand` → which:
   - Builds backend: `(cd backend && npm install && npm run build)`
   - Then builds frontend: `(cd frontend && npm install && npm run build)`
3. Deploy frontend from `frontend/dist`
4. Deploy API from `api/index.js` (serverless function)

## Next Steps

1. **Commit changes:**
   ```bash
   git add vercel.json
   git commit -m "Fix Vercel build - use inline subshell commands"
   ```

2. **Deploy again:**
   ```bash
   vercel --prod
   ```

The build should now succeed! 🎉

## Note

The `build-vercel.sh` file can be kept for local testing, but Vercel will use the inline commands from `vercel.json`.
