@echo off
echo ====================================
echo Backend Connection Checker
echo ====================================
echo.

REM Check if backend is running on port 3000
echo Checking if backend is running on port 3000...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Port 3000 is in use - backend might be running
    echo.
    echo Testing health endpoint...
    curl -s http://localhost:3000/health >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Backend is responding!
        echo.
        echo Health check response:
        curl -s http://localhost:3000/health
        echo.
        echo.
        echo Backend is ready! You can now start the frontend.
    ) else (
        echo [WARNING] Port 3000 is in use but health endpoint is not responding
        echo This might be a different application using port 3000
    )
) else (
    echo [ERROR] Backend is NOT running on port 3000
    echo.
    echo To start the backend:
    echo 1. Run: start-backend.bat
    echo 2. Or: cd backend ^&^& npm run dev
    echo.
)

echo.
echo ====================================
pause
