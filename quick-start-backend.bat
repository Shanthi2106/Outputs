@echo off
echo ====================================
echo Quick Start Backend Server
echo ====================================
echo.

cd /d "%~dp0backend"

echo [1] Checking if backend is already running...
netstat -ano | findstr :3003 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3003 is already in use!
    echo           The backend might already be running.
    echo           Check other terminal windows.
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        echo Cancelled.
        pause
        exit /b 0
    )
)
echo.

echo [2] Checking .env file...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo         Please create .env file from .env.example
    pause
    exit /b 1
)
echo [OK] .env file exists
echo.

echo [3] Checking dependencies...
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies installed
)
echo.

echo [4] Starting backend server...
echo.
echo Server will start on: http://localhost:3004
echo Health check: http://localhost:3004/api/v1/health
echo.
echo Press Ctrl+C to stop the server
echo.
echo ====================================
echo.

call npm run dev

pause
