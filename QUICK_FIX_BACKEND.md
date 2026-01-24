y# Quick Fix: Backend Server Not Connected

## The Problem
Your frontend is showing "Backend Server Not Connected" because the backend server is not running.

## Quick Solution (Choose One)

### Option 1: Use the Startup Script (Easiest)
1. Double-click `start-backend.bat` in the project root
2. A terminal window will open and start the backend
3. Wait until you see: `Server running on port 3000 in development mode`
4. Keep this window open (don't close it)
5. Refresh your frontend browser page

### Option 2: Start Both Servers Together
1. Double-click `start-all.bat` in the project root
2. This starts both backend and frontend in one window
3. Wait for both to start
4. Open http://localhost:5173 in your browser

### Option 3: Manual Start (Terminal)
1. Open a terminal/command prompt
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Wait until you see: `Server running on port 3000`
5. Keep this terminal open
6. In a **new terminal**, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Verify Backend is Running

### Method 1: Use the Check Script
Double-click `check-backend.bat` - it will tell you if the backend is running.

### Method 2: Test in Browser
Open http://localhost:3000/health in your browser. You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### Method 3: Check Terminal Output
Look for this message in your backend terminal:
```
Server running on port 3000 in development mode
AI Provider: openai
```

## Common Issues

### Issue: "Port 3000 already in use"
**Solution:** Something else is using port 3000
1. Close any other applications using port 3000
2. Or change the port in `backend/.env`:
   ```
   PORT=3001
   ```
3. Update `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:3001/api/v1
   ```

### Issue: "Cannot find module" or "npm: command not found"
**Solution:** Dependencies not installed
1. Run `setup.bat` first to install all dependencies
2. Or manually:
   ```bash
   cd backend
   npm install
   ```

### Issue: "OPENAI_API_KEY is required"
**Solution:** API key not configured
1. Open `backend/.env`
2. Make sure `OPENAI_API_KEY` is set (it should be there already)
3. Restart the backend server

## What Should Happen

✅ **Backend Terminal Shows:**
```
Server running on port 3000 in development mode
AI Provider: openai
CORS Origin: http://localhost:5173
```

✅ **Frontend Shows:**
- No "Backend Server Not Connected" warning
- You can send messages and get responses

## Still Not Working?

1. **Check the backend terminal** for error messages
2. **Check browser console** (F12) for specific errors
3. **Run `check-backend.bat`** to diagnose the issue
4. **See `NETWORK_ERROR_TROUBLESHOOTING.md`** for detailed help

## Remember

- **Always start backend before frontend** (or use `start-all.bat`)
- **Keep the backend terminal window open** while using the app
- **Restart backend** if you change `backend/.env` file
