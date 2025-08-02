# Simple setup runner script
# This is the main entry point for Windows setup

Write-Host "🚀 LeviatanCode Setup Starting..." -ForegroundColor Green

# Create scripts directory if needed
.\scripts\create-scripts-folder.ps1

# Run the main setup
python scripts/setup-windows.py

Write-Host "✨ Setup completed! Run 'npm run windev' to start." -ForegroundColor Green