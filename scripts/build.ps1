# Production Build Script for Windows
# This script builds the DataScraper Pro application for production

param(
    [switch]$Clean,
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Production Build" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\build.ps1 [-Clean] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Clean        Clean previous build artifacts"
    Write-Host "  -Help         Show this help message"
    exit 0
}

Write-Host "🔨 DataScraper Pro - Production Build" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Clean previous build
if ($Clean -or (Test-Path "dist")) {
    Write-Host "🧹 Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
    }
    if (Test-Path "client/dist") {
        Remove-Item "client/dist" -Recurse -Force
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

# Type checking
Write-Host "🔍 Type checking..." -ForegroundColor Cyan
npm run check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Type checking failed." -ForegroundColor Red
    Write-Host "Please fix TypeScript errors before building." -ForegroundColor Yellow
    exit 1
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Cyan
if ($env:OS -eq "Windows_NT") {
    # Windows-specific build command
    $env:NODE_ENV = "production"
    npm run build
} else {
    npm run build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Build artifacts:" -ForegroundColor Cyan
if (Test-Path "dist") {
    Write-Host "  Server: dist/" -ForegroundColor Gray
}
if (Test-Path "client/dist") {
    Write-Host "  Client: client/dist/" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "To start production server:" -ForegroundColor Cyan
Write-Host "  npm run start" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or use PM2 for process management:" -ForegroundColor Cyan
Write-Host "  npm install -g pm2" -ForegroundColor Yellow
Write-Host "  pm2 start ecosystem.config.js --env production" -ForegroundColor Yellow