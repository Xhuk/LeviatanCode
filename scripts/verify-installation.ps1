# Installation Verification Script
# This script verifies that DataScraper Pro is properly set up

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Installation Verification" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\verify-installation.ps1 [-Help]"
    Write-Host ""
    Write-Host "This script checks all components of your DataScraper Pro installation."
    exit 0
}

Write-Host "🔍 DataScraper Pro - Installation Verification" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

$allChecks = $true

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
    Write-Host "  ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found or not working" -ForegroundColor Red
    Write-Host "     Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    $allChecks = $false
}

# Check project structure
Write-Host ""
Write-Host "📁 Checking project structure..." -ForegroundColor Cyan
$requiredFolders = @("client", "server", "shared", "scripts", "docs")
foreach ($folder in $requiredFolders) {
    if (Test-Path $folder) {
        Write-Host "  ✅ $folder/ directory exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $folder/ directory missing" -ForegroundColor Red
        $allChecks = $false
    }
}

# Check key files
$requiredFiles = @("package.json", "drizzle.config.ts", "tsconfig.json", "vite.config.ts")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file missing" -ForegroundColor Red
        $allChecks = $false
    }
}

# Check dependencies
Write-Host ""
Write-Host "📚 Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules directory exists" -ForegroundColor Green
    
    # Check package.json
    try {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $depCount = ($packageJson.dependencies | Get-Member -Type NoteProperty).Count
        Write-Host "  ✅ $depCount dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ Could not read package.json" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ node_modules not found" -ForegroundColor Red
    Write-Host "     Run: npm install" -ForegroundColor Yellow
    $allChecks = $false
}

# Check environment configuration
Write-Host ""
Write-Host "⚙️ Checking environment configuration..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "  ✅ .env file exists" -ForegroundColor Green
    
    # Parse .env file
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $envVars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
    
    # Check required variables
    $requiredEnvVars = @("DATABASE_URL", "OPENAI_API_KEY")
    foreach ($var in $requiredEnvVars) {
        if ($envVars.ContainsKey($var) -and $envVars[$var] -ne "your_${var.ToLower()}_here") {
            Write-Host "  ✅ $var is configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var not configured" -ForegroundColor Red
            $allChecks = $false
        }
    }
    
    # Check optional variables
    $optionalEnvVars = @("GEMINI_API_KEY", "PORT", "NODE_ENV")
    foreach ($var in $optionalEnvVars) {
        if ($envVars.ContainsKey($var) -and $envVars[$var] -ne "your_${var.ToLower()}_here") {
            Write-Host "  ✅ $var is configured" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ $var not configured (optional)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  ❌ .env file not found" -ForegroundColor Red
    Write-Host "     Run: .\scripts\setup-supabase.ps1" -ForegroundColor Yellow
    $allChecks = $false
}

# Test database connection
if (Test-Path ".env") {
    Write-Host ""
    Write-Host "🔌 Testing database connection..." -ForegroundColor Cyan
    try {
        $testResult = .\scripts\test-db.ps1 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Database connection failed" -ForegroundColor Red
            Write-Host "     Check your DATABASE_URL in .env" -ForegroundColor Yellow
            $allChecks = $false
        }
    } catch {
        Write-Host "  ⚠️ Could not test database connection" -ForegroundColor Yellow
    }
}

# Check TypeScript compilation
Write-Host ""
Write-Host "🔧 Checking TypeScript..." -ForegroundColor Cyan
try {
    npm run check 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "  ❌ TypeScript compilation errors" -ForegroundColor Red
        Write-Host "     Run: npm run check" -ForegroundColor Yellow
        $allChecks = $false
    }
} catch {
    Write-Host "  ⚠️ Could not check TypeScript" -ForegroundColor Yellow
}

# Check PowerShell scripts
Write-Host ""
Write-Host "⚡ Checking PowerShell scripts..." -ForegroundColor Cyan
$scripts = @("setup-supabase.ps1", "seed-data.ps1", "dev.ps1", "test-db.ps1", "build.ps1")
foreach ($script in $scripts) {
    if (Test-Path "scripts/$script") {
        Write-Host "  ✅ scripts/$script exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ scripts/$script missing" -ForegroundColor Red
        $allChecks = $false
    }
}

# Check sample data
Write-Host ""
Write-Host "📊 Checking sample data..." -ForegroundColor Cyan
if (Test-Path "sample-data") {
    $sampleFiles = Get-ChildItem "sample-data" -File
    if ($sampleFiles.Count -gt 0) {
        Write-Host "  ✅ Sample data available ($($sampleFiles.Count) files)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Sample data directory empty" -ForegroundColor Yellow
        Write-Host "     Run: .\scripts\seed-data.ps1" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ Sample data not found" -ForegroundColor Yellow
    Write-Host "     Run: .\scripts\seed-data.ps1" -ForegroundColor Yellow
}

# Final results
Write-Host ""
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""

if ($allChecks) {
    Write-Host "🎉 Installation verification completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your DataScraper Pro installation is ready to use!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start the application: .\scripts\dev.ps1"
    Write-Host "2. Open http://localhost:5000 in your browser"
    Write-Host "3. Explore the sample project and AI features"
    Write-Host ""
    Write-Host "If you need to load sample data: .\scripts\seed-data.ps1" -ForegroundColor Gray
} else {
    Write-Host "❌ Installation verification found issues." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please address the issues above and run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Cyan
    Write-Host "1. Install dependencies: npm install"
    Write-Host "2. Set up database: .\scripts\setup-supabase.ps1"
    Write-Host "3. Configure API keys in .env file"
    Write-Host "4. Load sample data: .\scripts\seed-data.ps1"
    Write-Host ""
    Write-Host "For detailed help, see: docs/GETTING_STARTED.md" -ForegroundColor Gray
}

Write-Host ""