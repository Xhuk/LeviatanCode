# Database Connection Test Script
# This script tests the database connection for DataScraper Pro

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "DataScraper Pro - Database Connection Test" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\test-db.ps1 [-Help]"
    Write-Host ""
    Write-Host "This script tests your database connection and displays basic information."
    exit 0
}

Write-Host "🔍 DataScraper Pro - Database Connection Test" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found." -ForegroundColor Red
    Write-Host "Please run .\scripts\setup-supabase.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Load environment variables
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $envVars[$matches[1]] = $matches[2]
    }
}

if (-not $envVars.DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in .env file." -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database Configuration:" -ForegroundColor Cyan
Write-Host "Database URL: $($envVars.DATABASE_URL -replace 'postgresql://[^:]+:[^@]+@', 'postgresql://***:***@')" -ForegroundColor Gray
Write-Host ""

# Create test script
$testScript = @"
const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await client.query('SELECT version(), current_database(), current_user');
    
    console.log('');
    console.log('📊 Database Information:');
    console.log('Version:', result.rows[0].version.split(' ').slice(0, 2).join(' '));
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    
    // Test table existence
    console.log('');
    console.log('🏗️ Checking tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('Found tables:');
      tables.rows.forEach(row => console.log('  -', row.table_name));
    } else {
      console.log('⚠️ No tables found. You may need to run migrations.');
      console.log('Run: npm run db:push');
    }
    
    console.log('');
    console.log('✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('');
      console.error('💡 This usually means:');
      console.error('  - Check your internet connection');
      console.error('  - Verify the database host in your DATABASE_URL');
      console.error('  - Ensure your Supabase project is active');
    } else if (error.code === '28P01') {
      console.error('');
      console.error('💡 Authentication failed:');
      console.error('  - Check your database password');
      console.error('  - Verify your DATABASE_URL credentials');
    } else if (error.code === '3D000') {
      console.error('');
      console.error('💡 Database does not exist:');
      console.error('  - Check your database name in DATABASE_URL');
      console.error('  - Verify your Supabase project configuration');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Set environment variable from .env
require('dotenv').config();
testConnection();
"@

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies first..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

# Run the test
$testScript | Out-File -FilePath "temp_db_test.js" -Encoding UTF8
node temp_db_test.js
$exitCode = $LASTEXITCODE
Remove-Item "temp_db_test.js" -Force

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "🎉 Database connection test passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your database is ready. You can now:" -ForegroundColor Cyan
    Write-Host "1. Load sample data: .\scripts\seed-data.ps1"
    Write-Host "2. Start the application: .\scripts\dev.ps1"
} else {
    Write-Host "❌ Database connection test failed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and:" -ForegroundColor Yellow
    Write-Host "1. Verify your .env file configuration"
    Write-Host "2. Check your Supabase project status"
    Write-Host "3. Ensure your database credentials are correct"
    Write-Host ""
    Write-Host "For help, see docs/WINDOWS_SETUP.md" -ForegroundColor Cyan
}