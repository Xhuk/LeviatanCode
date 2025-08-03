# LeviatanCode Windows PowerShell Startup Script
# Ensures Flask loads completely before starting the main application

Write-Host "Starting LeviatanCode with proper Flask sequencing..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Gray

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "5005"

# Change to project root directory
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "[1/3] Starting Flask Analyzer service..." -ForegroundColor Yellow

# Check if Flask analyzer directory exists
if (-not (Test-Path "flask_analyzer")) {
    Write-Host "Error: flask_analyzer directory not found" -ForegroundColor Red
    exit 1
}

# Install Flask dependencies
Write-Host "Installing Flask dependencies..." -ForegroundColor Gray
Set-Location "flask_analyzer"

if (-not (Test-Path "requirements.txt")) {
    Write-Host "Error: requirements.txt not found" -ForegroundColor Red
    exit 1
}

try {
    python -m pip install -r requirements.txt --quiet
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not install dependencies, continuing..." -ForegroundColor Yellow
}

# Start Flask server in background
Write-Host "Starting Flask server on port 5001..." -ForegroundColor Gray
$flaskJob = Start-Job -ScriptBlock {
    Set-Location $using:pwd
    python run_server.py
}

# Return to project root
Set-Location $projectRoot

# Wait for Flask to be ready
Write-Host "Waiting for Flask to be ready..." -ForegroundColor Gray
$maxAttempts = 30
$attempt = 0
$flaskReady = $false

while ($attempt -lt $maxAttempts -and -not $flaskReady) {
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts : Checking Flask health..." -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:5001/health" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) {
            $flaskReady = $true
            Write-Host "[2/3] Flask Analyzer is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Flask not ready yet
    }
    
    if ($attempt -lt $maxAttempts) {
        Write-Host "Flask not ready yet, waiting 2 seconds..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $flaskReady) {
    Write-Host "Error: Flask failed to start after $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Please check Flask logs and try again" -ForegroundColor Red
    # Clean up background job
    if ($flaskJob) {
        Stop-Job $flaskJob
        Remove-Job $flaskJob
    }
    exit 1
}

# Start the main application
Write-Host "[3/3] Starting LeviatanCode main server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:5005" -ForegroundColor Cyan

try {
    npx tsx server/index.ts
} catch {
    Write-Host "Error starting main application: $_" -ForegroundColor Red
    # Clean up background job
    if ($flaskJob) {
        Stop-Job $flaskJob
        Remove-Job $flaskJob
    }
    exit 1
} finally {
    # Clean up background job when main app exits
    if ($flaskJob) {
        Write-Host "Cleaning up Flask process..." -ForegroundColor Gray
        Stop-Job $flaskJob
        Remove-Job $flaskJob
    }
}

Write-Host "LeviatanCode has stopped." -ForegroundColor Yellow