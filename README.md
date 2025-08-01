# DataScraper Pro

A comprehensive Replit-style IDE for data scraping and analysis with AI-powered features. Built for Windows with PowerShell support and Supabase integration.

## Features

- 🕷️ **Web Scraping**: Visual scraping configuration with real-time preview
- 🤖 **AI Assistant**: ChatGPT and Gemini integration for code analysis and debugging
- 📝 **Prompt Management**: Customizable AI prompt templates with variables
- 📊 **Data Analysis**: Built-in tools for analyzing scraped data
- 🔍 **File System Integration**: AI can read and analyze your project files
- 📚 **Auto Documentation**: AI-generated documentation for your code
- 🎨 **Modern UI**: Replit-inspired dark theme with shadcn/ui components

## Quick Start (Windows)

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** (optional) ([Download](https://git-scm.com/))
- **PowerShell** (included with Windows)

### Installation

1. **Clone or download the project**
   ```powershell
   git clone <repository-url>
   cd datascraper-pro
   ```

2. **Install dependencies**
   ```powershell
   npm install
   ```

3. **Set up database (Supabase)**
   ```powershell
   .\scripts\setup-supabase.ps1
   ```
   Follow the prompts to configure your Supabase database.

4. **Load sample data**
   ```powershell
   .\scripts\seed-data.ps1
   ```

5. **Start the application**
   ```powershell
   .\scripts\dev.ps1
   ```

6. **Open in browser**
   - Navigate to: http://localhost:5000

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Application
NODE_ENV=development
PORT=5000
```

### Getting API Keys

1. **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. **Gemini**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## PowerShell Scripts

Convenient scripts for Windows development:

```powershell
# Setup and Configuration
.\scripts\setup-supabase.ps1    # Configure Supabase database
.\scripts\seed-data.ps1         # Load sample data
.\scripts\test-db.ps1           # Test database connection

# Development
.\scripts\dev.ps1               # Start development server
.\scripts\build.ps1             # Build for production
.\scripts\reset-db.ps1          # Reset database with fresh data
```

## Project Structure

```
datascraper-pro/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express backend
│   ├── services/           # Business logic
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data access layer
├── shared/                 # Shared types and schemas
├── scripts/                # PowerShell automation scripts
├── docs/                   # Documentation
└── sample-data/            # Sample project data
```

## Core Features

### AI-Powered Development

- **Contextual AI**: AI assistant can read your project files for accurate help
- **Code Analysis**: Review, debug, explain, and optimize your code
- **Prompt Templates**: Reusable prompts with variable substitution
- **Smart Suggestions**: AI recommendations based on your project structure

### Web Scraping Tools

- **Visual Configuration**: Point-and-click selector configuration
- **Real-time Preview**: See scraping results instantly
- **Data Validation**: Built-in validation and cleaning tools
- **Export Options**: Multiple formats for scraped data

### Development Environment

- **Monaco Editor**: Full-featured code editor with syntax highlighting
- **File Management**: Create, edit, and organize project files
- **Live Reload**: Automatic updates during development
- **Dark Theme**: Replit-inspired interface design

## Usage Examples

### Creating a Scraping Project

1. **New Project**: Click "New Project" in the dashboard
2. **Configure Target**: Add target URLs and CSS selectors
3. **Test Scraping**: Use the preview to validate selectors
4. **Run Analysis**: Let AI analyze the scraped data
5. **Generate Documentation**: Auto-create project documentation

### Using AI Features

1. **File Analysis**: Click the paperclip icon in AI chat to analyze specific files
2. **Debug Issues**: Ask "debug my scraper.js file" for automated debugging
3. **Code Review**: Use prompt templates for consistent code reviews
4. **Documentation**: Generate README files and code comments automatically

## Deployment

### Development
```powershell
.\scripts\dev.ps1
```

### Production Build
```powershell
.\scripts\build.ps1
npm run start
```

### Process Management (PM2)
```powershell
npm install -g pm2
pm2 start ecosystem.config.js --env production
```

## Troubleshooting

### Common Issues

1. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Port Already in Use**
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID [PID_NUMBER] /F
   ```

3. **Database Connection Issues**
   ```powershell
   .\scripts\test-db.ps1  # Test your connection
   ```

4. **Missing Dependencies**
   ```powershell
   npm cache clean --force
   Remove-Item node_modules -Recurse -Force
   npm install
   ```

### Getting Help

1. Check the [Windows Setup Guide](docs/WINDOWS_SETUP.md)
2. Run database tests: `.\scripts\test-db.ps1`
3. Verify API keys in your `.env` file
4. Check PowerShell error messages for specific issues

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL (Supabase), Drizzle ORM
- **AI**: OpenAI GPT-4, Google Gemini
- **Tools**: Monaco Editor, Axios, Cheerio, React Query

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `.\scripts\test-db.ps1`
5. Build with `.\scripts\build.ps1`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Windows Compatibility

This project is specifically optimized for Windows development with:

- PowerShell automation scripts
- Windows-compatible npm scripts
- Path handling for Windows file systems
- PM2 configuration for Windows Server
- Detailed Windows setup documentation

For the best experience, use PowerShell (not Command Prompt) and ensure execution policies allow script running.