@echo off
echo ====================================
echo Autism Assistant - Setup Script
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js v20 or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking Node.js version...
node --version
echo.

REM Install root dependencies
echo Installing root dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit backend\.env and add your OpenAI API key!
    echo.
)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env
)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo NEXT STEPS:
echo.
echo 1. Edit backend\.env and add your OpenAI API key:
echo    - AI_PROVIDER=openai
echo    - OPENAI_API_KEY=sk-your-key-here
echo.
echo 2. Start the application:
echo    npm run dev
echo.
echo 3. Open http://localhost:5173 in your browser
echo.
echo For more information, see:
echo - QUICKSTART.md for 5-minute setup
echo - README.md for full documentation
echo - API_TESTING.md for testing the API
echo.
pause
