@echo off
echo ====================================
echo Install ChromaDB with uv (Python 3.14 Fix)
echo ====================================
echo.

cd /d "%~dp0"

echo [INFO] You're using Python 3.14, but onnxruntime doesn't have stable wheels for it yet.
echo        Options:
echo        1. Use pre-release versions (--prerelease=allow)
echo        2. Use Python 3.13 instead (recommended)
echo        3. Use Docker (easiest - no Python issues)
echo.

set /p CHOICE="Choose option (1=pre-release, 2=Python 3.13, 3=Docker, q=quit): "
if /i "!CHOICE!"=="q" exit /b 0

if "!CHOICE!"=="1" (
    echo.
    echo [1] Installing with pre-release versions enabled...
    if not exist "venv" (
        echo Creating venv...
        python -m venv venv
    )
    call venv\Scripts\Activate.bat
    uv pip install --prerelease=allow chromadb
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [OK] ChromaDB installed with pre-release versions!
        chroma --version
    ) else (
        echo.
        echo [ERROR] Installation failed. Try Option 2 or 3 instead.
    )
    goto :end
)

if "!CHOICE!"=="2" (
    echo.
    echo [2] Using Python 3.13 instead...
    echo.
    echo Checking for Python 3.13...
    where python3.13 >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Python 3.13 found!
        if exist "venv" (
            echo Removing old venv...
            rmdir /s /q venv 2>nul
        )
        echo Creating venv with Python 3.13...
        python3.13 -m venv venv
        call venv\Scripts\Activate.bat
        uv pip install chromadb
        if %ERRORLEVEL% EQU 0 (
            echo.
            echo [OK] ChromaDB installed with Python 3.13!
            chroma --version
        ) else (
            echo.
            echo [ERROR] Installation failed.
        )
    ) else (
        echo [ERROR] Python 3.13 not found!
        echo.
        echo Please install Python 3.13 from https://www.python.org/downloads/
        echo Or use Option 3 (Docker) instead.
    )
    goto :end
)

if "!CHOICE!"=="3" (
    echo.
    echo [3] Using Docker (Recommended)...
    echo.
    echo Run this command in a separate terminal:
    echo   docker run -d --name chromadb -p 8000:8000 chromadb/chroma
    echo.
    echo Then update backend/.env:
    echo   CHROMA_URL=http://localhost:8000
    echo.
    echo No Python venv needed!
    goto :end
)

echo Invalid choice.
:end
echo.
pause
