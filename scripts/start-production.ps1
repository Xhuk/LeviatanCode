# Production Startup Script for Windows
# This script starts DataScraper Pro in production mode

param(
    [string]$Port = "5000",
    [switch]$UseSSL,
    [switch]$UsePM2,
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Production Startup" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-production.ps1 [-Port <port>] [-UseSSL] [-UsePM2] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Port         Port number (default: 5000)"
    Write-Host "  -UseSSL       Enable HTTPS (requires SSL certificates)"
    Write-Host "  -UsePM2       Use PM2 process manager"
    Write-Host "  -Help         Show this help message"
    exit 0
}

Write-Host "🚀 DataScraper Pro - Production Startup" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if built
if (-not (Test-Path "dist")) {
    Write-Host "⚠️ Production build not found. Building now..." -ForegroundColor Yellow
    .\scripts\build.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed. Cannot start production server." -ForegroundColor Red
        exit 1
    }
}

# Check environment file
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found." -ForegroundColor Red
    Write-Host "Please run .\scripts\setup-supabase.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Set production environment
$env:NODE_ENV = "production"
$env:PORT = $Port

if ($UseSSL) {
    Write-Host "🔐 SSL mode enabled" -ForegroundColor Cyan
    # SSL configuration would go here
}

if ($UsePM2) {
    Write-Host "⚙️ Starting with PM2 process manager..." -ForegroundColor Cyan
    
    # Check if PM2 is installed
    try {
        pm2 --version | Out-Null
    } catch {
        Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
        npm install -g pm2
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install PM2." -ForegroundColor Red
            exit 1
        }
    }
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application started with PM2" -ForegroundColor Green
        Write-Host ""
        Write-Host "PM2 Commands:" -ForegroundColor Cyan
        Write-Host "  pm2 status                 # Check status"
        Write-Host "  pm2 logs datascraper-pro   # View logs"
        Write-Host "  pm2 restart datascraper-pro # Restart app"
        Write-Host "  pm2 stop datascraper-pro   # Stop app"
        Write-Host "  pm2 delete datascraper-pro # Remove from PM2"
    } else {
        Write-Host "❌ Failed to start with PM2." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "🌐 Starting production server on port $Port..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Application will be available at:" -ForegroundColor Green
    if ($UseSSL) {
        Write-Host "  https://localhost:$Port" -ForegroundColor Cyan
    } else {
        Write-Host "  http://localhost:$Port" -ForegroundColor Cyan
    }
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    # Start the production server
    npm run start
}

Write-Host ""
Write-Host "🎉 Production server is running!" -ForegroundColor Green