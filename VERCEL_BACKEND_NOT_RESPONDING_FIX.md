# Fix: Backend Serverless Function Not Responding on Vercel

## Problem
The backend serverless function is not responding. This could be due to:
- Backend build failed during deployment
- Serverless function timeout or error
- Missing environment variables in Vercel
- Cold start delay (first request may take longer)

## Quick Diagnosis Steps

### Step 1: Check Vercel Build Logs
1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the **latest deployment**
3. Check the **Build Logs** for errors

**Look for:**
```
✓ Building backend...
✓ Compiled successfully
✓ backend/dist/index.js created
```

**If you see errors:**
- TypeScript compilation errors → Fix the code
- `npm install` errors → Check package.json dependencies
- Missing files → Check file paths

### Step 2: Check Function Logs
1. Go to **Vercel Dashboard** → **Functions** tab
2. Click on `api/index.js`
3. Click on a **recent invocation**
4. Check the logs

**What to look for:**
```
[Vercel Function] Environment: { ... }
[Vercel Function] Searching for backend in paths:
  1. /path/to/backend/dist/index.js ✓ EXISTS
[Vercel Function] ✓ Successfully loaded Express app from: ...
```

**If you see:**
- `✗ NOT FOUND` for all paths → Backend didn't build correctly
- `Failed to load from` → File exists but can't be required (dependency issue)
- `Cannot find module` → Missing dependencies

### Step 3: Verify Environment Variables
Go to **Vercel Dashboard** → **Project Settings** → **Environment Variables**

**Required Variables:**
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai
AI_MODEL=gpt-4o
NODE_ENV=production
```

**Optional (but recommended):**
```env
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=autism-terms
CORS_ORIGIN=https://your-app.vercel.app
```

**Important:** Make sure these are set for **Production**, **Preview**, and **Development** environments.

## Common Issues & Solutions

### Issue 1: Backend Build Failed

**Symptoms:**
- Build logs show TypeScript errors
- `backend/dist/index.js` doesn't exist after build
- Build command fails

**Solution:**
1. **Test build locally:**
   ```bash
   cd backend
   npm install
   npm run build
   ```
   
2. **Fix any TypeScript errors** shown in the build output

3. **Verify dist folder is created:**
   ```bash
   ls backend/dist/index.js  # Should exist
   ```

4. **Check tsconfig.json** is correct:
   - `outDir` should be `./dist`
   - `rootDir` should be `./src`

5. **Commit and redeploy:**
   ```bash
   git add .
   git commit -m "Fix backend build errors"
   git push
   ```

### Issue 2: Function Can't Find Backend

**Symptoms:**
- Function logs show all paths as `✗ NOT FOUND`
- Error: "Failed to load Express app in serverless function"

**Solution:**
1. **Check vercel.json configuration:**
   ```json
   {
     "functions": {
       "api/index.js": {
         "includeFiles": "backend/dist/**"
       }
     }
   }
   ```

2. **Verify build command in vercel.json:**
   ```json
   {
     "buildCommand": "[ -d backend ] && (cd backend && npm install && npm run build) || exit 1; [ -d frontend ] && (cd frontend && npm install && npm run build) || exit 1"
   }
   ```

3. **Ensure backend builds before frontend** (order matters)

### Issue 3: Missing Dependencies

**Symptoms:**
- Function loads but crashes on first request
- Error: "Cannot find module 'express'" or similar
- Error: "Module not found"

**Solution:**
1. **Check backend/package.json** has all required dependencies

2. **Update vercel.json to include node_modules:**
   ```json
   {
     "functions": {
       "api/index.js": {
         "includeFiles": [
           "backend/dist/**",
           "backend/node_modules/**"
         ]
       }
     }
   }
   ```

3. **Or ensure dependencies are installed at root level** (not recommended for monorepos)

### Issue 4: Environment Variables Missing

**Symptoms:**
- Function loads but returns errors
- "OPENAI_API_KEY is required" or similar
- Database connection errors

**Solution:**
1. **Go to Vercel Dashboard** → **Project Settings** → **Environment Variables**

2. **Add all required variables** (see list above)

3. **Make sure they're set for the correct environment:**
   - Production
   - Preview
   - Development

4. **Redeploy after adding variables:**
   - Variables are only available after redeployment
   - Go to Deployments → Redeploy

### Issue 5: Cold Start Timeout

**Symptoms:**
- First request takes 10+ seconds
- Request times out
- Subsequent requests work fine

**Solution:**
1. **Increase function timeout in vercel.json:**
   ```json
   {
     "functions": {
       "api/index.js": {
         "maxDuration": 30
       }
     }
   }
   ```

2. **Optimize backend startup:**
   - Move heavy initialization to lazy loading
   - Use connection pooling for databases
   - Cache expensive operations

3. **Use Vercel Pro** for longer timeouts (up to 60 seconds)

### Issue 6: CORS Errors

**Symptoms:**
- Frontend can't connect to backend
- Browser console shows CORS errors
- "Not allowed by CORS"

**Solution:**
1. **Backend CORS is already configured** to allow Vercel domains automatically

2. **If still having issues, set CORS_ORIGIN:**
   ```env
   CORS_ORIGIN=https://your-app.vercel.app
   ```

3. **Check backend/src/index.ts** CORS configuration (should allow `*.vercel.app`)

## Testing Locally

Before deploying, test the build process:

```bash
# 1. Build backend
cd backend
npm install
npm run build

# 2. Verify dist exists
ls dist/index.js  # Should exist

# 3. Test loading the compiled app
node -e "const app = require('./dist/index.js'); console.log('Loaded:', typeof app)"

# 4. Test the serverless function locally
cd ../api
node -e "const handler = require('./index.js'); console.log('Handler:', typeof handler)"
```

## Verification Checklist

After deploying, verify:

- [ ] Build logs show successful backend build
- [ ] `backend/dist/index.js` exists (check build logs)
- [ ] Function logs show "✓ Successfully loaded Express app"
- [ ] No "✗ NOT FOUND" errors for all paths
- [ ] API endpoint `/api/v1/health` returns 200 OK
- [ ] No "Cannot find module" errors
- [ ] Environment variables are set in Vercel
- [ ] CORS allows your Vercel domain

## Quick Fix Commands

### Test Build Locally
```bash
cd backend
npm install
npm run build
ls dist/index.js
```

### Check Function Logs (Vercel CLI)
```bash
vercel logs --follow
```

### Redeploy
```bash
vercel --prod
```

## Next Steps

1. **Check Vercel Dashboard** for build and function logs
2. **Verify environment variables** are set correctly
3. **Test the build locally** to catch errors early
4. **Review function logs** to see exactly what's happening
5. **Fix the specific issue** based on the logs

## Still Not Working?

If the backend still doesn't respond:

1. **Share the function logs** showing:
   - All path search results
   - Directory listing results
   - Any error messages

2. **Share the build logs** showing:
   - Build command output
   - Any errors or warnings
   - Whether `backend/dist/index.js` was created

3. **Check Vercel Status Page** for any service issues

4. **Try redeploying** - sometimes a fresh deployment fixes issues
