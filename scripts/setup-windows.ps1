# LeviatanCode Windows Setup Script
# This script sets up the complete development environment

Write-Host "========================================" -ForegroundColor Green
Write-Host "LeviatanCode Windows Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "This script should be run as Administrator for best results."
    Write-Host "Continuing with current permissions..." -ForegroundColor Yellow
}

# Check prerequisites
Write-Host "`n1. Checking Prerequisites..." -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git version: $gitVersion" -ForegroundColor Green
} catch {
    Write-Error "❌ Git not found. Please install Git first."
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Error "❌ .env file not found. Please copy .env.example to .env and configure it first."
    Write-Host "Run: Copy-Item .env.example .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Prerequisites check completed" -ForegroundColor Green

# Install dependencies
Write-Host "`n2. Installing Dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to install dependencies"
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Load environment variables
Write-Host "`n3. Loading Environment Configuration..." -ForegroundColor Cyan
$envContent = Get-Content ".env" -Raw
$envLines = $envContent -split "`n"
foreach ($line in $envLines) {
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line -split "=", 2
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# Check required environment variables
$requiredVars = @("DATABASE_URL")
$optionalVars = @("OPENAI_API_KEY", "GEMINI_API_KEY")

foreach ($var in $requiredVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if (-not $value) {
        Write-Error "❌ Required environment variable $var is not set"
        exit 1
    }
    Write-Host "✅ $var is configured" -ForegroundColor Green
}

$hasAIKey = $false
foreach ($var in $optionalVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Host "✅ $var is configured" -ForegroundColor Green
        $hasAIKey = $true
    }
}

if (-not $hasAIKey) {
    Write-Warning "⚠️ No AI API keys found. AI features will not work."
    Write-Host "Please add OPENAI_API_KEY or GEMINI_API_KEY to your .env file" -ForegroundColor Yellow
}

# Generate database migrations
Write-Host "`n4. Setting Up Database..." -ForegroundColor Cyan
Write-Host "Generating database migrations..." -ForegroundColor Yellow
npx drizzle-kit generate
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to generate database migrations"
    exit 1
}

Write-Host "Running database migrations..." -ForegroundColor Yellow
npx drizzle-kit migrate
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to run database migrations"
    exit 1
}
Write-Host "✅ Database setup completed" -ForegroundColor Green

# Create test script for database connection
Write-Host "`n5. Creating Test Scripts..." -ForegroundColor Cyan

$testDbScript = @"
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

async function testDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        // Test connection
        const result = await sql``SELECT 1 as test``;
        console.log('✅ Database connection successful');
        console.log('Connection result:', result);
        
        // Test tables exist
        const tables = await sql``
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ``;
        console.log('✅ Available tables:', tables.map(t => t.table_name));
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testDatabase();
"@

$testDbScript | Out-File -FilePath "scripts/test-db.js" -Encoding UTF8

# Create test script for AI services
$testAIScript = @"
async function testAI() {
    try {
        if (process.env.OPENAI_API_KEY) {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say "OpenAI connection successful"' }],
                max_tokens: 10
            });
            
            console.log('✅ OpenAI connection successful');
            console.log('Response:', response.choices[0].message.content);
        }
        
        if (process.env.GEMINI_API_KEY) {
            const { GoogleGenAI } = await import('@google/genai');
            const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Say "Gemini connection successful"'
            });
            
            console.log('✅ Gemini connection successful');
            console.log('Response:', response.text);
        }
        
        if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
            console.log('⚠️ No AI API keys configured');
        }
        
    } catch (error) {
        console.error('❌ AI service test failed:', error.message);
    }
}

testAI();
"@

$testAIScript | Out-File -FilePath "scripts/test-ai.js" -Encoding UTF8

Write-Host "✅ Test scripts created" -ForegroundColor Green

# Test database connection
Write-Host "`n6. Testing Database Connection..." -ForegroundColor Cyan
node scripts/test-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Database connection test failed"
    exit 1
}

