@echo off
echo ====================================
echo Recreate Python Virtual Environment
echo ====================================
echo.

cd /d "%~dp0"

echo [WARNING] This will delete the existing venv and create a new one.
echo           Make sure to close all terminals and processes first.
echo.
set /p CONFIRM="Continue? (y/n): "
if /i not "!CONFIRM!"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [1] Stopping Python processes...
taskkill /F /IM python.exe /T >nul 2>nul
timeout /t 2 /nobreak >nul

echo [2] Removing old venv...
if exist "venv" (
    rmdir /s /q venv 2>nul
    if exist "venv" (
        echo [ERROR] Could not delete venv. Please close all terminals and try again.
        echo         Or delete the venv folder manually.
        pause
        exit /b 1
    )
)

echo [3] Creating new venv with Python 3.13...
python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create venv
    pause
    exit /b 1
)

echo [OK] Venv created
echo.

echo [4] Upgrading pip...
call venv\Scripts\Activate.bat
python -m pip install --upgrade pip setuptools wheel
echo.

echo [5] Installing ChromaDB...
pip install chromadb
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] ChromaDB installed successfully!
    echo.
    chroma --version
    echo.
    echo [OK] Setup complete! You can now use ChromaDB.
) else (
    echo.
    echo [ERROR] Installation failed
    echo.
    echo Alternative: Use Docker instead:
    echo   docker run -d --name chromadb -p 8000:8000 chromadb/chroma
)

echo.
pause
