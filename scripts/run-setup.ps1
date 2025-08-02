# Simple setup runner script
# This is the main entry point for Windows setup

Write-Host "🚀 LeviatanCode Setup Starting..." -ForegroundColor Green

# Create scripts directory if needed
.\scripts\create-scripts-folder.ps1

# Run the main setup
.\scripts\setup-windows.ps1

Write-Host "✨ Setup completed! Run 'npm run dev' to start." -ForegroundColor Green