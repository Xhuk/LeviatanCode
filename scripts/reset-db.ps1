# Database Reset Script for Windows
# This script resets the database and reloads sample data

param(
    [switch]$Confirm,
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Database Reset" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\reset-db.ps1 [-Confirm] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Confirm      Skip confirmation prompt"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "⚠️ WARNING: This will delete all existing data!"
    exit 0
}

Write-Host "⚠️ DataScraper Pro - Database Reset" -ForegroundColor Red
Write-Host "===================================" -ForegroundColor Red
Write-Host ""

if (-not $Confirm) {
    Write-Host "⚠️ WARNING: This will completely reset your database and delete all existing data!" -ForegroundColor Red
    Write-Host ""
    Write-Host "This includes:" -ForegroundColor Yellow
    Write-Host "- All projects and configurations"
    Write-Host "- AI chat history"
    Write-Host "- Prompt templates"
    Write-Host "- Scraped data"
    Write-Host "- User data"
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? Type 'RESET' to confirm"
    if ($confirmation -ne "RESET") {
        Write-Host "❌ Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "🔄 Resetting database..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found." -ForegroundColor Red
    Write-Host "Please run .\scripts\setup-supabase.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Force push schema (this will recreate all tables)
Write-Host "🏗️ Recreating database schema..." -ForegroundColor Cyan
try {
    npm run db:reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to reset database schema." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Failed to reset database schema." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database schema reset complete" -ForegroundColor Green

# Load sample data
Write-Host ""
Write-Host "📊 Loading fresh sample data..." -ForegroundColor Cyan
.\scripts\seed-data.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Database reset complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your database has been reset with:" -ForegroundColor Cyan
    Write-Host "- Fresh schema with all tables"
    Write-Host "- Sample project with demo code"
    Write-Host "- Default prompt templates"
    Write-Host "- Clean AI chat history"
    Write-Host ""
    Write-Host "You can now start the application: .\scripts\dev.ps1" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️ Database reset completed but sample data loading failed." -ForegroundColor Yellow
    Write-Host "You can manually load sample data later: .\scripts\seed-data.ps1" -ForegroundColor Cyan
}