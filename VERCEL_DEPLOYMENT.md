# Vercel Deployment Guide

## Fixed: Python 3.14 Error

The error was caused by Vercel detecting Python files and trying to install Python dependencies. Since we migrated to PostgreSQL (no Python needed), I've removed all Python configuration.

## Changes Made

1. ✅ **Updated `vercel.json`** - Removed Python runtime, configured for Node.js only
2. ✅ **Deleted `runtime.txt`** - No longer needed (was specifying Python 3.12)
3. ✅ **Updated `.gitignore`** - Added Python files to ignore list
4. ✅ **Removed ChromaDB dependency** - Already done in package.json

## Vercel Configuration

The `vercel.json` is now configured for:
- **Backend**: Node.js/TypeScript API
- **Frontend**: React/Vite static build
- **No Python**: All Python-related config removed

## Deployment Steps

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Option 2: Deploy via GitHub

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Vercel will auto-detect the configuration

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Click "New Project"
3. Import your repository
4. Vercel will use the `vercel.json` configuration

## Environment Variables

Make sure to set these in Vercel Dashboard → Project Settings → Environment Variables:

### Required:
- `DATABASE_URL` - Your PostgreSQL connection string (Neon, Supabase, etc.)
- `OPENAI_API_KEY` - Your OpenAI API key
- `AI_PROVIDER` - Set to `openai`
- `AI_MODEL` - Set to `gpt-4o`

### Optional:
- `PINECONE_API_KEY` - For term vector search
- `PINECONE_INDEX` - Default: `autism-terms`
- `CORS_ORIGIN` - Your Vercel frontend URL (auto-set)
- `PORT` - Vercel sets this automatically
- `NODE_ENV` - Set to `production`

## Build Configuration

Vercel will:
1. Install dependencies for both backend and frontend
2. Build backend TypeScript to JavaScript
3. Build frontend React app
4. Deploy backend as serverless functions
5. Deploy frontend as static files

## Important Notes

### PostgreSQL Database

Your PostgreSQL database (Neon) needs to:
- ✅ Have `pgvector` extension installed (Neon has this pre-installed)
- ✅ Be accessible from Vercel's servers
- ✅ Have proper connection pooling enabled

### API Routes

Backend API routes will be available at:
- Production: `https://your-app.vercel.app/api/v1/*`
- Frontend should use this URL in production

Update `frontend/.env.production` or set `VITE_API_URL` in Vercel environment variables.

## Troubleshooting

### "Python 3.14" Error

**Fixed!** This error should no longer appear because:
- `vercel.json` no longer references Python
- `runtime.txt` has been deleted
- Python files are in `.gitignore`

### Build Fails

1. **Check build logs** in Vercel dashboard
2. **Verify environment variables** are set correctly
3. **Check Node.js version** - Should be 20.x (specified in package.json)

### Database Connection Issues

1. **Verify DATABASE_URL** is set in Vercel environment variables
2. **Check database allows connections** from Vercel's IPs
3. **Ensure SSL is enabled** in connection string (`?sslmode=require`)

### Frontend Can't Connect to Backend

1. **Set VITE_API_URL** in Vercel environment variables to your production API URL
2. **Rebuild frontend** after setting the variable
3. **Check CORS_ORIGIN** matches your Vercel frontend URL

## Current Status

✅ Python configuration removed  
✅ Node.js-only deployment configured  
✅ Ready for Vercel deployment  
✅ PostgreSQL vector storage (no Python needed)  

## Next Steps

1. **Commit the changes:**
   ```bash
   git add vercel.json .gitignore
   git commit -m "Remove Python config for Vercel deployment"
   ```

2. **Push to GitHub** (if using Git)

3. **Deploy to Vercel** using one of the methods above

4. **Set environment variables** in Vercel dashboard

5. **Test the deployment**

The Python error should be completely resolved now! 🎉
