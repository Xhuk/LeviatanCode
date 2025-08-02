# 🚀 LeviatanCode - Quick Start Guide

Get LeviatanCode running on your Windows machine in under 10 minutes!

## One-Command Setup

```powershell
# Clone the repo and run the setup script
git clone <your-repo-url> LeviatanCode
cd LeviatanCode
Copy-Item .env.example .env
# Edit .env with your database URL and API keys (see below)
.\scripts\setup-windows.ps1
```

## Required Configuration

### 1. Database (Supabase)
1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Get connection string from "Connect" → "Transaction pooler"
4. Add to `.env`:
```env
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres
```

### 2. AI Service (Choose One)

**Option A: OpenAI (Recommended)**
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B: Google Gemini**
```env  
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Session Secret
```env
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

## Start Development

```powershell
npm run dev
```

Open: http://localhost:5000

## Default Login
- Username: `demo`
- Password: `demo123`

## Features You Get

✅ **AI-Powered Chat** - Real ChatGPT/Gemini integration  
✅ **Project Import** - Upload files or clone Git repos  
✅ **Smart Analysis** - AI detects how to run any project  
✅ **Database Storage** - All data persists in Supabase  
✅ **Security** - Rate limiting, sessions, CORS protection  
✅ **Windows Optimized** - PowerShell scripts and setup  

## Troubleshooting

**Database issues?**
```powershell
npm run test:db
```

**AI not working?**
```powershell
npm run test:ai
```

**Port conflicts?**
Change `PORT=3000` in `.env`

## What's Included

- **Complete setup script** that handles everything
- **Database migrations** automatically applied
- **Seed data** with demo project and user
- **AI integration** with real OpenAI/Gemini APIs
- **Security middleware** production-ready
- **Error handling** comprehensive logging
- **Test scripts** for verifying everything works

## Next Steps

1. **Try the AI chat** - Ask it to analyze a project
2. **Import a project** - Upload files or clone a Git repo  
3. **Explore insights** - See how AI understands your code
4. **Save projects** - Use the save button to persist metadata
5. **Customize prompts** - Edit AI behavior in settings

Ready to build something amazing! 🎉