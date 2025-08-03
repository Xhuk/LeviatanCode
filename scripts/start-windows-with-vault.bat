@echo off
title LeviatanCode with Encrypted Vault
echo ====================================================
echo 🔐 Starting LeviatanCode with Encrypted Vault
echo ====================================================
echo.

cd /d "%~dp0\.."

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)

REM Start with vault-first startup script
echo 🚀 Starting with encrypted vault as primary config...
python scripts/start-with-secrets-manager.py

if errorlevel 1 (
    echo.
    echo ❌ Startup failed. Trying manual approach...
    echo.
    echo 💡 Manual steps:
    echo 1. Run: python secrets_manager.py (to manage your vault)
    echo 2. Run: npm run dev (to start the application)
    echo.
    pause
)