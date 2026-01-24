# Network Error Troubleshooting Guide

## Error Message
```
Network error: Unable to reach the server. Please check your internet connection and try again.
```

## Common Causes and Solutions

### 1. Backend Server Not Running

**Symptom:** Frontend cannot connect to backend at `http://localhost:3000`

**Solution:**
1. Navigate to the `backend` folder in your terminal
2. Ensure you have a `.env` file with required configuration (copy from `.env.example` if needed)
3. Install dependencies: `npm install`
4. Start the server: `npm run dev` or `npm start`
5. Verify the server is running by checking the terminal output:
   ```
   Server running on port 3000 in development mode
   ```

### 2. Wrong API URL Configuration

**Symptom:** Frontend trying to connect to wrong URL

**Solution:**
1. Check `frontend/.env` file exists
2. Verify `VITE_API_URL` is set correctly:
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   ```
3. If you changed the backend port, update this URL accordingly
4. **Important:** After changing `.env`, restart the frontend dev server

### 3. Port Already in Use

**Symptom:** Backend fails to start with "port already in use" error

**Solution:**
1. Find what's using port 3000:
   - **Windows:** `netstat -ano | findstr :3000`
   - **Mac/Linux:** `lsof -i :3000`
2. Kill the process or change the port in `backend/.env`:
   ```
   PORT=3001
   ```
3. Update `frontend/.env` to match:
   ```
   VITE_API_URL=http://localhost:3001/api/v1
   ```

### 4. CORS Configuration Issue

**Symptom:** Browser console shows CORS errors

**Solution:**
1. Check `backend/.env` has correct CORS origin:
   ```
   CORS_ORIGIN=http://localhost:5173
   ```
2. If frontend runs on different port, update CORS_ORIGIN
3. Restart backend server after changes

### 5. Firewall or Network Blocking Connection

**Symptom:** Connection works on some networks but not others

**Solution:**
1. Check Windows Firewall settings
2. Temporarily disable firewall to test
3. Add exception for Node.js or port 3000
4. Check corporate network/VPN settings

### 6. Backend Can't Reach External APIs (OpenAI, etc.)

**Symptom:** Backend starts but requests fail with API errors

**Solution:**
1. Verify API keys in `backend/.env`:
   ```
   OPENAI_API_KEY=your_key_here
   ```
2. Check internet connection
3. Verify API key is valid and has credits
4. Check for rate limiting errors in backend logs

## Quick Diagnostic Steps

### Step 1: Verify Backend is Running
```bash
# In backend folder
npm run dev
```

Look for:
```
Server running on port 3000 in development mode
AI Provider: openai
```

### Step 2: Test Backend Health Endpoint
Open in browser or use curl:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

### Step 3: Check Frontend Configuration
1. Open `frontend/.env`
2. Verify `VITE_API_URL=http://localhost:3000/api/v1`
3. Restart frontend dev server after changes

### Step 4: Check Browser Console
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab to see failed requests
4. Look for specific error codes (ECONNREFUSED, ETIMEDOUT, etc.)

## Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `ECONNREFUSED` | Backend not running or wrong port | Start backend server |
| `ETIMEDOUT` | Request timed out | Check server performance, increase timeout |
| `ENOTFOUND` | DNS/hostname resolution failed | Check API URL is correct |
| `CORS` | Cross-origin request blocked | Check CORS_ORIGIN in backend config |

## Still Having Issues?

1. **Check all logs:**
   - Backend terminal output
   - Frontend browser console
   - Network tab in DevTools

2. **Verify environment files:**
   - `backend/.env` exists and has required keys
   - `frontend/.env` exists and has correct API URL

3. **Test with curl/Postman:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/health/ready
   ```

4. **Restart everything:**
   - Stop both frontend and backend
   - Clear node_modules and reinstall if needed
   - Start backend first, then frontend

## Prevention

1. Always start backend before frontend
2. Keep `.env` files in sync with `.env.example`
3. Use consistent ports across configuration
4. Check terminal output for startup errors
