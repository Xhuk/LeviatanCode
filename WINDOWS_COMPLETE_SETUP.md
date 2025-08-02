# LeviatanCode - Complete Windows Setup Guide

This guide will set up LeviatanCode with all integrations, database connections, API keys, and seed data for a fully functional AI-powered development environment on Windows.

## Prerequisites

Before starting, ensure you have:
- Windows 10/11 with PowerShell 5.1 or later
- Git installed
- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Clone and Initial Setup

```powershell
# Clone the repository
git clone <your-repo-url> LeviatanCode
cd LeviatanCode

# Install dependencies
npm install
```

## Step 2: Supabase Database Setup

### 2.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Click "New Project"
3. Choose an organization and enter project details:
   - Name: `LeviatanCode`
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to your location
4. Wait for project creation (2-3 minutes)

### 2.2 Get Database Connection String
1. In your new project, click "Connect" in the top toolbar
2. Go to "Connection string" → "Transaction pooler"
3. Copy the URI (it looks like: `postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres`)
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 2.3 Configure Database Connection
1. Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

2. Edit `.env` and add your database URL:
```env
DATABASE_URL=postgresql://postgres.xxxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

## Step 3: API Keys Setup

### 3.1 OpenAI API Key (Recommended)
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key and add to `.env`:
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.2 Google Gemini API Key (Alternative)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and add to `.env`:
```env
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.3 Final Environment Configuration
Your `.env` file should look like this:
```env
# Database
DATABASE_URL=postgresql://postgres.xxxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# AI Services (choose one or both)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application
NODE_ENV=development
PORT=5005
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

## Step 4: Database Schema and Seed Data

Run the setup script:
```powershell
python scripts/setup-windows.py
```

This script will:
- Create all database tables
- Seed initial data
- Verify connections
- Test API integrations

## Step 5: Start the Application

```powershell
npm run windev
```

The application will be available at: http://localhost:5005

## Step 6: Verify Installation

### 6.1 Check Database Connection
- Go to your Supabase project dashboard
- Navigate to "Table Editor"
- You should see tables: `users`, `projects`, `ai_chats`, `messages`, etc.

### 6.2 Test AI Integration
- Open LeviatanCode in your browser
- Try the AI chat feature
- Import a sample project
- Verify project analysis works

### 6.3 Test Project Import
- Click "Import Project"
- Try both file upload and Git repository import
- Verify project insights are saved

## Troubleshooting

### Database Connection Issues
```powershell
# Test database connection
npm run test:db
```

### API Key Issues
```powershell
# Test AI services
npm run test:ai
```

### Port Conflicts
If port 5005 is in use, change it in `.env`:
```env
PORT=3000
```

### Windows Firewall
If you can't access the application:
1. Allow Node.js through Windows Firewall
2. Or temporarily disable firewall for testing

## Features Now Available

After setup, you'll have:
- ✅ Full AI chat integration with OpenAI/Gemini
- ✅ Real project import from files and Git repositories  
- ✅ Persistent database storage with Supabase
- ✅ Project insights and metadata system
- ✅ Intelligent project analysis and execution guidance
- ✅ User authentication and session management
- ✅ File system integration for project management
- ✅ Real-time AI debugging assistance

## Next Steps

1. **Customize AI Prompts**: Edit prompts in `src/hooks/use-prompt-templates.ts`
2. **Add Project Templates**: Create templates in the database
3. **Configure Git Integration**: Set up Git credentials for private repos
4. **Deploy to Production**: Follow the deployment guide when ready

## Security Notes

- Never commit your `.env` file to Git
- Use strong, unique passwords for your database
- Rotate API keys regularly
- Consider using environment-specific configurations for production

## Support

If you encounter issues:
1. Check the console logs in the browser
2. Check the server logs in your terminal
3. Verify all environment variables are set correctly
4. Ensure your Supabase project is active and accessible