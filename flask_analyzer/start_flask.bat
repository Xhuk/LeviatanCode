@echo off
echo 🔧 Starting Flask Analyzer for Windows...

REM Change to flask_analyzer directory
cd /d "%~dp0"

REM Check if virtual environment exists
if exist "venv\Scripts\python.exe" (
    echo ✅ Using virtual environment
    venv\Scripts\python.exe run_server.py
) else (
    echo ⚠️ Virtual environment not found, using system Python
    python run_server.py
)

pause