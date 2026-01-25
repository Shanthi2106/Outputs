@echo off
echo ====================================
echo Start ChromaDB with Docker
echo ====================================
echo.

REM Check if Docker is running
docker ps >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running or not installed!
    echo.
    echo Please:
    echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
    echo 2. Start Docker Desktop
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if ChromaDB container already exists
docker ps -a --filter "name=chromadb" --format "{{.Names}}" | findstr /C:"chromadb" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ChromaDB container already exists
    echo.
    
    REM Check if it's running
    docker ps --filter "name=chromadb" --format "{{.Names}}" | findstr /C:"chromadb" >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] ChromaDB is already running!
        echo.
        echo Container status:
        docker ps --filter "name=chromadb"
        echo.
        echo ChromaDB is available at: http://localhost:8000
        echo.
        pause
        exit /b 0
    ) else (
        echo [INFO] Starting existing ChromaDB container...
        docker start chromadb
        if %ERRORLEVEL% EQU 0 (
            echo [OK] ChromaDB started successfully!
            echo.
            echo Waiting for ChromaDB to be ready...
            timeout /t 3 /nobreak >nul
            echo.
            echo ChromaDB is available at: http://localhost:8000
            echo.
            pause
            exit /b 0
        ) else (
            echo [ERROR] Failed to start ChromaDB container
            pause
            exit /b 1
        )
    )
)

echo [INFO] Creating and starting new ChromaDB container...
echo.

REM Create ChromaDB container with persistent data
docker run -d ^
    --name chromadb ^
    -p 8000:8000 ^
    -v chroma_data:/chroma/chroma ^
    chromadb/chroma

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] ChromaDB container created and started!
    echo.
    echo Waiting for ChromaDB to be ready...
    timeout /t 5 /nobreak >nul
    
    echo.
    echo ====================================
    echo ChromaDB is running!
    echo ====================================
    echo.
    echo URL: http://localhost:8000
    echo Container name: chromadb
    echo Data volume: chroma_data (persistent)
    echo.
    echo Container status:
    docker ps --filter "name=chromadb"
    echo.
    echo To stop ChromaDB: docker stop chromadb
    echo To start again: docker start chromadb
    echo To remove: docker stop chromadb ^&^& docker rm chromadb
    echo.
    echo Your backend will automatically connect to this ChromaDB instance.
    echo.
) else (
    echo.
    echo [ERROR] Failed to create ChromaDB container
    echo.
    echo Make sure:
    echo - Docker Desktop is running
    echo - Port 8000 is not in use by another application
    echo.
)

pause
