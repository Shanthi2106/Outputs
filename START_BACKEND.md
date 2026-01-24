# Quick Start Guide: Starting the Backend Server

This guide will help you start the backend server and troubleshoot common issues.

## Quick Start (3 Steps)

### Step 1: Run Diagnostic Tool (Optional but Recommended)
Double-click `diagnose-backend.bat` to check if everything is configured correctly.

### Step 2: Start the Backend
Double-click `start-backend.bat` in the project root folder.

### Step 3: Verify It's Running
Look for this message in the terminal:
```
Server running on port 3000 in development mode
AI Provider: openai
CORS Origin: http://localhost:5173
```

## What You Should See

### ✅ Success - Server Started
```
====================================
Starting Backend Server
====================================

[OK] Node.js version: v20.x.x
[OK] .env file found
[OK] Dependencies already installed
[OK] Port 3000 is available

====================================
Starting backend server...
====================================

Server running on port 3000 in development mode
AI Provider: openai
CORS Origin: http://localhost:5173
Health check: http://localhost:3000/health
```

### ❌ Error - Configuration Issues
If you see configuration errors, the diagnostic tool will help identify the problem.

## Common Issues and Solutions

### Issue 1: "Port 3000 already in use"

**Symptoms:**
- Error message: `Port 3000 is already in use!`
- Or: `EADDRINUSE` error

**Solutions:**

**Option A: Find and close the existing process**
1. Open a new terminal
2. Run: `netstat -ano | findstr :3000`
3. Note the PID (last number)
4. Run: `taskkill /PID <PID> /F` (replace `<PID>` with the number)

**Option B: Use a different port**
1. Open `backend/.env`
2. Change: `PORT=3001`
3. Open `frontend/.env`
4. Change: `VITE_API_URL=http://localhost:3001/api/v1`
5. Restart both servers

### Issue 2: "OPENAI_API_KEY is required"

**Symptoms:**
- Error: `Configuration validation failed`
- Message about missing API key

**Solution:**
1. Open `backend/.env`
2. Make sure `OPENAI_API_KEY` is set:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
3. Get your key from: https://platform.openai.com/api-keys
4. Save the file and restart the server

### Issue 3: "Invalid AI model"

**Symptoms:**
- Error: `Invalid AI model "xxx" for provider "openai"`

**Solution:**
1. Open `backend/.env`
2. Check `AI_MODEL` value
3. Valid models for OpenAI:
   - `gpt-4o` (recommended)
   - `gpt-4-turbo`
   - `gpt-4`
   - `gpt-3.5-turbo`
4. Update: `AI_MODEL=gpt-4o`
5. Save and restart

### Issue 4: "Cannot find module" or "npm: command not found"

**Symptoms:**
- Error when starting: module not found
- Or: `npm: command not found`

**Solution:**
1. Make sure Node.js is installed:
   - Check: `node --version` (should show v20 or higher)
   - Download from: https://nodejs.org/
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Try starting again

### Issue 5: "Dependencies not installed"

**Symptoms:**
- Error about missing packages
- `node_modules` folder missing

**Solution:**
1. Navigate to backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Wait for installation to complete
4. Try starting the server again

### Issue 6: Server starts but frontend can't connect

**Symptoms:**
- Backend terminal shows server running
- Frontend shows "Backend Server Not Connected"

**Solutions:**

**Check 1: Verify backend is responding**
- Open browser: http://localhost:3000/health
- Should see: `{"status":"healthy",...}`

**Check 2: Verify frontend API URL**
- Open `frontend/.env`
- Should be: `VITE_API_URL=http://localhost:3000/api/v1`
- **Important:** Restart frontend dev server after changing .env

**Check 3: Check CORS configuration**
- Open `backend/.env`
- Should be: `CORS_ORIGIN=http://localhost:5173`
- If frontend runs on different port, update this
- Restart backend after changes

**Check 4: Firewall blocking connection**
- Temporarily disable Windows Firewall to test
- If it works, add exception for Node.js or port 3000

## Verification Checklist

Before reporting issues, verify:

- [ ] Node.js v20+ is installed (`node --version`)
- [ ] Dependencies are installed (`backend/node_modules` exists)
- [ ] `.env` file exists in `backend/` folder
- [ ] `OPENAI_API_KEY` is set in `backend/.env`
- [ ] `AI_MODEL` is valid (e.g., `gpt-4o`)
- [ ] Port 3000 is not in use (or changed to different port)
- [ ] Backend health endpoint works: http://localhost:3000/health
- [ ] Frontend `.env` has correct `VITE_API_URL`
- [ ] Both servers restarted after .env changes

## Using the Diagnostic Tool

The `diagnose-backend.bat` tool automatically checks:

1. ✅ Node.js installation and version
2. ✅ Backend directory exists
3. ✅ Dependencies installed
4. ✅ .env file exists and configured
5. ✅ Port 3000 availability
6. ✅ Backend health check

**Run it anytime you have issues!**

## Manual Start (Alternative)

If the startup script doesn't work:

1. Open terminal/command prompt
2. Navigate to backend:
   ```bash
   cd backend
   ```
3. Start server:
   ```bash
   npm run dev
   ```

## Expected Startup Sequence

1. **Configuration loaded** - No errors about missing .env
2. **Dependencies checked** - No module errors
3. **Server starting** - "Starting backend server..." message
4. **Port binding** - No "port in use" errors
5. **Server ready** - "Server running on port 3000" message

## Getting Help

If you're still having issues:

1. **Run the diagnostic tool**: `diagnose-backend.bat`
2. **Check the error messages** - They now include fix suggestions
3. **Check backend terminal** - Look for specific error messages
4. **Check browser console** (F12) - Look for network errors
5. **See detailed guide**: `NETWORK_ERROR_TROUBLESHOOTING.md`

## Next Steps

Once the backend is running:

1. ✅ Keep the backend terminal window open
2. ✅ Start the frontend (if not already running)
3. ✅ Open http://localhost:5173 in your browser
4. ✅ The "Backend Server Not Connected" warning should disappear
5. ✅ You can now use the application!

## Troubleshooting Quick Reference

| Problem | Quick Fix |
|---------|-----------|
| Port in use | Change PORT in backend/.env or close other process |
| Missing API key | Add OPENAI_API_KEY to backend/.env |
| Invalid model | Update AI_MODEL in backend/.env to valid model |
| Dependencies missing | Run `npm install` in backend folder |
| Frontend can't connect | Check VITE_API_URL in frontend/.env matches backend port |
| CORS errors | Check CORS_ORIGIN in backend/.env matches frontend URL |

---

**Remember:** Always restart the server after changing `.env` files!
