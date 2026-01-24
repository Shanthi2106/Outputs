@echo off
setlocal enabledelayedexpansion

echo ====================================
echo Backend Auto-Fix Tool
echo ====================================
echo.
echo This tool will automatically fix common backend startup issues.
echo.

set FIXES_APPLIED=0

REM Navigate to backend directory
if not exist "backend" (
    echo [ERROR] Backend directory not found!
    echo Run this script from the project root directory.
    pause
    exit /b 1
)

cd backend

REM ====================================
REM Fix 1: Missing .env file
REM ====================================
echo [1/6] Checking for .env file...
if not exist ".env" (
    echo [FIX] .env file not found!
    if exist ".env.example" (
        echo [FIX] Copying .env.example to .env...
        copy .env.example .env >nul
        echo [OK] .env file created from .env.example
        echo [INFO] Please edit .env and add your API keys!
        set /a FIXES_APPLIED+=1
    ) else (
        echo [ERROR] .env.example not found! Cannot create .env automatically.
    )
) else (
    echo [OK] .env file exists
)
echo.

REM ====================================
REM Fix 2: Missing dependencies
REM ====================================
echo [2/6] Checking dependencies...
if not exist "node_modules" (
    echo [FIX] Dependencies not installed!
    echo [FIX] Running npm install...
    call npm install
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Dependencies installed successfully
        set /a FIXES_APPLIED+=1
    ) else (
        echo [ERROR] Failed to install dependencies
        echo Check your internet connection and try again.
    )
) else (
    echo [OK] Dependencies installed
    
    REM Check if key packages are missing
    if not exist "node_modules\express" (
        echo [FIX] Dependencies appear corrupted (express missing)
        echo [FIX] Reinstalling dependencies...
        rmdir /s /q node_modules 2>nul
        call npm install
        if %ERRORLEVEL% EQU 0 (
            echo [OK] Dependencies reinstalled successfully
            set /a FIXES_APPLIED+=1
        )
    )
)
echo.

REM ====================================
REM Fix 3: Port conflicts
REM ====================================
echo [3/6] Checking for port conflicts...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3000 is in use
    echo.
    echo Options:
    echo   1. Kill the process using port 3000
    echo   2. Change the port in .env file
    echo   3. Skip (manual fix required)
    echo.
    set /p PORT_CHOICE="Choose option (1/2/3): "
    
    if "!PORT_CHOICE!"=="1" (
        echo [FIX] Finding and killing process on port 3000...
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
            echo Stopping process %%a...
            taskkill /PID %%a /F >nul 2>&1
            if !ERRORLEVEL! EQU 0 (
                echo [OK] Process stopped
                set /a FIXES_APPLIED+=1
            )
        )
        timeout /t 2 /nobreak >nul
    ) else if "!PORT_CHOICE!"=="2" (
        echo [FIX] Changing port to 3001...
        if exist ".env" (
            powershell -Command "(Get-Content .env) -replace '^PORT=.*', 'PORT=3001' | Set-Content .env"
            echo [OK] Port changed to 3001 in .env
            echo [INFO] Remember to update frontend/.env: VITE_API_URL=http://localhost:3001/api/v1
            set /a FIXES_APPLIED+=1
        )
    ) else (
        echo [SKIP] Port conflict not resolved
    )
) else (
    echo [OK] Port 3000 is available
)
echo.

REM ====================================
REM Fix 4: Check API key placeholder
REM ====================================
echo [4/6] Checking API key configuration...
if exist ".env" (
    findstr /C:"OPENAI_API_KEY=your_" .env >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo [WARNING] OPENAI_API_KEY appears to be a placeholder
        echo [INFO] This needs to be set manually - cannot auto-fix
        echo [INFO] Get your key from: https://platform.openai.com/api-keys
    ) else (
        findstr /C:"OPENAI_API_KEY=" .env >nul 2>nul
        if !ERRORLEVEL! NEQ 0 (
            echo [WARNING] OPENAI_API_KEY not found in .env
            echo [INFO] Add OPENAI_API_KEY=sk-your-key-here to .env
        ) else (
            echo [OK] OPENAI_API_KEY is configured
        )
    )
) else (
    echo [SKIP] Cannot check - .env file not found
)
echo.

REM ====================================
REM Fix 5: TypeScript compilation issues
REM ====================================
echo [5/6] Checking TypeScript compilation...
if exist "node_modules" (
    echo [INFO] Running TypeScript type check...
    call npx tsc --noEmit > "%TEMP%\tsc-fix-check.log" 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] TypeScript compilation errors found
        echo [INFO] Review errors in: %TEMP%\tsc-fix-check.log
        echo [INFO] These need to be fixed manually in the source code
        type "%TEMP%\tsc-fix-check.log" | more
    ) else (
        echo [OK] No TypeScript compilation errors
        del "%TEMP%\tsc-fix-check.log" 2>nul
    )
) else (
    echo [SKIP] Cannot check - dependencies not installed
)
echo.

REM ====================================
REM Fix 6: Clean build artifacts
REM ====================================
echo [6/6] Checking for build artifacts...
if exist "dist" (
    echo [INFO] Build artifacts found (dist folder)
    echo [INFO] These can be regenerated, but won't affect dev mode
    echo [INFO] To clean: rmdir /s /q dist
) else (
    echo [OK] No build artifacts (using dev mode)
)
echo.

REM ====================================
REM Summary
REM ====================================
echo ====================================
echo Auto-Fix Summary
echo ====================================
echo.

if %FIXES_APPLIED% GTR 0 (
    echo [SUCCESS] Applied %FIXES_APPLIED% fix(es)!
    echo.
    echo Next steps:
    echo   1. Review any warnings above
    echo   2. Run 'test-backend-startup.bat' to verify fixes
    echo   3. Or run 'start-backend.bat' to start the server
) else (
    echo [INFO] No automatic fixes were needed or applied
    echo.
    echo If you're still having issues:
    echo   1. Run 'diagnose-backend.bat' for detailed diagnostics
    echo   2. Run 'test-backend-startup.bat' to see startup errors
    echo   3. Check backend-startup.log for detailed error messages
)

echo.
echo ====================================
echo.

cd ..
pause
