@echo off
setlocal enabledelayedexpansion

echo ====================================
echo Backend Diagnostic Tool
echo ====================================
echo.
echo This tool will check common issues that prevent the backend from starting.
echo.

set ISSUES_FOUND=0
set WARNINGS_FOUND=0

REM ====================================
REM Check 1: Node.js Installation
REM ====================================
echo [1/6] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Node.js is not installed!
    echo.
    echo Fix: Install Node.js v20 or higher from https://nodejs.org/
    set /a ISSUES_FOUND+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js version: %NODE_VERSION%
    
    REM Check if version is 20 or higher
    for /f "tokens=1 delims=." %%a in ("%NODE_VERSION:v=%") do set MAJOR_VERSION=%%a
    if !MAJOR_VERSION! LSS 20 (
        echo [WARN] Node.js version is below 20. Recommended: v20 or higher
        set /a WARNINGS_FOUND+=1
    )
)
echo.

REM ====================================
REM Check 2: Backend Directory
REM ====================================
echo [2/6] Checking backend directory...
if not exist "backend" (
    echo [FAIL] Backend directory not found!
    echo.
    echo Fix: Run this script from the project root directory
    set /a ISSUES_FOUND+=1
) else (
    echo [OK] Backend directory exists
    cd backend
)
echo.

REM ====================================
REM Check 3: Dependencies
REM ====================================
echo [3/6] Checking dependencies...
if not exist "node_modules" (
    echo [FAIL] Dependencies not installed!
    echo.
    echo Fix: Run 'npm install' in the backend directory
    set /a ISSUES_FOUND+=1
) else (
    echo [OK] Dependencies installed
    
    REM Check if key packages exist
    if not exist "node_modules\express" (
        echo [WARN] Express package not found - dependencies may be corrupted
        echo Fix: Delete node_modules folder and run 'npm install' again
        set /a WARNINGS_FOUND+=1
    )
)
echo.

REM ====================================
REM Check 4: Environment File
REM ====================================
echo [4/6] Checking .env file...
if not exist ".env" (
    echo [FAIL] .env file not found!
    echo.
    echo Fix: Copy .env.example to .env and configure it
    if exist ".env.example" (
        echo   You can run: copy .env.example .env
    )
    set /a ISSUES_FOUND+=1
) else (
    echo [OK] .env file exists
    
    REM Check for required keys
    findstr /C:"OPENAI_API_KEY" .env >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] OPENAI_API_KEY not found in .env
        echo Fix: Add your OpenAI API key to the .env file
        set /a WARNINGS_FOUND+=1
    ) else (
        REM Check if it's not the placeholder
        findstr /C:"OPENAI_API_KEY=your_" .env >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            echo [WARN] OPENAI_API_KEY appears to be a placeholder
            echo Fix: Replace with your actual OpenAI API key
            set /a WARNINGS_FOUND+=1
        ) else (
            echo [OK] OPENAI_API_KEY is configured
        )
    )
    
    findstr /C:"AI_PROVIDER" .env >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [WARN] AI_PROVIDER not found in .env
        echo Fix: Add AI_PROVIDER=openai to your .env file
        set /a WARNINGS_FOUND+=1
    )
    
    findstr /C:"PORT" .env >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] PORT not specified, will use default (3000)
    )
)
echo.

REM ====================================
REM Check 5: Port Availability
REM ====================================
echo [5/6] Checking port 3000 availability...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Port 3000 is in use
    echo.
    echo This could mean:
    echo   - Backend is already running (this is OK!)
    echo   - Another application is using port 3000
    echo.
    echo To see what's using the port:
    netstat -ano | findstr :3000
    echo.
) else (
    echo [OK] Port 3000 is available
)
echo.

REM ====================================
REM Check 6: Backend Health Check
REM ====================================
echo [6/8] Testing backend health endpoint...
curl -s http://localhost:3000/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is running and responding!
    echo.
    echo Health check response:
    curl -s http://localhost:3000/health
    echo.
    echo.
) else (
    echo [INFO] Backend is not responding on port 3000
    echo This is normal if the backend is not currently running
    echo.
)
echo.

REM ====================================
REM Check 7: TypeScript Compilation
REM ====================================
echo [7/8] Checking TypeScript compilation...
if exist "node_modules" (
    call npx tsc --noEmit > "%TEMP%\tsc-check.log" 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] No TypeScript compilation errors
    ) else (
        echo [FAIL] TypeScript compilation errors found!
        echo.
        echo First few errors:
        powershell -Command "Get-Content '%TEMP%\tsc-check.log' -Head 10"
        echo.
        echo Full errors saved to: %TEMP%\tsc-check.log
        echo Fix: Resolve the TypeScript errors shown above
        set /a ISSUES_FOUND+=1
    )
) else (
    echo [SKIP] Cannot check TypeScript - dependencies not installed
)
echo.

REM ====================================
REM Check 8: Test Configuration Loading
REM ====================================
echo [8/8] Testing configuration loading...
if exist "node_modules" (
    REM Try to load config using Node
    echo Testing if configuration can be loaded...
    node -e "require('dotenv').config(); const config = require('./src/config/index.ts'); console.log('Config loaded successfully');" > "%TEMP%\config-test.log" 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Configuration loads successfully
    ) else (
        echo [WARN] Configuration loading test failed
        echo This might be normal (TypeScript files need compilation)
        echo Check the actual startup for configuration errors
        powershell -Command "Get-Content '%TEMP%\config-test.log' -Tail 5"
    )
) else (
    echo [SKIP] Cannot test configuration - dependencies not installed
)
echo.

REM ====================================
REM Summary
REM ====================================
echo ====================================
echo Diagnostic Summary
echo ====================================
echo.

if %ISSUES_FOUND% EQU 0 (
    if %WARNINGS_FOUND% EQU 0 (
        echo [SUCCESS] No issues found!
        echo.
        echo The backend should be ready to start.
        echo.
        echo Next steps:
        echo   1. Run 'test-backend-startup.bat' to verify server can start
        echo   2. Or run 'start-backend.bat' to start the server
        echo   3. Or run 'npm run dev' in the backend directory
    ) else (
        echo [WARNING] Found %WARNINGS_FOUND% warning(s)
        echo.
        echo The backend may work, but you should address the warnings above.
        echo.
        echo You can try running 'test-backend-startup.bat' to test if it starts.
    )
) else (
    echo [FAIL] Found %ISSUES_FOUND% critical issue(s)
    if %WARNINGS_FOUND% GTR 0 (
        echo         and %WARNINGS_FOUND% warning(s)
    )
    echo.
    echo Please fix the issues above before starting the backend.
    echo.
    echo You can also try:
    echo   - Run 'fix-backend-issues.bat' to auto-fix some issues
    echo   - Run 'test-backend-startup.bat' to see detailed startup errors
    echo.
)

echo ====================================
echo.

cd ..
pause
