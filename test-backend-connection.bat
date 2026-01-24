@echo off
echo ====================================
echo Backend Connection Diagnostic Tool
echo ====================================
echo.

echo [1] Checking if backend is running...
netstat -ano | findstr :3003 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend is running on port 3003
) else (
    echo [ERROR] Backend is NOT running on port 3003
    echo         Please start the backend: npm run dev
    echo.
    pause
    exit /b 1
)
echo.

echo [2] Checking if ChromaDB is running...
netstat -ano | findstr :8000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] ChromaDB is running on port 8000
) else (
    echo [WARNING] ChromaDB is NOT running on port 8000
    echo           Start ChromaDB: .\start-chromadb.bat
    echo           Or: docker run -p 8000:8000 chromadb/chroma
)
echo.

echo [3] Testing backend health endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3003/health' -Method GET -TimeoutSec 5; Write-Host '[OK] Backend health check: SUCCESS - Status' $response.StatusCode; Write-Host $response.Content } catch { Write-Host '[ERROR] Backend health check: FAILED -' $_.Exception.Message }"
echo.

echo [4] Testing ChromaDB connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/heartbeat' -Method GET -TimeoutSec 5; Write-Host '[OK] ChromaDB connection: SUCCESS' } catch { if ($_.Exception.Message -like '*deprecated*' -or $_.Exception.Response.StatusCode -eq 405) { Write-Host '[OK] ChromaDB connection: RUNNING (v2 API)' } else { Write-Host '[ERROR] ChromaDB connection: FAILED -' $_.Exception.Message } }"
echo.

echo [5] Checking .env configuration...
cd backend
if exist ".env" (
    echo [OK] .env file exists
    findstr /C:"CHROMA_URL" .env >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] CHROMA_URL is configured
        findstr /C:"CHROMA_URL=http://localhost:8000" .env
    ) else (
        echo [WARNING] CHROMA_URL not found in .env
    )
) else (
    echo [ERROR] .env file not found!
)
echo.

echo [6] Checking backend dependencies...
if exist "node_modules" (
    echo [OK] Dependencies are installed
) else (
    echo [ERROR] Dependencies NOT installed - run: npm install
)
echo.

echo ====================================
echo Diagnostic Complete
echo ====================================
echo.
echo If all checks pass, your backend should be working.
echo If you see errors, fix them and restart the backend.
echo.
pause
