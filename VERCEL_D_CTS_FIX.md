# Fix: "Unable to require `.d.ts` file" / index.d.cts

## Problem
Runtime error: `Unable to require `.d.ts` file. This is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension and loader (attached before `ts-node`) available alongside `index.d.cts`._

## Cause
Some dependencies (e.g. zod) ship `index.d.cts`; if the runtime or loader prefers that over `.js`, Node tries to require a non-executable file and fails.

## Fix applied: Don’t bundle `backend/node_modules`

The serverless function was including `backend/**`, so `backend/node_modules` (with packages that ship `.d.cts`) was in the bundle and could be resolved by mistake.

**Changes:**

1. **Include only `backend/dist` and root `node_modules`**  
   In **`vercel.json`**, `includeFiles` is set to `"{backend/dist,node_modules}/**"` so the function gets:
   - `backend/dist/**` (compiled JS only, no `.d.ts`/`.d.cts`)
   - Root `node_modules/**` (dependencies used at runtime)
   - **Not** `backend/node_modules` (avoids `.d.cts` from backend’s copy of deps)

2. **Backend deps at root**  
   In **`package.json`**, the backend’s production dependencies are listed at the root. The build runs `npm install` at the project root so root `node_modules` has express, zod, etc.

3. **Build order**  
   The build runs `npm install` at root first, then builds backend and frontend. So root `node_modules` exists before the function is bundled.

At runtime, `backend/dist/index.js` does `require('zod')` etc.; Node resolves from `backend/dist/` upward and finds root `node_modules`, so only root’s packages (and their `.js` entries) are used.

## Optional: NODEJS_HELPERS=0

If the error persists, disable Node.js helpers so the runtime doesn’t prefer `.d.cts`:

1. **Vercel Dashboard** → project → **Settings** → **Environment Variables**.
2. Add **NODEJS_HELPERS** = **0** for Production (and Preview if needed).
3. Redeploy.

`api/index.js` also sets `process.env.NODEJS_HELPERS = '0'` at the top as a fallback.

## Summary

- **`vercel.json`**: `includeFiles` = `"{backend/dist,node_modules}/**"` (no `backend/node_modules`).
- **Root `package.json`**: Backend production dependencies added; root `npm install` in build.
- **Backend**: Still builds and runs as before; resolution uses root `node_modules` in the function.
