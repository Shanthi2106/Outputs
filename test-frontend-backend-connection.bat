@echo off
echo ====================================
echo Test Frontend-Backend Connection
echo ====================================
echo.

echo [1] Checking backend server...
netstat -ano | findstr ":3004" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is running on port 3004
) else (
    echo [ERROR] Backend is NOT running!
    echo         Start it with: cd backend ^&^& npm run dev
    pause
    exit /b 1
)

echo.
echo [2] Testing backend health endpoint...
curl -s http://localhost:3004/api/v1/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is responding
) else (
    echo [WARNING] Could not test backend (curl might not be available)
    echo           But backend appears to be running
)

echo.
echo [3] Checking frontend server...
netstat -ano | findstr ":5173" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend is running on port 5173
) else (
    echo [WARNING] Frontend is NOT running!
    echo           Start it with: cd frontend ^&^& npm run dev
)

echo.
echo [4] Checking frontend .env configuration...
if exist "frontend\.env" (
    findstr /C:"VITE_API_URL" frontend\.env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] VITE_API_URL found in frontend/.env
        findstr /C:"VITE_API_URL" frontend\.env
    ) else (
        echo [ERROR] VITE_API_URL not found in frontend/.env
    )
) else (
    echo [ERROR] frontend/.env file not found!
)

echo.
echo [5] Checking backend .env configuration...
if exist "backend\.env" (
    findstr /C:"PORT=" backend\.env | findstr "3004" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Backend PORT is set to 3004
    ) else (
        echo [WARNING] Backend PORT might not be 3004
    )
    
    findstr /C:"CORS_ORIGIN" backend\.env | findstr "5173" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] CORS_ORIGIN includes frontend port 5173
    ) else (
        echo [WARNING] CORS_ORIGIN might not be configured for frontend
    )
)

echo.
echo ====================================
echo Diagnosis Complete
echo ====================================
echo.
echo IMPORTANT: If you just updated frontend/.env:
echo   - RESTART the frontend dev server (Vite only reads .env on startup)
echo   - Stop: Ctrl+C in frontend terminal
echo   - Start: cd frontend ^&^& npm run dev
echo.
echo If connection still fails:
echo   1. Open browser DevTools (F12)
echo   2. Check Console tab for errors
echo   3. Check Network tab for failed requests
echo   4. Try hard refresh (Ctrl+Shift+R)
echo.
pause
