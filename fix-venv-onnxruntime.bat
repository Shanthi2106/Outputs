@echo off
echo ====================================
echo Fix onnxruntime Python 3.14 Error
echo ====================================
echo.

cd /d "%~dp0backend"

echo [INFO] The onnxruntime error occurs because Python 3.14 wheels aren't available yet.
echo        Your venv uses Python 3.13.9, which should work fine.
echo.

echo [1] Checking if ChromaDB is already working...
if exist "venv\Scripts\chroma.exe" (
    echo [OK] ChromaDB is already installed!
    venv\Scripts\chroma.exe --version
    echo.
    echo ChromaDB is ready to use. You can ignore the onnxruntime error.
    echo.
    pause
    exit /b 0
)
echo.

echo [2] Option A: Use Docker (Recommended - No Python issues)
echo.
echo    Run this command in a separate terminal:
echo    docker run -d --name chromadb -p 8000:8000 chromadb/chroma
echo.
echo    Then update backend/.env:
echo    CHROMA_URL=http://localhost:8000
echo.
echo [3] Option B: Fix Python venv
echo.
echo    The venv might be corrupted. To fix:
echo    1. Close all terminals and processes using the venv
echo    2. Delete the venv folder manually
echo    3. Run: python -m venv venv
echo    4. Run: venv\Scripts\activate
echo    5. Run: pip install chromadb
echo.

set /p CHOICE="Do you want to try Option B (recreate venv)? (y/n): "
if /i not "!CHOICE!"=="y" (
    echo.
    echo Using Docker is recommended. See instructions above.
    pause
    exit /b 0
)

echo.
echo [WARNING] This will delete the existing venv.
echo           Make sure no processes are using it.
echo.
set /p CONFIRM="Continue? (y/n): "
if /i not "!CONFIRM!"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo [4] Stopping any processes using venv...
taskkill /F /IM python.exe /T >nul 2>nul
timeout /t 2 /nobreak >nul

echo [5] Recreating venv...
if exist "venv" (
    echo Deleting old venv...
    rmdir /s /q venv 2>nul
)

python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create venv
    pause
    exit /b 1
)

echo [OK] Venv created
echo.

echo [6] Installing ChromaDB...
call venv\Scripts\Activate.bat
pip install --upgrade pip
pip install chromadb

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] ChromaDB installed successfully!
    chroma --version
) else (
    echo.
    echo [ERROR] Installation failed
    echo         Try using Docker instead (see Option A above)
)

echo.
pause