# Test AI services
Write-Host "`n7. Testing AI Services..." -ForegroundColor Cyan
node scripts/test-ai.js

# Seed database with sample data
Write-Host "`n8. Seeding Database..." -ForegroundColor Cyan

$seedScript = @"
const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');
const { users, projects, aiChats, messages } = require('../shared/schema');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        const db = drizzle(sql);
        
        console.log('Seeding database with sample data...');
        
        // Create demo user
        const hashedPassword = await bcrypt.hash('demo123', 10);
        
        await db.insert(users).values({
            id: 'demo-user-1',
            username: 'demo',
            passwordHash: hashedPassword,
            createdAt: new Date()
        }).onConflictDoNothing();
        
        // Create demo project
        await db.insert(projects).values({
            id: 'demo-project-1',
            name: 'ProductData_Analysis',
            description: 'Sample data analysis project with Python and Jupyter notebooks',
            userId: 'demo-user-1',
            createdAt: new Date(),
            updatedAt: new Date()
        }).onConflictDoNothing();
        
        // Create sample AI chat
        const chatId = 'demo-chat-1';
        await db.insert(aiChats).values({
            id: chatId,
            projectId: 'demo-project-1',
            title: 'Getting Started',
            createdAt: new Date(),
            updatedAt: new Date()
        }).onConflictDoNothing();
        
        // Add sample messages
        await db.insert(messages).values([
            {
                id: 'msg-1',
                chatId: chatId,
                role: 'user',
                content: 'How do I run this Python project?',
                createdAt: new Date()
            },
            {
                id: 'msg-2', 
                chatId: chatId,
                role: 'assistant',
                content: 'This appears to be a Python data analysis project. To run it, you should first install the dependencies with `pip install -r requirements.txt`, then start Jupyter with `jupyter notebook` to open the analysis notebooks.',
                createdAt: new Date()
            }
        ]).onConflictDoNothing();
        
        console.log('✅ Database seeded successfully');
        console.log('Demo user: username=demo, password=demo123');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        process.exit(1);
    }
}

seedDatabase();
"@

$seedScript | Out-File -FilePath "scripts/seed-db.js" -Encoding UTF8
node scripts/seed-db.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Database seeding failed"
    exit 1
}

# Create package.json scripts
Write-Host "`n9. Adding Useful Scripts..." -ForegroundColor Cyan

# Read current package.json
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

# Add test scripts if they don't exist
if (-not $packageJson.scripts.'test:db') {
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'test:db' -Value 'node scripts/test-db.js'
}
if (-not $packageJson.scripts.'test:ai') {
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'test:ai' -Value 'node scripts/test-ai.js'
}
if (-not $packageJson.scripts.'seed:db') {
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'seed:db' -Value 'node scripts/seed-db.js'
}
if (-not $packageJson.scripts.'windev') {
    $packageJson.scripts | Add-Member -MemberType NoteProperty -Name 'windev' -Value 'cross-env NODE_ENV=development tsx server/index.ts'
}

# Save updated package.json
$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding UTF8

Write-Host "✅ Scripts added to package.json" -ForegroundColor Green

# Final setup completion
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nTo start the application:" -ForegroundColor Cyan
Write-Host "npm run windev" -ForegroundColor White

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "npm run test:db    # Test database connection" -ForegroundColor White
Write-Host "npm run test:ai    # Test AI services" -ForegroundColor White
Write-Host "npm run seed:db    # Re-seed database" -ForegroundColor White

Write-Host "`nApplication will be available at:" -ForegroundColor Cyan
Write-Host "http://localhost:5005" -ForegroundColor White

Write-Host "`nDemo login credentials:" -ForegroundColor Cyan
Write-Host "Username: demo" -ForegroundColor White
Write-Host "Password: demo123" -ForegroundColor White

Write-Host "`n✨ LeviatanCode is ready to use!" -ForegroundColor Green