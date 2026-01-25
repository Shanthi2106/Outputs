@echo off
echo ====================================
echo OpenAI API Key Verification Tool
echo ====================================
echo.

cd /d "%~dp0backend"

echo [1] Reading API key from .env...
if not exist ".env" (
    echo [ERROR] .env file not found!
    pause
    exit /b 1
)

for /f "tokens=2 delims==" %%a in ('findstr /C:"OPENAI_API_KEY" .env ^| findstr /V "^#"') do (
    set API_KEY=%%a
)

if not defined API_KEY (
    echo [ERROR] OPENAI_API_KEY not found in .env file!
    echo.
    echo Please add your OpenAI API key to backend/.env:
    echo OPENAI_API_KEY=sk-your-key-here
    pause
    exit /b 1
)

echo [OK] API key found in .env
echo [INFO] Key starts with: %API_KEY:~0,7%...
echo [INFO] Key length: %API_KEY:~0,100% | find /c /v ""
echo.

echo [2] Checking API key format...
echo %API_KEY% | findstr /R "^sk-" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] API key format looks correct (starts with sk-)
) else (
    echo %API_KEY% | findstr /R "^sk-proj-" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] API key format looks correct (starts with sk-proj-)
    ) else (
        echo [WARNING] API key format may be incorrect
        echo           Should start with "sk-" or "sk-proj-"
    )
)
echo.

echo [3] Testing API key with OpenAI...
echo This will make a test request to verify your API key is valid...
echo.
powershell -Command "$apiKey = '%API_KEY%'; $headers = @{ 'Authorization' = \"Bearer $apiKey\"; 'Content-Type' = 'application/json' }; try { $response = Invoke-WebRequest -Uri 'https://api.openai.com/v1/models' -Method GET -Headers $headers -TimeoutSec 10; Write-Host '[OK] API key is VALID!'; Write-Host '[OK] OpenAI API is accessible'; $data = $response.Content | ConvertFrom-Json; Write-Host \"[OK] You have access to $($data.data.Count) models\" } catch { Write-Host '[ERROR] API key validation failed!'; Write-Host 'Error:' $_.Exception.Message; if ($_.Exception.Response.StatusCode -eq 401) { Write-Host ''; Write-Host 'This means your API key is INVALID or EXPIRED.'; Write-Host 'Please:'; Write-Host '1. Go to https://platform.openai.com/api-keys'; Write-Host '2. Create a new API key'; Write-Host '3. Update OPENAI_API_KEY in backend/.env'; Write-Host '4. Restart your backend server' } }"
echo.

echo ====================================
echo Verification Complete
echo ====================================
echo.
pause
