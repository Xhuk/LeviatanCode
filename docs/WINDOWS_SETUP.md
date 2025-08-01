# Windows Setup Guide

This guide will help you set up and run the DataScraper Pro application on Windows using PowerShell.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Git** (optional, for version control)
   - Download from [git-scm.com](https://git-scm.com/)

3. **Supabase CLI** (for database management)
   - Install via npm: `npm install -g supabase`
   - Or download from [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

## Quick Start

1. **Clone or download the project**
   ```powershell
   git clone <repository-url>
   cd datascraper-pro
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up environment variables**
   ```powershell
   copy .env.example .env
   ```
   Edit `.env` file with your configuration (see Environment Setup below)

4. **Set up database**
   ```powershell
   # Option A: Use Supabase (recommended)
   .\scripts\setup-supabase.ps1

   # Option B: Use local PostgreSQL
   .\scripts\setup-local-db.ps1
   ```

5. **Seed sample data**
   ```powershell
   .\scripts\seed-data.ps1
   ```

6. **Start the application**
   ```powershell
   npm run dev
   ```

7. **Open in browser**
   - Navigate to: http://localhost:5000

## Environment Setup

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/[database]

# AI Service API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
NODE_ENV=development
PORT=5000
```

### Getting API Keys

1. **OpenAI API Key**
   - Go to [platform.openai.com](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy and paste into your `.env` file

2. **Gemini API Key**
   - Go to [aistudio.google.com](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy and paste into your `.env` file

## Database Options

### Option A: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string from "Connection string" → "Transaction pooler"
4. Replace `[YOUR-PASSWORD]` with your database password
5. Use this as your `DATABASE_URL` in `.env`

### Option B: Local PostgreSQL

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Create a database named `datascraper_pro`
3. Use connection string: `postgresql://postgres:password@localhost:5432/datascraper_pro`

## PowerShell Scripts

The project includes several PowerShell scripts for easy setup and management:

- `.\scripts\setup-supabase.ps1` - Set up Supabase database
- `.\scripts\setup-local-db.ps1` - Set up local PostgreSQL
- `.\scripts\seed-data.ps1` - Load sample data
- `.\scripts\dev.ps1` - Start development server
- `.\scripts\build.ps1` - Build for production
- `.\scripts\reset-db.ps1` - Reset database and reload sample data

## Troubleshooting

### PowerShell Execution Policy

If you get execution policy errors, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

If port 5000 is already in use:
1. Change `PORT=5001` in your `.env` file
2. Or kill the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

### Database Connection Issues

1. Verify your `DATABASE_URL` is correct
2. Check if the database server is running
3. Ensure your IP is allowed (for Supabase)
4. Test connection: `.\scripts\test-db.ps1`

### Missing Dependencies

If you encounter missing package errors:
```powershell
# Clear npm cache and reinstall
npm cache clean --force
Remove-Item node_modules -Recurse -Force
npm install
```

## Development Workflow

1. **Start development server**
   ```powershell
   npm run dev
   # or
   .\scripts\dev.ps1
   ```

2. **View logs**
   - Application logs appear in PowerShell
   - Browser developer console for frontend issues

3. **Database management**
   ```powershell
   # View database schema
   .\scripts\show-schema.ps1
   
   # Reset with fresh data
   .\scripts\reset-db.ps1
   ```

4. **Testing AI features**
   - Ensure API keys are set in `.env`
   - Test in the AI Chat panel
   - Check PowerShell logs for API call details

## Production Deployment

For production deployment on Windows Server:

1. **Build the application**
   ```powershell
   .\scripts\build.ps1
   ```

2. **Set production environment**
   ```env
   NODE_ENV=production
   ```

3. **Use a process manager**
   ```powershell
   # Install PM2
   npm install -g pm2
   
   # Start application
   pm2 start ecosystem.config.js
   ```

## Windows-Specific Notes

- Use PowerShell (not Command Prompt) for best compatibility
- Paths use backslashes (`\`) in Windows
- Some npm packages may require Windows Build Tools
- Antivirus software may interfere with file watching (add project folder to exclusions)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PowerShell error messages
3. Ensure all prerequisites are installed
4. Verify environment variables are set correctly
5. Check that required ports are available