@echo off
title LeviatanCode Secrets Manager
echo Starting LeviatanCode Secrets Manager...
echo.
cd /d "%~dp0"
python secrets_manager.py
if errorlevel 1 (
    echo.
    echo Error: Failed to start Secrets Manager
    echo Make sure Python and required packages are installed
    echo.
    pause
)