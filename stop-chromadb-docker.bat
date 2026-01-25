@echo off
echo ====================================
echo Stop ChromaDB Docker Container
echo ====================================
echo.

docker stop chromadb >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] ChromaDB container stopped
) else (
    echo [INFO] ChromaDB container was not running or doesn't exist
)

echo.
pause
