@echo off
setlocal enabledelayedexpansion

echo ====================================
echo Starting Backend Server
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js v20 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%
echo.

REM Navigate to backend directory
cd backend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot find backend directory!
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure it.
    pause
    exit /b 1
)
echo [OK] .env file found

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)

REM Check if port 3000 is available
echo.
echo [INFO] Checking if port 3000 is available...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3000 is already in use!
    echo.
    echo This might mean:
    echo   - Backend is already running (check other terminal windows)
    echo   - Another application is using port 3000
    echo.
    echo To find what's using the port:
    echo   netstat -ano ^| findstr :3000
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        echo Cancelled.
        pause
        exit /b 1
    )
) else (
    echo [OK] Port 3000 is available
)

echo.
echo ====================================
echo Starting backend server...
echo ====================================
echo.
echo Server will start on: http://localhost:3000
echo Health check: http://localhost:3000/health
echo.
echo Look for this message when server is ready:
echo   "Server running on port 3000 in development mode"
echo.
echo All output is being logged to: backend\backend-startup.log
echo.
echo Press Ctrl+C to stop the server
echo.
echo ====================================
echo.

REM Create log file
set LOG_FILE=backend-startup.log
if exist "%LOG_FILE%" del "%LOG_FILE%"
echo Starting backend server at %date% %time% > "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM Check for TypeScript compilation errors first
echo [INFO] Checking for TypeScript compilation errors...
call npx tsc --noEmit > "%LOG_FILE%.tsc-check.log" 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] TypeScript compilation check found issues:
    type "%LOG_FILE%.tsc-check.log" | more
    echo.
    echo Full errors saved to: %LOG_FILE%.tsc-check.log
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        echo Cancelled.
        pause
        exit /b 1
    )
) else (
    echo [OK] No TypeScript compilation errors found
    del "%LOG_FILE%.tsc-check.log" 2>nul
)
echo.

REM Start the server with output tee'd to both console and log file
echo [INFO] Starting server...
echo Output will appear below and be saved to %LOG_FILE%
echo.

REM Use PowerShell to tee output to both console and file
powershell -Command "$scriptBlock = { npm run dev 2>&1 | Tee-Object -FilePath '%LOG_FILE%' -Append }; & $scriptBlock"

REM If we get here, the server has stopped
echo.
echo ====================================
echo Server has stopped.
echo ====================================
echo.
echo Check %LOG_FILE% for detailed startup logs.
pause
