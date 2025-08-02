# LeviatanCode - Complete Windows Setup Guide

## ✅ Python-Based Setup System - Ready for Use

This project now includes a comprehensive Python-based setup system optimized for Windows development.

### Quick Start (5 Minutes)

```bash
# 1. Prerequisites
# Install Node.js 18+, Python 3.8+, Git

# 2. Clone and setup
git clone <your-repo-url> LeviatanCode
cd LeviatanCode

# 3. Environment configuration
copy .env.example .env
# Edit .env with your Supabase DATABASE_URL

# 4. Automated setup
python scripts/setup-windows-fixed.py

# 5. Validation
python scripts/windows-complete-test.py

# 6. Start development
npm run windev
```

### What's Included

✅ **Complete Python Setup System**
- Automated dependency installation
- Database schema creation
- Environment validation  
- Error handling and recovery

✅ **Windows-Optimized Scripts**
- UTF-8 encoding support
- Windows Command Prompt compatibility
- Colored console output
- Timeout handling

✅ **Comprehensive Validation**
- Environment variable checks
- Database connectivity tests
- NPM script verification
- Server startup validation

✅ **Development Tools**
- Port 5005 configuration via `npm run windev`
- Database testing: `npm run test:db`
- AI service testing: `npm run test:ai`
- Project seeding: `npm run seed:db`

### Key Features

🔧 **Better Error Handling**
- Specific error messages with solutions
- Network timeout management
- JSON-safe configuration updates

🌐 **Cross-Platform Compatibility**  
- Python scripts work on Windows, macOS, Linux
- Better subprocess management than PowerShell
- Native HTTP requests for API validation

📊 **Detailed Diagnostics**
- Component-by-component testing
- Progress tracking with colored output
- Troubleshooting guidance

### Required Configuration

**Minimum .env setup**:
```env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
PORT=5005
SESSION_SECRET=your-secret-key-here
```

**Optional AI integration**:
```env
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-key-here
```

### Troubleshooting

**Common Issues**:
- Database connection: Check Supabase project status and URL format
- Python not found: Install Python 3.8+ from python.org
- Encoding errors: Use `python scripts/windows-complete-test.py`
- Port conflicts: Ensure port 5005 is available

See `SETUP_TROUBLESHOOTING.md` for detailed solutions.

### Development Workflow

```bash
# Daily development
npm run windev           # Start server on port 5005
npm run test:db         # Test database connection
npm run test:ai         # Test AI services

# Setup validation
python scripts/windows-complete-test.py

# Full setup (one-time)
python scripts/setup-windows.py
```

### Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Drizzle ORM  
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-4o + Google Gemini
- **Development**: Port 5005 with hot reload

The Python-based setup system provides a robust, reliable foundation for Windows development with comprehensive error handling and validation.