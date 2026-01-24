# 🚨 Backend Server Not Running - Quick Fix

## Problem
Your frontend is showing "Checking backend connection..." because the backend server is not running on port 3003.

## Solution

### Option 1: Quick Start (Recommended)
1. Double-click `quick-start-backend.bat` in the project root
2. Wait for the server to start (you'll see "Server Started Successfully!")
3. Keep that terminal window open
4. Refresh your frontend browser page

### Option 2: Manual Start
1. Open a new terminal/command prompt
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Wait for "Server Started Successfully!" message
5. Keep the terminal open
6. Refresh your frontend browser page

## Verify It's Working

After starting the backend, you should see:
- ✅ Terminal shows: "Server running on port 3003"
- ✅ Frontend shows: "Connected" (green status)
- ✅ You can type autism terms in chat and get responses

## Common Issues

### Port Already in Use
If you see "Port 3003 is already in use":
- Check other terminal windows - you might have the backend running already
- Or change PORT in `backend/.env` to a different port (e.g., 3004)
- Update `frontend/.env` to match the new port

### Still Not Connecting
1. Check `backend/.env` - make sure PORT=3003
2. Check `frontend/.env` - make sure VITE_API_URL=http://localhost:3003/api/v1
3. Restart both frontend and backend
4. Clear browser cache and refresh

## Need Help?
- Check backend terminal for error messages
- Check browser console (F12) for connection errors
- Verify both servers are running:
  - Backend: http://localhost:3003/api/v1/health
  - Frontend: Usually http://localhost:5173
