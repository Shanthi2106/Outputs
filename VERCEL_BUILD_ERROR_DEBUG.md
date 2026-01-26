# Debug: Vercel Build Command Exited with 1

## Problem

Build command is failing with exit code 1, but we don't know which step is failing.

## Possible Causes

1. **TypeScript compilation errors** in backend
2. **Missing dependencies** during npm install
3. **Frontend build errors**
4. **Path issues** with cd commands

## Debugging Steps

### 1. Check Vercel Build Logs

In Vercel Dashboard → Deployments → Click on the failed deployment → View Build Logs

Look for:
- TypeScript errors
- Missing module errors
- npm install failures
- Build script errors

### 2. Test Build Locally

Run the same commands locally to see the error:

```bash
cd backend
npm install
npm run build

cd ../frontend
npm install
npm run build
```

### 3. Common Issues

#### TypeScript Errors
- Check `backend/tsconfig.json` for strict settings
- Look for type errors in `backend/src/**/*.ts`
- Check if all imports are correct

#### Missing Dependencies
- Verify `backend/package.json` has all required dependencies
- Check if `devDependencies` are needed for build (TypeScript, etc.)

#### Module Export Issues
- Backend exports both ES module and CommonJS
- Check `api/index.js` imports correctly

## Solution: Add Better Error Handling

Update the build command to show which step fails:

```json
"buildCommand": "cd backend && npm install && npm run build || (echo 'Backend build failed' && exit 1) && cd ../frontend && npm install && npm run build || (echo 'Frontend build failed' && exit 1)"
```

## Next Steps

1. Check Vercel build logs for specific error
2. Test build locally
3. Fix the specific error found
4. Redeploy
