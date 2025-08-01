# LeviatanCode - Windows Setup Guide

This guide will help you set up LeviatanCode on your Windows machine for local development.

## 🚀 Quick Setup (Automated)

### Option 1: PowerShell Script (Recommended)
Run this command in PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup-windows.ps1
```

### Option 2: Manual Setup
Follow the manual instructions below if you prefer to install components individually.

## 📋 Prerequisites

### Required Software
- **Windows 10/11** (64-bit)
- **PowerShell 5.1+** (usually pre-installed)
- **Internet connection** for downloading dependencies

### Required Accounts & API Keys
- **Supabase Account** - [Sign up here](https://supabase.com/dashboard)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)
- **Gemini API Key** - [Get one here](https://aistudio.google.com/app/apikey)

## 🔧 Manual Installation

### 1. Install Node.js
Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

```powershell
# Verify installation
node --version
npm --version
```

### 2. Install Git
Download and install Git from [git-scm.com](https://git-scm.com/download/win)

```powershell
# Verify installation
git --version
```

### 3. Clone the Repository
```powershell
git clone <your-repository-url>
cd leviatancode
```

### 4. Install Project Dependencies
```powershell
npm install
```

### 5. Environment Configuration

#### Copy Environment Template
```powershell
copy .env.example .env
```

#### Edit .env File
Open `.env` in your favorite text editor and configure:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:6543/postgres?sslmode=require

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

### 6. Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose organization and fill project details
   - Wait for setup to complete

2. **Get Database URL**
   - Go to Settings → Database
   - Find "Connection string" section
   - Copy the "Transaction pooler" URI
   - Replace `[YOUR-PASSWORD]` with your database password
   - Paste into `.env` file as `DATABASE_URL`

### 7. API Keys Setup

#### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Log in or create account
3. Click "Create new secret key"
4. Copy the key and add to `.env` as `OPENAI_API_KEY`

#### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Log in with Google account
3. Click "Create API Key"
4. Copy the key and add to `.env` as `GEMINI_API_KEY`

## 🏃‍♂️ Running the Application

### Development Mode
```powershell
npm run dev
```

### Production Mode
```powershell
npm run build
npm start
```

### Access the Application
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Logs**: Check `logs/access.log`

## 🛠️ Middleware Features

The application includes several middleware components for local development:

### Security Middleware
- **Helmet.js** - Security headers
- **Rate limiting** - API protection
- **CORS** - Cross-origin requests

### Session Management
- **Express sessions** - User state management
- **Memory store** - Session storage
- **Secure cookies** - Production-ready settings

### Logging
- **Morgan** - HTTP request logging
- **File logging** - Access logs to `logs/` directory
- **Colored console** - Development logging

### Error Handling
- **Global error handler** - Centralized error processing
- **404 handler** - Missing route handling
- **Validation errors** - User-friendly error messages

## 🔍 Troubleshooting

### Common Issues

#### "PowerShell execution policy" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### "npm not recognized" error
- Restart PowerShell after Node.js installation
- Check PATH environment variable includes Node.js

#### Database connection error
- Verify Supabase DATABASE_URL is correct
- Check if password contains special characters (URL encode them)
- Ensure your IP is not blocked by Supabase

#### API key errors
- Verify API keys are valid and active
- Check for extra spaces or quotes in `.env`
- Ensure you have sufficient API credits

### Port Conflicts
If port 5000 is in use:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=3000
```

### Logs and Debugging
```powershell
# View application logs
Get-Content logs\access.log -Tail 20

# View console output with colors
npm run dev

# Enable verbose logging
$env:LOG_LEVEL="debug"
npm run dev
```

## 🚀 Development Tips

### Recommended Tools
- **VS Code** - Code editor with extensions
- **Windows Terminal** - Modern terminal experience
- **Postman** - API testing
- **DB Browser** - Database management (optional)

### VS Code Extensions
- **TypeScript and JavaScript**
- **Tailwind CSS IntelliSense**
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **Auto Rename Tag**

### Performance Optimization
```powershell
# Enable Windows Developer Mode
# Settings > Update & Security > For developers > Developer mode

# Exclude project folder from Windows Defender
# Windows Security > Virus & threat protection > Exclusions
```

## 📞 Support

If you encounter issues:

1. **Check logs** in `logs/access.log`
2. **Verify environment** variables in `.env`
3. **Test API keys** individually
4. **Check Windows version** compatibility
5. **Review PowerShell permissions**

## 🎯 Next Steps

After successful setup:
1. **Import a project** using the Import Project button
2. **Test AI analysis** with sample code
3. **Configure Git** for project imports
4. **Explore documentation** generation features
5. **Set up deployment** pipeline (optional)

---

**Note**: This setup is optimized for Windows development. For production deployment, consider using Docker or cloud platforms with proper environment configurations.