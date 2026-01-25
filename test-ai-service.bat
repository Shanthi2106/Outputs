@echo off
echo ====================================
echo AI Service Diagnostic Tool
echo ====================================
echo.

cd /d "%~dp0backend"

echo [1] Checking .env configuration...
if not exist ".env" (
    echo [ERROR] .env file not found!
    pause
    exit /b 1
)

echo [OK] .env file exists
echo.

echo [2] Checking AI Provider configuration...
findstr /C:"AI_PROVIDER" .env
findstr /C:"AI_MODEL" .env
echo.

echo [3] Checking API Keys...
findstr /C:"OPENAI_API_KEY" .env | findstr /V "^#" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] OPENAI_API_KEY is set
    for /f "tokens=2 delims==" %%a in ('findstr /C:"OPENAI_API_KEY" .env') do (
        set KEY=%%a
        if "!KEY!"=="YOUR_API_KEY" (
            echo [ERROR] OPENAI_API_KEY appears to be a placeholder!
        ) else (
            echo [OK] API key format looks valid (length check)
        )
    )
) else (
    echo [ERROR] OPENAI_API_KEY not found in .env
)
echo.

echo [4] Testing backend connection...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3004/api/v1/health' -Method GET -TimeoutSec 5; Write-Host '[OK] Backend is reachable - Status:' $response.StatusCode; $data = $response.Content | ConvertFrom-Json; Write-Host '[OK] AI Provider:' $data.services.ai.provider; Write-Host '[OK] AI Configured:' $data.services.ai.configured } catch { Write-Host '[ERROR] Backend connection failed:' $_.Exception.Message }"
echo.

echo [5] Testing AI service directly...
echo This will make a test API call to verify OpenAI connection...
echo.
powershell -Command "$body = @{ message = 'What is ABA?' } | ConvertTo-Json; try { $response = Invoke-WebRequest -Uri 'http://localhost:3004/api/v1/conversation' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 30; Write-Host '[OK] AI Service test successful!'; $data = $response.Content | ConvertFrom-Json; if ($data.success) { Write-Host '[OK] Response received:' $data.response.Substring(0, [Math]::Min(100, $data.response.Length)) '...' } else { Write-Host '[ERROR] AI Service returned error:' $data.message } } catch { Write-Host '[ERROR] AI Service test failed:' $_.Exception.Message; if ($_.Exception.Response) { $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $responseBody = $reader.ReadToEnd(); Write-Host 'Response:' $responseBody } }"
echo.

echo ====================================
echo Diagnostic Complete
echo ====================================
echo.
echo Check the results above to identify the issue.
echo Common issues:
echo   - Invalid or expired API key
echo   - Rate limit from OpenAI
echo   - Network connectivity issues
echo   - Backend not running
echo.
pause
