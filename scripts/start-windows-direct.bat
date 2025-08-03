@echo off
echo Starting LeviatanCode on Windows (Port 5005) - Direct Mode
echo ======================================================

REM Set environment variables for Windows development
set NODE_ENV=development
set PORT=5005

REM Clear any conflicting environment variables
set REPLIT=
set REPL_ID=
set REPLIT_ID=

echo Environment configured:
echo NODE_ENV=%NODE_ENV%
echo PORT=%PORT%
echo.

echo NOTE: This is direct mode - Flask will auto-start from Node.js
echo For manual Flask control, use start-windows.bat instead
echo.

echo Starting server...
npx tsx server/index.ts

pause