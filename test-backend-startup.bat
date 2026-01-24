@echo off
setlocal enabledelayedexpansion

echo ====================================
echo Testing Backend Startup
echo ====================================
echo.
echo This will attempt to start the backend server to verify it can start successfully.
echo The server will be stopped automatically after testing.
echo.

REM Navigate to backend directory
cd backend
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot find backend directory!
    pause
    exit /b 1
)

set LOG_FILE=backend-startup-test.log
set TEST_TIMEOUT=15
set SERVER_STARTED=0

REM Clean up any existing log
if exist "%LOG_FILE%" del "%LOG_FILE%"

echo [INFO] Starting server test...
echo [INFO] Timeout: %TEST_TIMEOUT% seconds
echo [INFO] Log file: %LOG_FILE%
echo.

REM Start server in background and capture output
echo Starting server process...
start /B cmd /c "npm run dev > %LOG_FILE% 2>&1"

REM Wait for server to start (check every second)
echo Waiting for server to start...
for /L %%i in (1,1,%TEST_TIMEOUT%) do (
    timeout /t 1 /nobreak >nul
    
    REM Check if server is responding
    curl -s http://localhost:3000/health >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] Server started successfully!
        echo.
        echo Server is responding at http://localhost:3000/health
        set SERVER_STARTED=1
        goto :CHECK_LOG
    )
    
    REM Check log for "Server running" message
    findstr /C:"Server running on port" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] Server started successfully!
        echo.
        echo Found startup message in log
        set SERVER_STARTED=1
        goto :CHECK_LOG
    )
    
    REM Check log for errors
    findstr /C:"error" /C:"Error" /C:"ERROR" /C:"failed" /C:"Failed" /C:"FAILED" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [WARNING] Errors detected in log, checking...
        goto :CHECK_ERRORS
    )
    
    echo Waiting... (%%i/%TEST_TIMEOUT%)
)

:CHECK_ERRORS
echo.
echo [INFO] Checking for errors in log file...
echo.

REM Show last 30 lines of log
if exist "%LOG_FILE%" (
    echo Last 30 lines of output:
    echo ====================================
    powershell -Command "Get-Content '%LOG_FILE%' -Tail 30"
    echo ====================================
    echo.
    
    REM Check for specific error patterns
    findstr /C:"Configuration validation failed" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [ERROR] Configuration validation failed!
        echo Check the errors above and fix your .env file.
        set SERVER_STARTED=0
        goto :STOP_SERVER
    )
    
    findstr /C:"Port" /C:"already in use" /C:"EADDRINUSE" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [ERROR] Port conflict detected!
        echo Another process is using port 3000.
        set SERVER_STARTED=0
        goto :STOP_SERVER
    )
    
    findstr /C:"Cannot find module" /C:"MODULE_NOT_FOUND" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [ERROR] Missing dependencies!
        echo Run: npm install
        set SERVER_STARTED=0
        goto :STOP_SERVER
    )
    
    findstr /C:"OPENAI_API_KEY" /C:"API key" "%LOG_FILE%" >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [ERROR] API key configuration issue!
        echo Check your OPENAI_API_KEY in .env file.
        set SERVER_STARTED=0
        goto :STOP_SERVER
    )
)

:CHECK_LOG
if %SERVER_STARTED% EQU 1 (
    echo.
    echo [INFO] Server startup test completed successfully!
    echo.
    echo Server output (last 10 lines):
    echo ====================================
    if exist "%LOG_FILE%" (
        powershell -Command "Get-Content '%LOG_FILE%' -Tail 10"
    )
    echo ====================================
    echo.
) else (
    echo.
    echo [ERROR] Server did not start within %TEST_TIMEOUT% seconds!
    echo.
    echo Full log saved to: %LOG_FILE%
    echo.
    echo Common issues:
    echo   1. Configuration errors - check .env file
    echo   2. Missing dependencies - run: npm install
    echo   3. Port conflicts - check if port 3000 is in use
    echo   4. TypeScript errors - check compilation
    echo.
)

:STOP_SERVER
echo [INFO] Stopping test server...
REM Find and kill the node process running on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping process %%a...
    taskkill /PID %%a /F >nul 2>&1
)

REM Also try to kill any tsx processes
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo ====================================
if %SERVER_STARTED% EQU 1 (
    echo [RESULT] TEST PASSED - Server can start successfully
) else (
    echo [RESULT] TEST FAILED - Server could not start
    echo.
    echo Review the log file: %LOG_FILE%
    echo Run diagnose-backend.bat for more detailed diagnostics.
)
echo ====================================
echo.

cd ..
pause
