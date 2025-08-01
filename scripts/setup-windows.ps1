# LeviatanCode Windows Setup Script
# This script sets up the complete development environment on Windows

param(
    [switch]$SkipNodeInstall,
    [switch]$SkipGitInstall,
    [switch]$Verbose
)

Write-Host "🚀 Setting up LeviatanCode development environment on Windows..." -ForegroundColor Green

# Function to check if running as administrator
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]$currentUser
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to install Chocolatey if not present
function Install-Chocolatey {
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
    }
}

# Function to install Node.js
function Install-NodeJS {
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Installing Node.js..." -ForegroundColor Yellow
        choco install nodejs -y
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        $nodeVersion = node --version
        Write-Host "✅ Node.js already installed: $nodeVersion" -ForegroundColor Green
    }
}

# Function to install Git
function Install-Git {
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "📦 Installing Git..." -ForegroundColor Yellow
        choco install git -y
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        $gitVersion = git --version
        Write-Host "✅ Git already installed: $gitVersion" -ForegroundColor Green
    }
}

# Function to install PostgreSQL (optional)
function Install-PostgreSQL {
    $installPostgres = Read-Host "Do you want to install PostgreSQL locally? (y/n) [Recommended: Use Supabase instead]"
    if ($installPostgres -eq 'y') {
        Write-Host "📦 Installing PostgreSQL..." -ForegroundColor Yellow
        choco install postgresql -y
        Write-Host "✅ PostgreSQL installed. You'll need to configure it manually." -ForegroundColor Green
    } else {
        Write-Host "⏭️  Skipping PostgreSQL installation. Use Supabase for database." -ForegroundColor Yellow
    }
}

# Function to setup project dependencies
function Setup-ProjectDependencies {
    Write-Host "📦 Installing project dependencies..." -ForegroundColor Yellow
    
    if (Test-Path "package.json") {
        npm install
        Write-Host "✅ NPM dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json not found. Make sure you're in the project directory." -ForegroundColor Red
        exit 1
    }
}

# Function to create .env file
function Setup-Environment {
    Write-Host "🔧 Setting up environment configuration..." -ForegroundColor Yellow
    
    if (!(Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host "📝 Created .env file from .env.example" -ForegroundColor Green
            Write-Host "⚠️  Please edit .env file and add your API keys:" -ForegroundColor Yellow
            Write-Host "   - DATABASE_URL (Supabase connection string)" -ForegroundColor White
            Write-Host "   - OPENAI_API_KEY (from https://platform.openai.com/api-keys)" -ForegroundColor White
            Write-Host "   - GEMINI_API_KEY (from https://aistudio.google.com/app/apikey)" -ForegroundColor White
        } else {
            Write-Host "❌ .env.example not found" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ .env file already exists" -ForegroundColor Green
    }
}

# Function to create logs directory
function Setup-Logs {
    if (!(Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs"
        Write-Host "✅ Created logs directory" -ForegroundColor Green
    }
}

# Function to test the setup
function Test-Setup {
    Write-Host "🧪 Testing setup..." -ForegroundColor Yellow
    
    # Test Node.js
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeVersion = node --version
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
    }
    
    # Test npm
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        $npmVersion = npm --version
        Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm not found" -ForegroundColor Red
    }
    
    # Test Git
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitVersion = git --version
        Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Git not found" -ForegroundColor Red
    }
    
    # Test project dependencies
    if (Test-Path "node_modules") {
        Write-Host "✅ Project dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Project dependencies not installed" -ForegroundColor Red
    }
}

# Main execution
try {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check if running as administrator
    if (!(Test-Admin)) {
        Write-Host "⚠️  This script should be run as Administrator for best results." -ForegroundColor Yellow
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne 'y') {
            exit 1
        }
    }
    
    # Install Chocolatey
    Install-Chocolatey
    
    # Install Node.js
    if (!$SkipNodeInstall) {
        Install-NodeJS
    }
    
    # Install Git
    if (!$SkipGitInstall) {
        Install-Git
    }
    
    # Optional: Install PostgreSQL
    Install-PostgreSQL
    
    # Setup project
    Setup-ProjectDependencies
    Setup-Environment
    Setup-Logs
    
    # Test the setup
    Test-Setup
    
    Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Edit .env file with your API keys" -ForegroundColor White
    Write-Host "   2. Run: npm run dev" -ForegroundColor White
    Write-Host "   3. Open: http://localhost:5000" -ForegroundColor White
    Write-Host "`n🔗 Quick links:" -ForegroundColor Yellow
    Write-Host "   • Supabase: https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "   • OpenAI API: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "   • Gemini API: https://aistudio.google.com/app/apikey" -ForegroundColor White
    
} catch {
    Write-Host "❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}