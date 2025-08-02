# LeviatanCode Windows Python Setup Guide

## Quick Setup

```bash
# 1. Clone and setup
git clone <your-repo-url> LeviatanCode
cd LeviatanCode

# 2. Configure environment
copy .env.example .env
# Edit .env with your database URL and API keys

# 3. Run Python setup
python scripts/setup-windows.py

# 4. Validate setup
python scripts/validate-setup.py

# 5. Start development
npm run windev
```

## Python Scripts Benefits

✅ **Better Error Handling** - More detailed error messages and recovery  
✅ **Cross-Platform** - Works on Windows, macOS, Linux  
✅ **JSON Safety** - Safe package.json modification without corruption  
✅ **Network Testing** - Built-in HTTP requests for API validation  
✅ **Process Control** - Better subprocess management and timeouts  
✅ **Colored Output** - Visual progress indicators  

## Available Scripts

- `python scripts/setup-windows.py` - Complete setup
- `python scripts/validate-setup.py` - Validate all components  
- `python scripts/fix-setup-issues.py` - Fix common issues
- `npm run windev` - Start development server on port 5005
- `npm run test:db` - Test database connection
- `npm run test:ai` - Test AI services

## Validation Checks

The validation script tests:
1. **Environment** - .env file and required variables
2. **Dependencies** - Node.js packages and versions
3. **Scripts** - Package.json scripts availability  
4. **Database** - Connection and schema validation
5. **AI Services** - OpenAI and Gemini API tests
6. **Server** - Port 5005 startup verification

## Development Features

- **Port 5005** - Configured for Windows development
- **AI Integration** - OpenAI GPT-4o and Google Gemini support
- **Database** - Supabase PostgreSQL with Drizzle ORM
- **Security** - Rate limiting, sessions, CORS protection
- **File System** - Project import and analysis capabilities

## Troubleshooting

**Python not found**: Install Python 3.8+ from python.org  
**Database connection fails**: Check DATABASE_URL in .env  
**AI tests fail**: Add OPENAI_API_KEY or GEMINI_API_KEY to .env  
**Server won't start**: Check if port 5005 is available  
**Dependencies missing**: Run `npm install`  

For detailed setup instructions, see `WINDOWS_COMPLETE_SETUP.md`