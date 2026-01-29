# Fix: "Unable to require `.d.ts` file" / index.d.cts

## Problem
Runtime error: `Unable to require `.d.ts` file. This is usually the result of a faulty configuration or import. Make sure there is a `.js`, `.json` or another executable extension and loader (attached before `ts-node`) available alongside `index.d.cts`._

## Cause
Vercel’s Node.js helpers (including ts-node) can make `require()` resolve to TypeScript declaration files (e.g. `index.d.cts`) instead of `.js`. Some dependencies (e.g. zod) ship `.d.cts`; if the loader prefers that, Node tries to require a non-executable file and fails.

## Fix 1: Set NODEJS_HELPERS in Vercel (recommended)

Disable Node.js helpers so the runtime uses plain Node and only loads `.js`:

1. Open **Vercel Dashboard** → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Key:** `NODEJS_HELPERS`
   - **Value:** `0`
3. Apply to **Production**, **Preview**, and **Development**.
4. **Redeploy** (env vars apply on the next deployment).

## Fix 2: Already applied in code

- In **`api/index.js`**, `process.env.NODEJS_HELPERS = '0'` is set at the top so helpers are disabled as soon as the handler runs (may not take effect if the loader is registered earlier).
- In **`backend/tsconfig.json`**, `declaration` and `declarationMap` are `false` so the backend build does not emit `.d.ts`/`.d.cts` in `backend/dist/`.

## If it still fails

1. Confirm **NODEJS_HELPERS=0** is set in Vercel for the environment you’re deploying to.
2. Redeploy after changing env vars.
3. Check function logs to see the exact file path that is being required (e.g. which package’s `index.d.cts`).
