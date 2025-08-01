# Supabase Setup Script for Windows
# This script helps set up Supabase database for DataScraper Pro

param(
    [string]$ProjectId = "",
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Supabase Setup Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\setup-supabase.ps1 [-ProjectId <project-id>] [-Help]"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -ProjectId    Your Supabase project ID (optional, will prompt if not provided)"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Before running this script:"
    Write-Host "1. Create a Supabase project at https://supabase.com"
    Write-Host "2. Install Supabase CLI: npm install -g supabase"
    Write-Host "3. Have your database password ready"
    exit 0
}

Write-Host "🚀 DataScraper Pro - Supabase Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Supabase CLI. Please install manually:" -ForegroundColor Red
        Write-Host "npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

# Get project ID if not provided
if (-not $ProjectId) {
    Write-Host ""
    Write-Host "📋 Please provide your Supabase project information:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to https://supabase.com/dashboard/projects"
    Write-Host "2. Select your project or create a new one"
    Write-Host "3. Copy the Project ID from the project URL or settings"
    Write-Host ""
    $ProjectId = Read-Host "Enter your Supabase Project ID"
}

if (-not $ProjectId) {
    Write-Host "❌ Project ID is required. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔌 Setting up database connection..." -ForegroundColor Cyan

# Get database password
Write-Host ""
Write-Host "To get your database password:"
Write-Host "1. Go to your Supabase project dashboard"
Write-Host "2. Go to Settings → Database"
Write-Host "3. Use the password you set when creating the project"
Write-Host ""
$dbPassword = Read-Host "Enter your database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))

# Construct database URL
$dbUrl = "postgresql://postgres:$dbPasswordPlain@db.$ProjectId.supabase.co:5432/postgres"

# Create or update .env file
$envFile = ".env"
$envContent = @"
# Database Configuration
DATABASE_URL=$dbUrl

# AI Service API Keys (add your keys here)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
NODE_ENV=development
PORT=5000
SUPABASE_PROJECT_ID=$ProjectId
"@

if (Test-Path $envFile) {
    Write-Host "📝 Updating existing .env file..." -ForegroundColor Yellow
    # Read existing content and update DATABASE_URL
    $existingContent = Get-Content $envFile -Raw
    if ($existingContent -match "DATABASE_URL=.*") {
        $existingContent = $existingContent -replace "DATABASE_URL=.*", "DATABASE_URL=$dbUrl"
    } else {
        $existingContent += "`nDATABASE_URL=$dbUrl"
    }
    if ($existingContent -match "SUPABASE_PROJECT_ID=.*") {
        $existingContent = $existingContent -replace "SUPABASE_PROJECT_ID=.*", "SUPABASE_PROJECT_ID=$ProjectId"
    } else {
        $existingContent += "`nSUPABASE_PROJECT_ID=$ProjectId"
    }
    Set-Content -Path $envFile -Value $existingContent
} else {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    Set-Content -Path $envFile -Value $envContent
}

Write-Host "✅ Environment file updated" -ForegroundColor Green

# Test database connection
Write-Host ""
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan

try {
    # Simple connection test using node
    $testScript = @"
const { Client } = require('pg');
const client = new Client({ connectionString: '$dbUrl' });
client.connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return client.end();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"@
    
    $testScript | Out-File -FilePath "temp_db_test.js" -Encoding UTF8
    node temp_db_test.js
    Remove-Item "temp_db_test.js" -Force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed. Please check your credentials." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "⚠️ Could not test connection. Please verify manually." -ForegroundColor Yellow
}

# Run database migrations
Write-Host ""
Write-Host "🏗️ Running database migrations..." -ForegroundColor Cyan

if (Test-Path "drizzle") {
    try {
        npm run db:push
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema updated" -ForegroundColor Green
        } else {
            Write-Host "❌ Migration failed. You may need to run manually: npm run db:push" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Could not run migrations automatically. Run manually: npm run db:push" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Drizzle config not found. Skipping migrations." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Supabase setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add your OpenAI and Gemini API keys to the .env file"
Write-Host "2. Run: .\scripts\seed-data.ps1 (to load sample data)"
Write-Host "3. Run: npm run dev (to start the application)"
Write-Host ""
Write-Host "Your database URL has been saved to .env file" -ForegroundColor Green
Write-Host "Project ID: $ProjectId" -ForegroundColor Green
Write-Host ""