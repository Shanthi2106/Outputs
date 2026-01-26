# Fix: Python 3.14 Error on Vercel Deployment

## Problem

Vercel is trying to install Python dependencies and failing with:
```
hint: You require CPython 3.14 (`cp314`), but we only found wheels for
      `onnxruntime` (v1.23.2) with the following Python ABI tags: `cp310`,
      `cp311`, `cp312`, `cp313`, `cp313t`
```

## Root Cause

Vercel detects Python when it finds:
- `requirements.txt` files
- `runtime.txt` files
- Python-related configuration

Since we migrated to **PostgreSQL with pgvector** (no Python needed), we need to tell Vercel this is a **Node.js-only** project.

## Solution Applied

### 1. Updated `vercel.json`
- Removed all Python runtime configuration
- Configured for Node.js/TypeScript only
- Set up proper routing for API and frontend

### 2. Created `.vercelignore`
- Ignores `requirements.txt`
- Ignores `runtime.txt`
- Ignores all Python files
- Prevents Vercel from detecting Python

### 3. Removed Python Dependencies
- Removed `chromadb` from root `package.json`
- Deleted `runtime.txt`
- Updated `.gitignore` to ignore Python files

### 4. Created API Wrapper
- Created `api/index.ts` for Vercel serverless functions
- Updated backend to work in both local and Vercel environments

## Files Changed

✅ `vercel.json` - Node.js-only configuration  
✅ `.vercelignore` - Ignore Python files  
✅ `.gitignore` - Added Python file patterns  
✅ `package.json` - Removed ChromaDB dependencies  
✅ `backend/src/index.ts` - Added Vercel detection  
✅ `api/index.ts` - Vercel serverless function wrapper  

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard** → New Project
2. **Import your repository**
3. **Configure Project:**
   - **Root Directory:** Leave as root (or set to project root)
   - **Framework Preset:** Other
   - **Build Command:** `cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** (leave empty or use buildCommand)

4. **Set Environment Variables:**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `AI_PROVIDER=openai`
   - `AI_MODEL=gpt-4o`
   - `NODE_ENV=production`
   - `CORS_ORIGIN` - Your Vercel frontend URL (auto-set)

5. **Deploy!**

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# For production
vercel --prod
```

### Option 3: Separate Projects (Recommended for Monorepo)

**Best practice for monorepos:** Create separate Vercel projects:

1. **Backend Project:**
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Other

2. **Frontend Project:**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Framework: Vite

Then update frontend environment variables to point to backend URL.

## Environment Variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required:
```env
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
OPENAI_API_KEY=sk-your-key-here
AI_PROVIDER=openai
AI_MODEL=gpt-4o
NODE_ENV=production
```

### Optional:
```env
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=autism-terms
CORS_ORIGIN=https://your-frontend.vercel.app
```

## Verification

After deployment, the Python error should be **completely gone** because:

1. ✅ `vercel.json` specifies Node.js runtime only
2. ✅ `.vercelignore` prevents Python file detection
3. ✅ No Python dependencies in package.json
4. ✅ Backend uses PostgreSQL (no Python needed)

## Troubleshooting

### Still Getting Python Error?

1. **Check `.vercelignore`** - Make sure `requirements.txt` is listed
2. **Check `vercel.json`** - No Python runtime specified
3. **Clear Vercel cache** - Redeploy with "Clear Cache" option
4. **Check build logs** - Look for what Vercel is detecting

### Build Fails?

1. **Check Node.js version** - Should be 20.x (in package.json)
2. **Verify build commands** - Test locally first
3. **Check environment variables** - All required vars set
4. **Review build logs** - Look for specific errors

### API Not Working?

1. **Check API routes** - Should be `/api/*`
2. **Verify serverless function** - Check `api/index.ts` exists
3. **Test API endpoint** - `https://your-app.vercel.app/api/v1/health`
4. **Check CORS** - Frontend URL matches CORS_ORIGIN

## Current Status

✅ Python configuration completely removed  
✅ Vercel configured for Node.js only  
✅ Ready for deployment  
✅ No Python dependencies needed  

The Python 3.14 error should **never appear again**! 🎉
