@echo off
REM Start ChromaDB server using Python virtual environment
echo Starting ChromaDB server...
echo.

cd /d "%~dp0backend"

REM Check if venv exists
if not exist "venv\Scripts\Activate.bat" (
    echo ERROR: Python virtual environment not found!
    echo Please run: python -m venv venv
    echo Then install requirements: venv\Scripts\Activate.bat ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activate virtual environment and start ChromaDB
call venv\Scripts\Activate.bat

REM Create data directory if it doesn't exist
if not exist "my_chroma_data" mkdir my_chroma_data

echo Starting ChromaDB on http://localhost:8000
echo Data directory: %CD%\my_chroma_data
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start ChromaDB server
chroma run --host localhost --port 8000 --path ./my_chroma_data

pause
