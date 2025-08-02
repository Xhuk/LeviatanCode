# Windows Port 5005 Configuration Fix

## The Problem
The server was starting on port 5000 instead of 5005 because the Replit environment variable was overriding the .env file setting.

## Solutions

### Option 1: Use the Windows Batch Script
```bash
scripts\start-windows-direct.bat
```

This script:
- Sets PORT=5005 explicitly
- Clears Replit environment variables 
- Starts the server with the correct configuration

### Option 2: Manual Environment Override
```bash
# Set the port explicitly before starting
set PORT=5005
set NODE_ENV=development
npm run windev
```

### Option 3: PowerShell Version
```powershell
$env:PORT="5005"
$env:NODE_ENV="development"
npm run windev
```

### Option 4: Updated Server Detection
The server now automatically detects Windows/local development and uses port 5005:
```bash
npm run windev
```

## Verification
After starting, you should see:
```
[INFO] Windows/Local development detected - using port 5005
[express] serving on port 5005
```

Then access: http://localhost:5005

## Why This Happened
- Replit sets PORT=5000 as a system environment variable
- This overrides .env file settings
- Windows local development needs explicit port override
- The detection logic now identifies local vs. Replit environments

## Quick Test
Run this to verify your environment:
```bash
node scripts/test-env.js
```

This will show all PORT-related environment variables and help identify conflicts.