@echo off
echo ====================================
echo Backend Connection Fix Tool
echo ====================================
echo.

cd /d "%~dp0backend"

echo [1] Checking .env file...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo         Copying from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo [OK] .env file created from .env.example
        echo       Please edit .env and add your API keys
    ) else (
        echo [ERROR] .env.example not found either!
        pause
        exit /b 1
    )
) else (
    echo [OK] .env file exists
)
echo.

echo [2] Checking required environment variables...
set MISSING=0

findstr /C:"CHROMA_URL" .env >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] CHROMA_URL not found - adding default...
    echo CHROMA_URL=http://localhost:8000 >> .env
    set MISSING=1
)

findstr /C:"CHROMA_COLLECTION_NAME" .env >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] CHROMA_COLLECTION_NAME not found - adding default...
    echo CHROMA_COLLECTION_NAME=autism-documents >> .env
    set MISSING=1
)

if %MISSING% EQU 0 (
    echo [OK] All required ChromaDB variables are set
) else (
    echo [OK] Missing variables added to .env
)
echo.

echo [3] Checking if ChromaDB is running...
netstat -ano | findstr :8000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] ChromaDB is running on port 8000
) else (
    echo [WARNING] ChromaDB is NOT running
    echo           Starting ChromaDB...
    cd ..
    call start-chromadb.bat
    timeout /t 3 /nobreak >nul
    cd backend
)
echo.

echo [4] Checking if backend port is available...
netstat -ano | findstr :3003 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 3003 is already in use
    echo           This might mean backend is already running
    echo           Or another application is using the port
    echo.
    echo           To stop existing backend:
    echo           - Close other terminal windows
    echo           - Or find process: netstat -ano ^| findstr :3003
) else (
    echo [OK] Port 3003 is available
)
echo.

echo [5] Checking dependencies...
if exist "node_modules" (
    echo [OK] Dependencies are installed
) else (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)
echo.

echo ====================================
echo Fix Complete
echo ====================================
echo.
echo Next steps:
echo   1. Make sure ChromaDB is running: .\start-chromadb.bat
echo   2. Start the backend: npm run dev
echo   3. Test connection: .\test-backend-connection.bat
echo.
pause
