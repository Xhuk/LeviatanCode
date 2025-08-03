@echo off
echo Starting LeviatanCode with proper Flask sequencing...
echo ================================================

REM Set environment variables
set NODE_ENV=development
set PORT=5005

REM Change to project root directory
cd /d "%~dp0.."

echo [1/3] Starting Flask Analyzer service...
echo Waiting for Flask to fully initialize...

REM Start Flask in background and wait for it to be ready
echo Installing Flask dependencies if needed...
cd flask_analyzer
if not exist "requirements.txt" (
    echo Error: requirements.txt not found in flask_analyzer directory
    pause
    exit /b 1
)

REM Try to install dependencies first
python -m pip install -r requirements.txt --quiet

REM Start Flask server in background
echo Starting Flask server on port 5001...
start /B python run_server.py

REM Return to project root
cd ..

REM Wait for Flask to be ready by checking health endpoint with timeout
set /a attempts=0
set /a max_attempts=30

:wait_for_flask
set /a attempts+=1
echo Attempt %attempts%/%max_attempts%: Checking Flask health...

REM Use curl if available, otherwise use PowerShell
curl -s http://127.0.0.1:5001/health >nul 2>&1
if %errorlevel% equ 0 (
    goto flask_ready
)

REM Fallback to PowerShell if curl not available
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5001/health' -UseBasicParsing -TimeoutSec 3; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    goto flask_ready
)

if %attempts% geq %max_attempts% (
    echo Error: Flask failed to start after %max_attempts% attempts
    echo Please check Flask logs and try again
    pause
    exit /b 1
)

echo Flask not ready yet, waiting 2 seconds...
timeout /t 2 /nobreak >nul
goto wait_for_flask

:flask_ready

echo [2/3] Flask Analyzer is ready!
echo Starting main Node.js application...

REM Start the main application
echo [3/3] Starting LeviatanCode main server...
npx tsx server/index.ts

pause