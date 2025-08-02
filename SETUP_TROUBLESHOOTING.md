# LeviatanCode Setup Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Connection Failed

**Error**: `Database connection failed: fetch failed`

**Causes & Solutions**:

```bash
# Check 1: Verify DATABASE_URL format
# Correct format for Supabase:
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Check 2: Test network connectivity
ping aws-0-us-east-1.pooler.supabase.com

# Check 3: Verify Supabase project is active
# Go to your Supabase dashboard and ensure project is running

# Check 4: Try direct connection test
node -e "
import('$neondatabase/serverless').then(({neon}) => {
  const sql = neon(process.env.DATABASE_URL);
  return sql\`SELECT 1\`;
}).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message));
"
```

### 2. AI Services Validation Failed

**Error**: `❌ AI services validation failed`

**Solutions**:

```bash
# Add API keys to .env file:
OPENAI_API_KEY=sk-your-openai-key-here
GEMINI_API_KEY=your-gemini-key-here

# Test individual services:
npm run test:ai
```

### 3. Server Startup Failed

**Error**: `Server startup test failed: [WinError 2] The system cannot find the file specified`

**Solutions**:

```bash
# Check Node.js installation
node --version
npm --version

# Ensure npm scripts exist
npm run windev --version

# Check port availability
netstat -an | findstr :5005

# Manual server start test
npm run windev
```

### 4. Python Script Issues

**Error**: `python: command not found`

**Solutions**:

```bash
# Install Python 3.8+ from python.org
# Verify installation:
python --version
python3 --version

# Use correct Python command:
python scripts/setup-windows.py
# OR
python3 scripts/setup-windows.py
```

### 5. Unicode/Encoding Errors

**Error**: `'charmap' codec can't decode byte`

**Solutions**:
- Use the simplified validator: `python scripts/windows-complete-test.py`
- Ensure Command Prompt supports UTF-8
- Use PowerShell instead of Command Prompt
- Set environment variable: `set PYTHONIOENCODING=utf-8`

## Quick Diagnostic Commands

```bash
# 1. Check basic requirements
node --version
npm --version
python --version

# 2. Verify file structure
dir package.json
dir .env
dir scripts

# 3. Test database format
echo %DATABASE_URL%

# 4. Run simplified validation
python scripts/windows-complete-test.py

# 5. Manual component tests
npm install
node scripts/test-db-simple.js
npm run windev
```

## Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed  
- [ ] Git installed
- [ ] .env file created and configured
- [ ] DATABASE_URL points to active Supabase project
- [ ] npm dependencies installed (`npm install`)
- [ ] Port 5005 available
- [ ] Internet connectivity for database and API calls

## Advanced Troubleshooting

### Database Connection Issues

1. **Check Supabase Status**:
   - Visit https://status.supabase.com/
   - Verify your project region is operational

2. **Test Connection Manually**:
   ```bash
   # Using psql (if installed)
   psql "postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

3. **Firewall/Network Issues**:
   - Check corporate firewall settings
   - Verify VPN isn't blocking connections
   - Try from different network

### Performance Issues

1. **Slow Setup**:
   - Use `npm ci` instead of `npm install` for faster installs
   - Clear npm cache: `npm cache clean --force`

2. **Memory Issues**:
   - Close other applications
   - Increase Node.js memory: `set NODE_OPTIONS=--max_old_space_size=4096`

## Getting Help

If issues persist:

1. Run full diagnostic: `python scripts/windows-complete-test.py`
2. Check logs in the console output
3. Verify all prerequisites are installed
4. Try the manual setup steps in `WINDOWS_COMPLETE_SETUP.md`

## Success Indicators

When everything works correctly, you should see:

```
[OK] All tests passed! Ready for development
     Run: npm run windev
```

Then access the application at: http://localhost:5005