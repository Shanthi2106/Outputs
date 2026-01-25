@echo off
echo ====================================
echo Verify .env Configuration
echo ====================================
echo.

cd /d "%~dp0"

echo [1] Checking .env file exists...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create .env file from .env.example
    pause
    exit /b 1
)
echo [OK] .env file exists
echo.

echo [2] Checking DATABASE_URL...
findstr /C:"DATABASE_URL" .env >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] DATABASE_URL not found in .env file!
    pause
    exit /b 1
)

echo [OK] DATABASE_URL found
echo.

echo [3] Displaying DATABASE_URL (masked)...
for /f "tokens=2 delims==" %%a in ('findstr /C:"DATABASE_URL" .env') do (
    set DB_URL=%%a
    echo DATABASE_URL=!DB_URL:password=****!
)
echo.

echo [4] Testing if DATABASE_URL is on single line...
findstr /C:"DATABASE_URL" .env | findstr /V /C:"^#" | findstr /C:"postgresql://" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] DATABASE_URL might be split across multiple lines!
    echo           Make sure DATABASE_URL is on a single line in .env
    echo.
    echo Current DATABASE_URL line:
    findstr /C:"DATABASE_URL" .env
) else (
    echo [OK] DATABASE_URL appears to be on a single line
)
echo.

echo [5] Running Node.js test...
node -e "require('dotenv').config(); console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET');"
echo.

echo ====================================
echo Verification Complete
echo ====================================
echo.
echo If DATABASE_URL is not set, check:
echo 1. DATABASE_URL is on a single line (no line breaks)
echo 2. No spaces around the = sign
echo 3. Restart your backend server after changes
echo.
pause
