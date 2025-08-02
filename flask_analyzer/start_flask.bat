@echo off
chcp 65001 >nul
echo Starting Flask Analyzer for Windows...

REM Change to flask_analyzer directory
cd /d "%~dp0"

REM Install Flask if not available
echo Installing Flask dependencies...
pip install flask flask-cors requests werkzeug --user --quiet >nul 2>&1

REM Check if virtual environment exists and has Flask
if exist "venv\Scripts\python.exe" (
    echo Checking virtual environment...
    venv\Scripts\pip install flask flask-cors requests werkzeug --quiet >nul 2>&1
    if %errorlevel%==0 (
        echo Using virtual environment
        venv\Scripts\python.exe run_server.py
    ) else (
        echo Virtual environment setup failed, using system Python
        python run_server.py
    )
) else (
    echo Virtual environment not found, using system Python
    python run_server.py
)