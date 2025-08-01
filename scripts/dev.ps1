# Development Server Launcher for Windows
# This script starts the DataScraper Pro development server

param(
    [int]$Port = 5000,
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Development Server" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 [-Port <port>] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Port         Port number to run the server (default: 5000)"
    Write-Host "  -Help         Show this help message"
    exit 0
}

Write-Host "🚀 DataScraper Pro - Development Server" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found." -ForegroundColor Yellow
    Write-Host "Please run .\scripts\setup-supabase.ps1 first to configure your environment." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

# Check if port is available
try {
    $portCheck = netstat -an | findstr ":$Port "
    if ($portCheck) {
        Write-Host "⚠️ Port $Port is already in use:" -ForegroundColor Yellow
        Write-Host $portCheck
        Write-Host ""
        $newPort = Read-Host "Enter a different port number (or press Enter to kill existing process)"
        if ($newPort) {
            $Port = [int]$newPort
        } else {
            Write-Host "Attempting to free port $Port..." -ForegroundColor Yellow
            $processes = netstat -ano | findstr ":$Port " | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
            foreach ($pid in $processes) {
                if ($pid -match '^\d+$') {
                    try {
                        taskkill /PID $pid /F 2>$null
                        Write-Host "Killed process $pid" -ForegroundColor Green
                    } catch {
                        Write-Host "Could not kill process $pid" -ForegroundColor Yellow
                    }
                }
            }
        }
    }
} catch {
    # Port check failed, continue anyway
}

# Set environment variables
$env:PORT = $Port
$env:NODE_ENV = "development"

Write-Host "🌐 Starting development server on port $Port..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Application will be available at:" -ForegroundColor Green
Write-Host "  http://localhost:$Port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "❌ Server stopped unexpectedly." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues and solutions:" -ForegroundColor Yellow
    Write-Host "1. Check if all dependencies are installed: npm install"
    Write-Host "2. Verify database connection in .env file"
    Write-Host "3. Ensure API keys are properly set"
    Write-Host "4. Check for any error messages above"
    Write-Host ""
    Write-Host "For detailed troubleshooting, see docs/WINDOWS_SETUP.md" -ForegroundColor Cyan
    exit 1
}