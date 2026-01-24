@echo off
echo ====================================
echo Starting Full Application
echo ====================================
echo.
echo This will start both backend and frontend servers
echo.
echo Press Ctrl+C in each window to stop the servers
echo.
pause

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js v20 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if concurrently is installed (for running both servers)
cd backend
if not exist "..\node_modules" (
    echo Installing root dependencies...
    cd ..
    call npm install
    cd backend
)

cd ..

REM Check if backend .env exists
if not exist "backend\.env" (
    echo ERROR: backend\.env file not found!
    echo Please copy backend\.env.example to backend\.env and configure it.
    pause
    exit /b 1
)

REM Check if frontend .env exists
if not exist "frontend\.env" (
    echo Creating frontend\.env from .env.example...
    copy frontend\.env.example frontend\.env
)

echo.
echo Starting both servers...
echo Backend will run on: http://localhost:3000
echo Frontend will run on: http://localhost:5173
echo.
echo ====================================
echo.

REM Start both servers using concurrently
call npm run dev
